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
  const [isSignUp, setIsSignUp] = useState(true); // Defaults to Sign Up screen
  const [signUpHskLevel, setSignUpHskLevel] = useState<number>(3);
  const [error, setError] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // Floating background animation variables
  const [chars, setChars] = useState<Array<{
    id: number;
    char: string;
    left: number;
    top: number;
    fontSize: number;
    duration: number;
    delay: number;
  }>>([]);

  useEffect(() => {
    const pool = ['的', '一', '是', '不', '了', '人', '我', '在', '有', '他', '这', '为', '之', '大', '来', '以', '个', '中', '上', '们', '字', '幕', '语', '言', '学', '习'];
    const generated = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      char: pool[Math.floor(Math.random() * pool.length)],
      left: Math.random() * 95,
      top: 102 + Math.random() * 15, // Render below the view boundaries to allow floating up
      fontSize: 28 + Math.random() * 56,
      duration: 15 + Math.random() * 20,
      delay: Math.random() * 10,
    }));
    setChars(generated);
  }, []);

  // Parse optional signup vs signin parameters client-side on load to prevent Next.js build deoptimizations
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const modeParam = params.get('mode');
      if (modeParam === 'signin') {
        setIsSignUp(false);
      } else if (modeParam === 'signup') {
        setIsSignUp(true);
      }
    }
  }, []);

  useEffect(() => {
    if (!loading && userId) {
      router.push('/');
    }
  }, [userId, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setAuthLoading(true);

    if (isSignUp && !agreed) {
      setError('You must agree to the Terms of Service and Privacy Policy.');
      setAuthLoading(false);
      return;
    }

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
      <div className="flex items-center justify-center min-h-screen bg-[#11131b] text-[#e1e2ed]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#b4c5ff] mx-auto"></div>
          <p className="text-[#c3c6d7] mt-4 text-sm font-medium">Checking authentication state...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#11131b] text-[#e1e2ed] flex items-center justify-center relative overflow-hidden font-body-base selection:bg-[#2563eb]/30 select-none w-full">
      {/* Self-contained style tag ensuring keyframe animation compiled independently */}
      <style>{`
        @keyframes drift {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          8% { opacity: 0.05; }
          90% { opacity: 0.05; }
          100% { transform: translateY(-122vh) rotate(15deg); opacity: 0; }
        }
        .watermark-char-fixed {
          position: fixed;
          font-family: 'Noto Serif SC', serif;
          color: #ffffff;
          opacity: 0;
          z-index: 0;
          pointer-events: none;
          user-select: none;
          animation: drift infinite linear;
        }
      `}</style>

      {/* Fixed Ambient Background Watermarks */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {chars.map((item) => (
          <div
            key={item.id}
            className="watermark-char-fixed"
            style={{
              left: `${item.left}vw`,
              top: `${item.top}vh`,
              fontSize: `${item.fontSize}px`,
              animationDuration: `${item.duration}s`,
              animationDelay: `${item.delay}s`,
            }}
          >
            {item.char}
          </div>
        ))}
      </div>

      {/* Auth Box Container */}
      <div className="relative z-10 w-full max-w-md px-6 md:px-0 my-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-[#b4c5ff] flex items-center justify-center gap-2 tracking-tight">
            Zimu <span className="font-serif text-white text-3xl font-normal">字幕</span>
          </h1>
          <p className="text-[#c3c6d7]/80 mt-2 text-sm">Read your way to fluency.</p>
        </div>

        {/* Form Panel card */}
        <div className="bg-[#191b23]/85 inner-glow rounded-2xl p-6 sm:p-8 backdrop-blur-2xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] border border-white/5">
          
          {/* Navigation Tabs */}
          <div className="flex border-b border-white/5 mb-8">
            <button
              onClick={() => {
                setIsSignUp(false);
                setError(null);
              }}
              className={`flex-1 pb-4 text-center text-xs font-bold transition-all cursor-pointer border-b-2 ${
                !isSignUp
                  ? 'text-[#b4c5ff] border-[#b4c5ff]'
                  : 'text-[#c3c6d7] border-transparent hover:text-white'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => {
                setIsSignUp(true);
                setError(null);
              }}
              className={`flex-1 pb-4 text-center text-xs font-bold transition-all cursor-pointer border-b-2 ${
                isSignUp
                  ? 'text-[#b4c5ff] border-[#b4c5ff]'
                  : 'text-[#c3c6d7] border-transparent hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>

          {!isFirebaseConfigured && (
            <div className="p-4 bg-[#11131b] border border-amber-500/20 rounded-xl text-[#c3c6d7] text-xs mb-6 space-y-4">
              <div className="flex items-center gap-2 text-amber-400 font-bold">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>Local Demo Mode Active</span>
              </div>
              <p className="text-[#c3c6d7]/70 leading-relaxed">
                Firebase environment variables are not configured. You can use the app immediately with a mock profile.
              </p>
              
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <label htmlFor="demo-hsk-level" className="block text-[11px] font-semibold text-[#c3c6d7]">
                  Select Study Grade (HSK)
                </label>
                <div className="relative">
                  <select
                    id="demo-hsk-level"
                    value={signUpHskLevel}
                    onChange={(e) => setSignUpHskLevel(Number(e.target.value))}
                    className="w-full bg-[#11131b] border border-white/10 rounded-lg py-2.5 px-3 text-[#e1e2ed] text-xs focus:border-[#b4c5ff] focus:ring-1 focus:ring-[#b4c5ff] transition-all outline-none cursor-pointer appearance-none"
                  >
                    <option value={1}>Beginner (HSK 1)</option>
                    <option value={2}>Elementary (HSK 2)</option>
                    <option value={3}>Intermediate (HSK 3)</option>
                    <option value={4}>Upper Intermediate (HSK 4)</option>
                    <option value={5}>Advanced (HSK 5)</option>
                    <option value={6}>Proficient (HSK 6)</option>
                    <option value={7}>Mastery (HSK 7-9)</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#c3c6d7]/50">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                    </svg>
                  </div>
                </div>
              </div>

              <button
                onClick={async () => {
                  setAuthLoading(true);
                  await loginDemo(signUpHskLevel);
                  router.push('/');
                }}
                disabled={authLoading}
                className="w-full bg-[#2563eb] hover:bg-[#2563eb]/95 text-white font-bold py-2.5 px-4 rounded-lg text-xs cursor-pointer transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {authLoading ? 'Signing into Workspace...' : 'Enter Demo Workspace'}
              </button>
            </div>
          )}

          {isFirebaseConfigured && (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3 bg-rose-950/20 border border-rose-500/20 text-rose-300 rounded-lg text-xs font-semibold leading-normal text-center">
                  ⚠️ {error}
                </div>
              )}

              {isSignUp && (
                <div className="space-y-1.5">
                  <label htmlFor="hsk-level" className="block text-xs font-bold text-[#c3c6d7]">
                    Current Chinese Level
                  </label>
                  <div className="relative">
                    <select
                      id="hsk-level"
                      value={signUpHskLevel}
                      onChange={(e) => setSignUpHskLevel(Number(e.target.value))}
                      className="w-full bg-[#11131b] border border-white/10 rounded-lg py-3 px-4 text-[#e1e2ed] text-xs focus:border-[#b4c5ff] focus:ring-1 focus:ring-[#b4c5ff] transition-all outline-none cursor-pointer appearance-none"
                    >
                      <option value={1}>Beginner (HSK 1)</option>
                      <option value={2}>Elementary (HSK 2)</option>
                      <option value={3}>Intermediate (HSK 3)</option>
                      <option value={4}>Upper Intermediate (HSK 4)</option>
                      <option value={5}>Advanced (HSK 5)</option>
                      <option value={6}>Proficient (HSK 6)</option>
                      <option value={7}>Mastery (HSK 7-9)</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-[#c3c6d7]/50">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                      </svg>
                    </div>
                  </div>
                  <p className="text-[10px] text-[#c3c6d7]/60">We will pre-populate your known vocabulary to match this grade.</p>
                </div>
              )}

              {/* Email Address */}
              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-bold text-[#c3c6d7]">
                  Email Address
                </label>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c3c6d7]/30 group-focus-within:text-[#b4c5ff] transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                    </svg>
                  </span>
                  <input
                    className="w-full bg-[#11131b] border border-white/10 rounded-lg py-3 pl-10 pr-4 text-[#e1e2ed] text-xs placeholder:text-[#c3c6d7]/30 glow-focus transition-all outline-none"
                    id="email"
                    name="email"
                    placeholder="hello@example.com"
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label htmlFor="password" className="block text-xs font-bold text-[#c3c6d7]">
                    Password
                  </label>
                </div>
                <div className="relative group">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#c3c6d7]/30 group-focus-within:text-[#b4c5ff] transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                    </svg>
                  </span>
                  <input
                    className="w-full bg-[#11131b] border border-white/10 rounded-lg py-3 pl-10 pr-10 text-[#e1e2ed] text-xs placeholder:text-[#c3c6d7]/30 glow-focus transition-all outline-none"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    required
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c3c6d7]/50 hover:text-white transition-colors cursor-pointer"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Agreement checkbox */}
              {isSignUp && (
                <div className="flex items-start gap-2 pt-1 select-none">
                  <input
                    id="agreement"
                    type="checkbox"
                    required
                    checked={agreed}
                    onChange={(e) => setAgreed(e.target.checked)}
                    className="mt-1 accent-[#2563eb] h-4 w-4 rounded border-white/10 bg-[#11131b] text-[#2563eb] focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <label htmlFor="agreement" className="text-xs text-[#c3c6d7]/80 leading-normal cursor-pointer">
                    I agree to the{' '}
                    <a className="text-[#b4c5ff] hover:text-white transition-colors underline" href="/terms" target="_blank" onClick={(e) => e.stopPropagation()}>
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a className="text-[#b4c5ff] hover:text-white transition-colors underline" href="/privacy" target="_blank" onClick={(e) => e.stopPropagation()}>
                      Privacy Policy
                    </a>
                    .
                  </label>
                </div>
              )}

              {/* Submit Action */}
              <button
                className="w-full bg-[#2563eb] hover:bg-[#2563eb]/90 active:scale-[0.98] text-white font-bold py-3.5 rounded-lg text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-[#2563eb]/10 mt-2"
                type="submit"
                disabled={authLoading}
              >
                <span>{authLoading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Sign In'}</span>
                {!authLoading && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                )}
              </button>
            </form>
          )}

          {/* Toggle View */}
          {isFirebaseConfigured && (
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                }}
                className="text-xs font-semibold text-[#b4c5ff] hover:text-white cursor-pointer transition-colors"
              >
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </button>
            </div>
          )}
        </div>

        {/* Footer Links */}
        <div className="mt-8 text-center flex justify-center gap-4 text-xs text-[#c3c6d7]/50">
          <a className="hover:text-[#b4c5ff] transition-colors" href="/privacy">Privacy Policy</a>
          <span>&middot;</span>
          <a className="hover:text-[#b4c5ff] transition-colors" href="/terms">Terms of Service</a>
        </div>
      </div>
    </div>
  );
}