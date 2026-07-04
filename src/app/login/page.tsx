'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '@/lib/firebase-client';
import { useUserProgress } from '@/context/UserProgressContext';

export default function LoginPage() {
  const router = useRouter();
  const { userId, loading, loginDemo } = useUserProgress();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [signUpHskLevel, setSignUpHskLevel] = useState<number>(3);
  const [error, setError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (!loading && userId) {
      router.push('/');
    }
  }, [userId, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAuthLoading(true);

    if (!isFirebaseConfigured) {
      setError('Firebase is not configured. Redirecting to demo mode...');
      await loginDemo(signUpHskLevel);
      router.push('/');
      setAuthLoading(false);
      return;
    }

    try {
      if (isSignUp) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await fetch('/api/init-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: userCredential.user.uid, level: signUpHskLevel })
        });
        window.location.href = '/';
        return;
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        router.push('/');
      }
    } catch (err: any) {
      console.error(err);
      // Map Firebase Auth errors to readable messages
      switch (err.code) {
        case 'auth/invalid-email':
          setError('Invalid email address.');
          break;
        case 'auth/user-disabled':
          setError('This user account has been disabled.');
          break;
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setError('Incorrect email or password.');
          break;
        case 'auth/email-already-in-use':
          setError('This email is already registered.');
          break;
        case 'auth/weak-password':
          setError('Password should be at least 6 characters.');
          break;
        default:
          setError(err.message || 'An error occurred during authentication.');
      }
    } finally {
      setAuthLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-neutral-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-500 dark:text-slate-400 mt-4 text-sm font-medium">Checking auth state...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-neutral-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-neutral-900 p-8 rounded-2xl border border-slate-200 dark:border-neutral-800 shadow-xl">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-slate-900 dark:text-white">
            Zimu <span className="text-slate-400 dark:text-neutral-500 font-normal">字幕</span>
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600 dark:text-slate-400">
            {isSignUp ? 'Create your new Zimu account' : 'Sign in to your Zimu account'}
          </p>
        </div>

        {!isFirebaseConfigured && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 rounded-xl text-amber-800 dark:text-amber-300 text-sm">
            <p className="font-semibold mb-2">⚠️ Local Demo Mode Active</p>
            <p className="mb-4">Firebase environment variables are not configured. You can use the app immediately with a mock profile.</p>
            <div className="mb-4">
              <label htmlFor="demo-hsk-level" className="block text-sm font-medium text-amber-900 dark:text-amber-200 mb-1">
                Current Chinese Level
              </label>
              <select
                id="demo-hsk-level"
                value={signUpHskLevel}
                onChange={(e) => setSignUpHskLevel(Number(e.target.value))}
                className="block w-full px-3 py-2 bg-white/50 dark:bg-neutral-800/50 border border-amber-300 dark:border-amber-700/50 rounded-lg text-sm shadow-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 text-amber-900 dark:text-amber-100 animate-none"
              >
                <option value={1}>Beginner (HSK 1)</option>
                <option value={2}>Elementary (HSK 2)</option>
                <option value={3}>Intermediate (HSK 3)</option>
                <option value={4}>Upper Intermediate (HSK 4)</option>
                <option value={5}>Advanced (HSK 5)</option>
                <option value={6}>Proficient (HSK 6)</option>
                <option value={7}>Mastery (HSK 7-9)</option>
              </select>
            </div>
            <button
              onClick={async () => {
                setAuthLoading(true);
                await loginDemo(signUpHskLevel);
                router.push('/');
              }}
              disabled={authLoading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2 px-4 rounded-lg transition text-center cursor-pointer disabled:opacity-50"
            >
              {authLoading ? 'Loading...' : 'Enter Demo Mode'}
            </button>
          </div>
        )}

        {isFirebaseConfigured && (
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-lg text-sm text-center font-medium">
                {error}
              </div>
            )}
            <div className="space-y-4">
              {isSignUp && (
                <div>
                  <label htmlFor="hsk-level" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    Current Chinese Level
                  </label>
                  <select
                    id="hsk-level"
                    value={signUpHskLevel}
                    onChange={(e) => setSignUpHskLevel(Number(e.target.value))}
                    className="mt-1 block w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg text-sm shadow-sm placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 animate-none"
                  >
                    <option value={1}>Beginner (HSK 1)</option>
                    <option value={2}>Elementary (HSK 2)</option>
                    <option value={3}>Intermediate (HSK 3)</option>
                    <option value={4}>Upper Intermediate (HSK 4)</option>
                    <option value={5}>Advanced (HSK 5)</option>
                    <option value={6}>Proficient (HSK 6)</option>
                    <option value={7}>Mastery (HSK 7-9)</option>
                  </select>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">We'll pre-fill your known words up to this level.</p>
                </div>
              )}
              <div>
                <label htmlFor="email-address" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Email address
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg text-sm shadow-sm placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 animate-none"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="mt-1 block w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg text-sm shadow-sm placeholder-slate-400 dark:placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 animate-none"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={authLoading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-semibold rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition cursor-pointer"
              >
                {authLoading ? 'Please wait...' : isSignUp ? 'Sign Up' : 'Sign In'}
              </button>
            </div>

            <div className="text-center">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
                className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 cursor-pointer transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}