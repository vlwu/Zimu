'use client';

import React, { useState } from 'react';
import { useUserProgress } from '@/context/UserProgressContext';
import { auth, isFirebaseConfigured } from '@/lib/firebase-client';
import { EmailAuthProvider, reauthenticateWithCredential, updateEmail, updatePassword } from 'firebase/auth';

export function SettingsView() {
  const {
    logout,
    geminiApiKey,
    updateGeminiApiKey,
    knownWords,
    targetHskLevel,
  } = useUserProgress();

  const user = isFirebaseConfigured ? auth.currentUser : null;

  // Email form state
  const [emailCurrentPassword, setEmailCurrentPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  // Password form state
  const [passwordCurrentPassword, setPasswordCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Gemini API Key form state
  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey || '');
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState(false);

  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(null);
    setEmailLoading(true);

    if (!isFirebaseConfigured || !user) {
      setEmailError('Firebase is not configured or no user is logged in.');
      setEmailLoading(false);
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(user.email || '', emailCurrentPassword);
      await reauthenticateWithCredential(user, credential);
      await updateEmail(user, newEmail);
      setEmailSuccess('Email address successfully updated!');
      setEmailCurrentPassword('');
      setNewEmail('');
    } catch (err: any) {
      console.error(err);
      switch (err.code) {
        case 'auth/invalid-email':
          setEmailError('The new email address is invalid.');
          break;
        case 'auth/email-already-in-use':
          setEmailError('This email is already registered to another account.');
          break;
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setEmailError('Incorrect current password.');
          break;
        default:
          setEmailError(err.message || 'An error occurred while updating the email address.');
      }
    } finally {
      setEmailLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);
    setPasswordLoading(true);

    if (!isFirebaseConfigured || !user) {
      setPasswordError('Firebase is not configured or no user is logged in.');
      setPasswordLoading(false);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setPasswordError('New passwords do not match.');
      setPasswordLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password should be at least 6 characters.');
      setPasswordLoading(false);
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(user.email || '', passwordCurrentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setPasswordSuccess('Password successfully updated!');
      setPasswordCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (err: any) {
      console.error(err);
      switch (err.code) {
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
          setPasswordError('Incorrect current password.');
          break;
        case 'auth/weak-password':
          setPasswordError('Password is too weak.');
          break;
        default:
          setPasswordError(err.message || 'An error occurred while updating the password.');
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSaveApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setApiError(null);
    setApiSuccess(null);
    setApiLoading(true);

    const trimmedKey = apiKeyInput.trim();

    if (!trimmedKey) {
      try {
        await updateGeminiApiKey(null);
        setApiSuccess('Gemini API key successfully removed.');
      } catch (err: any) {
        setApiError(err.message || 'Failed to update API key.');
      } finally {
        setApiLoading(false);
      }
      return;
    }

    try {
      // Validate the key with the backend
      const res = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiApiKey: trimmedKey }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await updateGeminiApiKey(trimmedKey);
        setApiSuccess('Gemini API Key verified and saved successfully!');
      } else {
        setApiError(data.error || 'Invalid API Key. Verification failed.');
      }
    } catch (err: any) {
      setApiError(err.message || 'Verification request failed. Please check network connectivity.');
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="border-b border-slate-100 dark:border-neutral-800 pb-3">
        <span className="text-[10px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase">
          User Settings
        </span>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
          Account Settings
        </h2>
      </div>

      {/* Account Info and Overview */}
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
          <span>Account Profile</span>
        </h3>

        {!isFirebaseConfigured && (
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 rounded-xl text-xs leading-relaxed">
            <span className="font-extrabold block mb-0.5">⚠️ Local Demo Mode Active</span>
            Account email and password updates are unavailable because a real authentication provider is not configured.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm font-medium">
          <div className="space-y-0.5">
            <span className="text-xs text-slate-400 dark:text-neutral-500 block">Email Address</span>
            <span className="text-slate-800 dark:text-slate-200 font-bold block truncate">
              {user?.email || 'Local Demo User'}
            </span>
          </div>
          <div className="space-y-0.5">
            <span className="text-xs text-slate-400 dark:text-neutral-500 block">Vocabulary Mastery</span>
            <span className="text-slate-800 dark:text-slate-200 font-bold block">
              {knownWords.length} Words Known (Target HSK {targetHskLevel === 7 ? '7-9' : targetHskLevel})
            </span>
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100 dark:border-neutral-800/80 flex items-center justify-between">
          <span className="text-xs text-slate-400 dark:text-neutral-500 font-bold">
            Session Management
          </span>
          <button
            onClick={logout}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 dark:text-rose-400 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-900/60 cursor-pointer transition duration-150"
          >
            Sign Out of Account
          </button>
        </div>
      </div>

      {/* Gemini API Key Section */}
      <form onSubmit={handleSaveApiKey} className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
          </svg>
          <span>Gemini API Key</span>
        </h3>

        <p className="text-xs text-slate-500 dark:text-neutral-400 leading-normal">
          Zimu uses Gemini to write custom, context-calibrated Chinese stories. Provide your own key to enable customized story creation.
        </p>

        <div className="space-y-1">
          <label htmlFor="settings-api-key" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            API Key
          </label>
          <input
            id="settings-api-key"
            type="password"
            placeholder={geminiApiKey ? "••••••••••••••••" : "AIzaSy..."}
            value={apiKeyInput}
            onChange={(e) => setApiKeyInput(e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-mono"
          />
        </div>

        {apiError && (
          <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold leading-normal">
            ⚠️ {apiError}
          </div>
        )}

        {apiSuccess && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold">
            ✓ {apiSuccess}
          </div>
        )}

        <button
          type="submit"
          disabled={apiLoading}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-xl text-xs transition duration-150 cursor-pointer flex items-center justify-center gap-1.5"
        >
          {apiLoading ? (
            <>
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              <span>Verifying...</span>
            </>
          ) : (
            <span>Update API Key</span>
          )}
        </button>
      </form>

      {/* Security Actions (Firebase only) */}
      {isFirebaseConfigured && (
        <>
          {/* Change Email */}
          <form onSubmit={handleUpdateEmail} className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
              <span>Change Email Address</span>
            </h3>

            <div className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="settings-email-password" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Current Password (to verify your identity)
                </label>
                <input
                  id="settings-email-password"
                  type="password"
                  required
                  value={emailCurrentPassword}
                  onChange={(e) => setEmailCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="settings-new-email" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  New Email Address
                </label>
                <input
                  id="settings-new-email"
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {emailError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold leading-normal">
                ⚠️ {emailError}
              </div>
            )}

            {emailSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold">
                ✓ {emailSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={emailLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition duration-150 cursor-pointer"
            >
              {emailLoading ? 'Updating Email...' : 'Update Email Address'}
            </button>
          </form>

          {/* Change Password */}
          <form onSubmit={handleUpdatePassword} className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
              <span>Change Password</span>
            </h3>

            <div className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="settings-password-current" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Current Password
                </label>
                <input
                  id="settings-password-current"
                  type="password"
                  required
                  value={passwordCurrentPassword}
                  onChange={(e) => setPasswordCurrentPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="settings-new-password" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  New Password
                </label>
                <input
                  id="settings-new-password"
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="settings-confirm-password" className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Confirm New Password
                </label>
                <input
                  id="settings-confirm-password"
                  type="password"
                  required
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {passwordError && (
              <div className="p-3 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-xl text-xs font-semibold leading-normal">
                ⚠️ {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-semibold">
                ✓ {passwordSuccess}
              </div>
            )}

            <button
              type="submit"
              disabled={passwordLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition duration-150 cursor-pointer"
            >
              {passwordLoading ? 'Updating Password...' : 'Update Password'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}