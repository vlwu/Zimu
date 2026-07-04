'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase-client';

interface UserProgressContextType {
  userId: string;
  knownWords: string[];
  targetHskLevel: number;
  loading: boolean;
  addKnownWord: (word: string) => Promise<void>;
  updateTargetHskLevel: (level: number) => Promise<void>;
}

const UserProgressContext = createContext<UserProgressContextType | undefined>(undefined);

export function UserProgressProvider({ children }: { children: React.ReactNode }) {
  const [userId, setUserId] = useState<string>('test-user-id');
  const [knownWords, setKnownWords] = useState<string[]>([]);
  const [targetHskLevel, setTargetHskLevel] = useState<number>(3);
  const [loading, setLoading] = useState<boolean>(true);

  // Synchronize on Auth state changes if Firebase is configured
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setUserId('test-user-id');
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId('test-user-id');
      }
    });
    return () => unsubscribe();
  }, []);

  // Fetch or initialize user document when userId changes
  useEffect(() => {
    async function fetchUserProgress() {
      setLoading(true);
      if (!isFirebaseConfigured) {
        console.warn('⚠️ Firebase Client credentials not configured. Falling back to in-memory local demo mode.');
        setKnownWords([]);
        setTargetHskLevel(3);
        setLoading(false);
        return;
      }

      try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          setKnownWords(data.knownWords || []);
          setTargetHskLevel(data.targetHskLevel || 3);
        } else {
          const defaults = {
            knownWords: [],
            targetHskLevel: 3,
          };
          await setDoc(docRef, defaults);
          setKnownWords([]);
          setTargetHskLevel(3);
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
      await updateDoc(docRef, {
        knownWords: arrayUnion(word),
      });
    } catch (error) {
      console.error('Error saving known word to Firestore:', error);
      // Rollback optimistic update on failure
      setKnownWords((prev) => prev.filter((w) => w !== word));
    }
  };

  const updateTargetHskLevel = async (level: number) => {
    // Optimistic UI update
    setTargetHskLevel(level);

    if (!isFirebaseConfigured) {
      return; // Skip Firestore write in unconfigured local demo mode
    }

    try {
      const docRef = doc(db, 'users', userId);
      await updateDoc(docRef, {
        targetHskLevel: level,
      });
    } catch (error) {
      console.error('Error saving target HSK level to Firestore:', error);
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
        updateTargetHskLevel,
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