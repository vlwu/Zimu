'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion, collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase-client';

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
}

const UserProgressContext = createContext<UserProgressContextType | undefined>(undefined);

export function UserProgressProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [knownWords, setKnownWords] = useState<string[]>([]);
  const [targetHskLevel, setTargetHskLevel] = useState<number>(3);
  const [flashcardProgress, setFlashcardProgress] = useState<Record<string, { interval: number; repetition: number; efactor: number; dueDate: string }>>({});
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
      setLoading(false);
      return;
    }

    async function fetchUserProgress() {
      setLoading(true);
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
        
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'users', userId!);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setKnownWords(data.knownWords || []);
          setTargetHskLevel(data.targetHskLevel || 3);
        } else {
          setKnownWords([]);
          setTargetHskLevel(3);
        }

        // Fetch subcollection flashcards
        const flashcardsSnap = await getDocs(collection(db, 'users', userId!, 'flashcards'));
        const progressMap: Record<string, any> = {};
        flashcardsSnap.forEach((doc) => {
          progressMap[doc.id] = doc.data();
        });
        setFlashcardProgress(progressMap);

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
      const docRef = doc(db, 'users', userId);
      await setDoc(docRef, {
        knownWords: arrayUnion(word),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving known word to Firestore:', error);
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
      const docRef = doc(db, 'users', userId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const currentWords = docSnap.data().knownWords || [];
        const updatedWords = currentWords.filter((w: string) => w !== word);
        await updateDoc(docRef, {
          knownWords: updatedWords,
        });
      }
    } catch (error) {
      console.error('Error removing known word from Firestore:', error);
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
      const docRef = doc(db, 'users', userId);
      await setDoc(docRef, {
        targetHskLevel: level,
      }, { merge: true });
    } catch (error) {
      console.error('Error saving target HSK level to Firestore:', error);
    }
  };

  const logout = async () => {
    if (isFirebaseConfigured) {
      await auth.signOut();
    }
    setUserId(null);
    setFlashcardProgress({});
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
      const cardRef = doc(db, 'users', userId, 'flashcards', word);
      await setDoc(cardRef, {
        word,
        interval,
        repetition,
        efactor,
        dueDate,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    } catch (error) {
      console.error('Error saving flashcard progress to Firestore:', error);
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