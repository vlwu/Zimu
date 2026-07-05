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
}

const UserProgressContext = createContext<UserProgressContextType | undefined>(undefined);

export function UserProgressProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [knownWords, setKnownWords] = useState<string[]>([]);
  const [targetHskLevel, setTargetHskLevel] = useState<number>(3);
  const [flashcardProgress, setFlashcardProgress] = useState<Record<string, { interval: number; repetition: number; efactor: number; dueDate: string }>>({});
  const [geminiApiKey, setGeminiApiKey] = useState<string | null>(null);
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
      }

      if (!isFirebaseConfigured) {
        console.warn('⚠️ Firebase Client credentials not configured. Falling back to in-memory local demo mode.');
        setKnownWords([]);
        setTargetHskLevel(3);
        
        // Load flashcard progress from localStorage for demo user
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
        
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/user-progress?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setKnownWords(data.knownWords || []);
          setTargetHskLevel(data.targetHskLevel || 3);
          setGeminiApiKey(data.geminiApiKey || null);
          setFlashcardProgress(data.flashcardProgress || {});
          setStoryHistory(data.storyHistory || []);
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
    setStoryHistory([]);
  };

  const loginDemo = async (level: number = 3) => {
    setUserId('test-user-id');
    setTargetHskLevel(level < 7 ? level + 1 : 7);
    
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