'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase-client';

interface UserProgressContextType {
  userId: string | null;
  knownWords: string[];
  targetHskLevel: number;
  loading: boolean;
  addKnownWord: (word: string) => Promise<void>;
  removeKnownWord: (word: string) => Promise<void>;
  updateTargetHskLevel: (level: number) => Promise<void>;
  logout: () => Promise<void>;
  loginDemo: (level?: number) => Promise<void>;
  flashcardProgress: Record<string, { interval: number; repetition: number; efactor: number; dueDate: string }>;
  saveFlashcardProgress: (word: string, interval: number, repetition: number, efactor: number, dueDate: string) => Promise<void>;
  geminiApiKey: string | null;
  updateGeminiApiKey: (key: string | null) => Promise<void>;
  storyHistory: any[];
  setStoryHistory: React.Dispatch<React.SetStateAction<any[]>>;
  completeStory: (storyId: string) => Promise<void>;
  nickname: string | null;
  updateNickname: (name: string | null) => Promise<void>;
  resetFlashcards: () => Promise<void>;
  resetKnownWords: (level: number) => Promise<void>;
  deleteAccount: () => Promise<void>;
  importBackup: (backup: any) => Promise<void>;
}

const UserProgressContext = createContext<UserProgressContextType | undefined>(undefined);

export function UserProgressProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [knownWords, setKnownWords] = useState<string[]>([]);
  const [targetHskLevel, setTargetHskLevel] = useState<number>(3);
  const [flashcardProgress, setFlashcardProgress] = useState<Record<string, { interval: number; repetition: number; efactor: number; dueDate: string }>>({});
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
  const [nickname, setNickname] = useState<string | null>(null);
  const [storyHistory, setStoryHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Synchronize on Auth state changes if Firebase is configured
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setUserId('test-user-id');
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch or initialize user document when userId changes
  useEffect(() => {
    if (userId === null) {
      setKnownWords([]);
      setTargetHskLevel(3);
      setFlashcardProgress({});
      setGeminiApiKey(null);
      setNickname(null);
      setStoryHistory([]);
      setLoading(false);
      return;
    }

    async function fetchUserProgress() {
      setLoading(true);

      // Try to load initial history from localStorage for instant rendering while fetching
      if (userId) {
        const storedLocalHistory = localStorage.getItem(`zimu_history_${userId}`);
        if (storedLocalHistory) {
          try {
            setStoryHistory(JSON.parse(storedLocalHistory));
          } catch (e) {}
        }

        // Load other local stored values for instant rendering
        const storedLevel = localStorage.getItem(`zimu_target_hsk_level_${userId}`);
        if (storedLevel) {
          setTargetHskLevel(Number(storedLevel));
        }

        const storedApiKey = localStorage.getItem(`zimu_gemini_api_key_${userId}`);
        if (storedApiKey) {
          setGeminiApiKey(storedApiKey);
        }

        const storedNickname = localStorage.getItem(`zimu_nickname_${userId}`);
        if (storedNickname) {
          setNickname(storedNickname);
        }

        const storedProgress = localStorage.getItem(`zimu_flashcard_progress_${userId}`);
        if (storedProgress) {
          try {
            setFlashcardProgress(JSON.parse(storedProgress));
          } catch (e) {}
        }
      }

      if (!isFirebaseConfigured) {
        console.warn('⚠️ Firebase Client credentials not configured. Falling back to in-memory local demo mode.');
        setKnownWords([]);
        setTargetHskLevel(3);
        
        // Load local demo user values from localStorage
        const storedProgress = localStorage.getItem(`zimu_flashcard_progress_test-user-id`);
        if (storedProgress) {
          try {
            setFlashcardProgress(JSON.parse(storedProgress));
          } catch (e) {
            console.error('Failed to parse stored progress:', e);
            setFlashcardProgress({});
          }
        } else {
          setFlashcardProgress({});
        }

        const storedApiKey = localStorage.getItem('zimu_gemini_api_key_test-user-id');
        setGeminiApiKey(storedApiKey || null);

        const storedNickname = localStorage.getItem('zimu_nickname_test-user-id');
        setNickname(storedNickname || null);
        
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/user-progress?userId=${userId}`, {
          cache: 'no-store'
        });
        if (res.ok) {
          const data = await res.json();
          setKnownWords(data.knownWords || []);
          setTargetHskLevel(data.targetHskLevel || 3);
          setGeminiApiKey(data.geminiApiKey || null);
          setNickname(data.nickname || null);
          setFlashcardProgress(data.flashcardProgress || {});
          setStoryHistory(data.storyHistory || []);

          // Sync back to localStorage for next instant load
          if (data.targetHskLevel) {
            localStorage.setItem(`zimu_target_hsk_level_${userId}`, String(data.targetHskLevel));
          }
          if (data.geminiApiKey) {
            localStorage.setItem(`zimu_gemini_api_key_${userId}`, data.geminiApiKey);
          } else {
            localStorage.removeItem(`zimu_gemini_api_key_${userId}`);
          }
          if (data.nickname) {
            localStorage.setItem(`zimu_nickname_${userId}`, data.nickname);
          } else {
            localStorage.removeItem(`zimu_nickname_${userId}`);
          }
          if (data.flashcardProgress) {
            localStorage.setItem(`zimu_flashcard_progress_${userId}`, JSON.stringify(data.flashcardProgress));
          }
          if (data.storyHistory) {
            localStorage.setItem(`zimu_history_${userId}`, JSON.stringify(data.storyHistory));
          }
        }
      } catch (error) {
        console.error('Error fetching user progress:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUserProgress();
  }, [userId]);

  const addKnownWord = async (word: string) => {
    if (!userId) return;

    // Optimistic UI update
    setKnownWords((prev) => {
      if (prev.includes(word)) return prev;
      return [...prev, word];
    });

    if (!isFirebaseConfigured) {
      return; // Skip Firestore write in unconfigured local demo mode
    }

    try {
      const res = await fetch('/api/user-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'addKnownWord', word })
      });
      if (!res.ok) throw new Error('Failed to add known word');
    } catch (error) {
      console.error('Error saving known word:', error);
      // Rollback optimistic update on failure
      setKnownWords((prev) => prev.filter((w) => w !== word));
    }
  };

  const removeKnownWord = async (word: string) => {
    if (!userId) return;

    // Optimistic UI update
    setKnownWords((prev) => prev.filter((w) => w !== word));

    if (!isFirebaseConfigured) {
      return; // Skip Firestore write in unconfigured local demo mode
    }

    try {
      const res = await fetch('/api/user-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'removeKnownWord', word })
      });
      if (!res.ok) throw new Error('Failed to remove known word');
    } catch (error) {
      console.error('Error removing known word:', error);
      // Rollback optimistic update on failure
      setKnownWords((prev) => {
        if (prev.includes(word)) return prev;
        return [...prev, word];
      });
    }
  };

  const updateTargetHskLevel = async (level: number) => {
    if (!userId) return;

    // Optimistic UI update
    setTargetHskLevel(level);
    localStorage.setItem(`zimu_target_hsk_level_${userId}`, String(level));

    if (!isFirebaseConfigured) {
      return; // Skip Firestore write in unconfigured local demo mode
    }

    try {
      const res = await fetch('/api/user-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'updateLevel', level })
      });
      if (!res.ok) throw new Error('Failed to update target HSK level');
    } catch (error) {
      console.error('Error saving target HSK level:', error);
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured) {
      await auth.signOut();
    }
    setUserId(null);
    setFlashcardProgress({});
    setGeminiApiKey(null);
    setNickname(null);
    setStoryHistory([]);
  };

  const loginDemo = async (level: number = 3) => {
    setUserId('test-user-id');
    const demoLevel = level < 7 ? level + 1 : 7;
    setTargetHskLevel(demoLevel);
    localStorage.setItem('zimu_target_hsk_level_test-user-id', String(demoLevel));
    
    // Load flashcard progress for demo user
    const storedProgress = localStorage.getItem('zimu_flashcard_progress_test-user-id');
    if (storedProgress) {
      try {
        setFlashcardProgress(JSON.parse(storedProgress));
      } catch (e) {
        setFlashcardProgress({});
      }
    } else {
      setFlashcardProgress({});
    }

    const storedApiKey = localStorage.getItem('zimu_gemini_api_key_test-user-id');
    setGeminiApiKey(storedApiKey || null);

    const storedNickname = localStorage.getItem('zimu_nickname_test-user-id');
    setNickname(storedNickname || null);

    try {
      const res = await fetch('/api/init-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'test-user-id', level, isDemo: true })
      });
      const data = await res.json();
      if (data.knownWords) {
        setKnownWords(data.knownWords);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  const saveFlashcardProgress = async (
    word: string,
    interval: number,
    repetition: number,
    efactor: number,
    dueDate: string
  ) => {
    if (!userId) return;

    // Optimistic UI update
    setFlashcardProgress((prev) => {
      const updated = {
        ...prev,
        [word]: { interval, repetition, efactor, dueDate },
      };
      // Keep localStorage synchronized
      localStorage.setItem(`zimu_flashcard_progress_${userId}`, JSON.stringify(updated));
      return updated;
    });

    if (!isFirebaseConfigured) {
      // Evaluate word graduation rules in demo mode
      if (repetition >= 3 && !knownWords.includes(word)) {
        setKnownWords(prev => [...prev, word]);
      }
      return; // Skip Firestore write in unconfigured local demo mode
    }

    try {
      const res = await fetch('/api/user-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'saveFlashcard',
          word,
          interval,
          repetition,
          efactor,
          dueDate
        })
      });
      if (!res.ok) throw new Error('Failed to save flashcard progress');

      // Update HSK level and known words lists on automatic updates
      const data = await res.json();
      if (data.progressionResult) {
        const { knownWords: sKnownWords, targetHskLevel: sLevel } = data.progressionResult;
        setKnownWords(sKnownWords);
        setTargetHskLevel(sLevel);
        if (sLevel) {
          localStorage.setItem(`zimu_target_hsk_level_${userId}`, String(sLevel));
        }
      }
    } catch (error) {
      console.error('Error saving flashcard progress:', error);
    }
  };

  const updateGeminiApiKey = async (key: string | null) => {
    if (!userId) return;

    setGeminiApiKey(key);
    if (key) {
      localStorage.setItem(`zimu_gemini_api_key_${userId}`, key);
    } else {
      localStorage.removeItem(`zimu_gemini_api_key_${userId}`);
    }

    if (!isFirebaseConfigured) return;

    try {
      const res = await fetch('/api/user-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'updateApiKey', key })
      });
      if (!res.ok) throw new Error('Failed to update API key');
    } catch (error) {
      console.error('Error updating Gemini API key:', error);
    }
  };

  const updateNickname = async (name: string | null) => {
    if (!userId) return;

    setNickname(name);
    if (name) {
      localStorage.setItem(`zimu_nickname_${userId}`, name);
    } else {
      localStorage.removeItem(`zimu_nickname_${userId}`);
    }

    if (!isFirebaseConfigured) return;

    try {
      const res = await fetch('/api/user-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'updateNickname', nickname: name })
      });
      if (!res.ok) throw new Error('Failed to update nickname');
    } catch (error) {
      console.error('Error updating nickname:', error);
    }
  };

  const resetFlashcards = async () => {
    if (!userId) return;

    setFlashcardProgress({});
    localStorage.setItem(`zimu_flashcard_progress_${userId}`, JSON.stringify({}));

    if (!isFirebaseConfigured) return;

    try {
      const res = await fetch('/api/user-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'resetFlashcards' })
      });
      if (!res.ok) throw new Error('Failed to reset flashcard progress');
    } catch (error) {
      console.error('Error resetting flashcards:', error);
    }
  };

  const resetKnownWords = async (level: number) => {
    if (!userId) return;

    if (!isFirebaseConfigured) {
      try {
        const res = await fetch('/api/init-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, level, isDemo: true })
        });
        const data = await res.json();
        if (data.knownWords) {
          setKnownWords(data.knownWords);
          setTargetHskLevel(data.targetHskLevel);
          if (data.targetHskLevel) {
            localStorage.setItem(`zimu_target_hsk_level_${userId}`, String(data.targetHskLevel));
          }
        }
      } catch (e) {
        console.error('Error resetting demo known words:', e);
      }
      return;
    }

    try {
      const res = await fetch('/api/user-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'resetKnownWords', level })
      });
      if (!res.ok) throw new Error('Failed to reset known words');
      const data = await res.json();
      if (data.success) {
        setKnownWords(data.knownWords);
        setTargetHskLevel(data.targetHskLevel);
        if (data.targetHskLevel) {
          localStorage.setItem(`zimu_target_hsk_level_${userId}`, String(data.targetHskLevel));
        }
      }
    } catch (error) {
      console.error('Error resetting known words:', error);
    }
  };

  const deleteAccount = async () => {
    if (!userId) return;

    if (isFirebaseConfigured) {
      try {
        await fetch('/api/user-progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, action: 'deleteAccount' })
        });
      } catch (error) {
        console.error('Error executing backend account deletion:', error);
      }
    }

    localStorage.removeItem(`zimu_flashcard_progress_${userId}`);
    localStorage.removeItem(`zimu_gemini_api_key_${userId}`);
    localStorage.removeItem(`zimu_nickname_${userId}`);
    localStorage.removeItem(`zimu_history_${userId}`);
    localStorage.removeItem(`zimu_target_hsk_level_${userId}`);

    await logout();
  };

  const importBackup = async (backup: any) => {
    if (!userId) return;

    const { knownWords: bKnownWords = [], targetHskLevel: bTargetHskLevel = 3, flashcardProgress: bFlashcardProgress = {} } = backup;

    setKnownWords(bKnownWords);
    setTargetHskLevel(bTargetHskLevel);
    setFlashcardProgress(bFlashcardProgress);

    localStorage.setItem(`zimu_flashcard_progress_${userId}`, JSON.stringify(bFlashcardProgress));
    localStorage.setItem(`zimu_target_hsk_level_${userId}`, String(bTargetHskLevel));

    if (!isFirebaseConfigured) return;

    try {
      const res = await fetch('/api/user-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'importBackup',
          backupData: backup
        })
      });
      if (!res.ok) throw new Error('Failed to import backup');
    } catch (error) {
      console.error('Error importing backup:', error);
    }
  };

  const completeStory = async (storyId: string) => {
    if (!userId) return;

    // Optimistic UI update for completed state
    setStoryHistory((prev) =>
      prev.map((story) =>
        story.storyId === storyId ? { ...story, completed: true } : story
      )
    );

    if (!isFirebaseConfigured) {
      // Synchronize in-memory changes to localStorage in demo mode
      const storedLocalHistory = localStorage.getItem(`zimu_history_${userId}`);
      if (storedLocalHistory) {
        try {
          const history = JSON.parse(storedLocalHistory);
          const updated = history.map((s: any) => s.storyId === storyId ? { ...s, completed: true } : s);
          localStorage.setItem(`zimu_history_${userId}`, JSON.stringify(updated));
        } catch (e) {}
      }

      // Automatically evaluate vocabulary acquisition in demo mode
      const completedStory = storyHistory.find(s => s.storyId === storyId);
      if (completedStory) {
        const newWords = completedStory.newWords || [];
        const updatedProgress = { ...flashcardProgress };
        let wordsGraduated: string[] = [];

        for (const word of newWords) {
          const prev = updatedProgress[word] || { interval: 1, repetition: 0, efactor: 2.5, dueDate: '' };
          const rep = prev.repetition + 1;
          const interval = Math.round(prev.interval * prev.efactor);
          const dueDate = new Date(Date.now() + interval * 24 * 60 * 60 * 1000).toISOString();
          updatedProgress[word] = { interval, repetition: rep, efactor: prev.efactor, dueDate };

          if (rep >= 3 && !knownWords.includes(word)) {
            wordsGraduated.push(word);
          }
        }

        if (wordsGraduated.length > 0) {
          setKnownWords(prev => [...prev, ...wordsGraduated]);
        }
        setFlashcardProgress(updatedProgress);
        localStorage.setItem(`zimu_flashcard_progress_${userId}`, JSON.stringify(updatedProgress));
      }
      return;
    }

    try {
      const res = await fetch('/api/user-progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'completeStory', storyId })
      });
      if (!res.ok) throw new Error('Failed to mark story as completed');

      // Update lists with auto-progression results on response
      const data = await res.json();
      if (data.progressionResult) {
        const { knownWords: sKnownWords, targetHskLevel: sLevel } = data.progressionResult;
        setKnownWords(sKnownWords);
        setTargetHskLevel(sLevel);
        if (sLevel) {
          localStorage.setItem(`zimu_target_hsk_level_${userId}`, String(sLevel));
        }
      }
    } catch (error) {
      console.error('Error completing story:', error);
      // Rollback optimistic update on failure
      setStoryHistory((prev) =>
        prev.map((story) =>
          story.storyId === storyId ? { ...story, completed: false } : story
        )
      );
    }
  };

  return (
    <UserProgressContext.Provider
      value={{
        userId,
        knownWords,
        targetHskLevel,
        loading,
        addKnownWord,
        removeKnownWord,
        updateTargetHskLevel,
        logout,
        loginDemo,
        flashcardProgress,
        saveFlashcardProgress,
        geminiApiKey,
        updateGeminiApiKey,
        storyHistory,
        setStoryHistory,
        completeStory,
        nickname,
        updateNickname,
        resetFlashcards,
        resetKnownWords,
        deleteAccount,
        importBackup,
      }}
    >
      {children}
    </UserProgressContext.Provider>
  );
}

export function useUserProgress() {
  const context = useContext(UserProgressContext);
  if (context === undefined) {
    throw new Error('useUserProgress must be used within a UserProgressProvider');
  }
  return context;
}