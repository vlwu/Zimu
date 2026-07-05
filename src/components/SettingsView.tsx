'use client';

import React, { useState, useEffect } from 'react';
import { useUserProgress } from '@/context/UserProgressContext';
import { auth, isFirebaseConfigured } from '@/lib/firebase-client';
import { EmailAuthProvider, reauthenticateWithCredential, updateEmail, updatePassword } from 'firebase/auth';

interface SettingsViewProps {
  showSettingsModal: boolean;
  setShowSettingsModal: (val: boolean) => void;
}

export function SettingsView({ showSettingsModal, setShowSettingsModal }: SettingsViewProps) {
  const {
    logout,
    geminiApiKey,
    updateGeminiApiKey,
    knownWords,
    targetHskLevel,
    nickname,
    updateNickname,
    resetFlashcards,
    resetKnownWords,
    deleteAccount,
    importBackup,
    flashcardProgress,
    userId,
  } = useUserProgress();

  const user = isFirebaseConfigured ? auth.currentUser : null;

  // Profile Nickname State
  const [nicknameInput, setNicknameInput] = useState('');
  const [nicknameSuccess, setNicknameSuccess] = useState(false);

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

  // Data Backup form state
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);

  // Account Deletion State
  const [deleteInput, setDeleteInput] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteErrorMsg, setDeleteErrorMsg] = useState<string | null>(null);

  // Synchronize inputs when modal state is activated
  useEffect(() => {
    if (showSettingsModal) {
      setNicknameInput(nickname || '');
      setApiKeyInput(geminiApiKey || '');
      setEmailError(null);
      setEmailSuccess(null);
      setPasswordError(null);
      setPasswordSuccess(null);
      setApiError(null);
      setApiSuccess(null);
      setImportError(null);
      setImportSuccess(false);
      setDeleteInput('');
      setDeleteErrorMsg(null);
    }
  }, [showSettingsModal, nickname, geminiApiKey]);

  if (!showSettingsModal) return null;

  const handleUpdateNickname = async (e: React.FormEvent) => {
    e.preventDefault();
    setNicknameSuccess(false);
    await updateNickname(nicknameInput.trim() || null);
    setNicknameSuccess(true);
    setTimeout(() => setNicknameSuccess(false), 2000);
  };

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

  // Data Export Handler
  const handleExportBackup = () => {
    const backupData = {
      knownWords,
      targetHskLevel,
      flashcardProgress,
      exportedAt: new Date().toISOString(),
      app: 'Zimu'
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `zimu_backup_${userId || 'user'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Data Import Handler
  const handleImportBackupFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportSuccess(false);
    setImporting(true);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const backup = JSON.parse(text);

        if (!backup || typeof backup !== 'object') {
          throw new Error('Backup file is corrupt or is not a valid JSON.');
        }
        if (!Array.isArray(backup.knownWords)) {
          throw new Error('The backup must contain a valid "knownWords" array.');
        }
        if (typeof backup.targetHskLevel !== 'number') {
          throw new Error('The backup must contain a valid "targetHskLevel" number.');
        }

        await importBackup(backup);
        setImportSuccess(true);
      } catch (err: any) {
        setImportError(err.message || 'An error occurred while loading this backup file.');
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
  };

  // Reset Flashcards Option
  const handleResetFlashcards = async () => {
    const confirmWipe = window.confirm('Wipe Spaced Repetition (SRS) Flashcards?\n\nThis will completely clear your recall history, intervals, and repetitions for words you are learning. This action is irreversible. Proceed?');
    if (confirmWipe) {
      await resetFlashcards();
      alert('SRS Flashcards cleared successfully!');
    }
  };

  // Reset Known Words Option
  const handleResetKnownWords = async () => {
    const confirmWipe = window.confirm(`Reset Known Vocabulary list?\n\nThis will re-initialize your known words pool back to the standard base level boundaries matching your target HSK level, undoing manually or automatically graduated words. Proceed?`);
    if (confirmWipe) {
      const resetToLevel = targetHskLevel === 7 ? 6 : Math.max(1, targetHskLevel - 1);
      await resetKnownWords(resetToLevel);
      alert('Known words list re-calibrated successfully!');
    }
  };

  // Full Account Deletion Handler
  const handleDeleteAccount = async () => {
    if (deleteInput !== 'DELETE') {
      alert('Verification required: please type "DELETE" to confirm account deletion.');
      return;
    }

    const firstConfirm = window.confirm('WARNING: IRREVERSIBLE ACTION!\n\nThis will permanently delete your authentication credentials and erase your Firestore profile including all read history, story stats, and custom words. Are you absolutely sure?');
    if (!firstConfirm) return;

    setIsDeleting(true);
    setDeleteErrorMsg(null);

    try {
      await deleteAccount();
      setShowSettingsModal(false);
    } catch (err: any) {
      setDeleteErrorMsg(err.message || 'Account deletion failed.');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-scaleIn">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-neutral-800 flex justify-between items-center bg-slate-50/50 dark:bg-neutral-900/50">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>User Account Settings</span>
          </h3>
          <button 
            onClick={() => setShowSettingsModal(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Modal Scrollable Content Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Section 1: Account Profile */}
          <div className="bg-slate-50 dark:bg-neutral-800/30 border border-slate-200/60 dark:border-neutral-800 rounded-xl p-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Account Profile</h4>
            {!isFirebaseConfigured && (
              <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/60 text-amber-800 dark:text-amber-300 rounded-lg text-xs leading-relaxed font-medium">
                <span className="font-bold block mb-0.5">⚠️ Local Demo Mode Active</span>
                Account edits are loaded instantly in memory but email updates are limited in the mock demo profile.
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 dark:text-neutral-500 block">Logged-In User</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold block truncate">{user?.email || 'Local Demo User'}</span>
              </div>
              <div>
                <span className="text-slate-400 dark:text-neutral-500 block">Vocabulary Progress</span>
                <span className="text-slate-800 dark:text-slate-200 font-bold block">{knownWords.length} Words Mastery (Target HSK {targetHskLevel === 7 ? '7-9' : targetHskLevel})</span>
              </div>
            </div>
          </div>

          {/* Section 2: Profile Welcome / Nickname Editing */}
          <form onSubmit={handleUpdateNickname} className="space-y-3">
            <h4 className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Workspace Display Name</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder="Enter display name / nickname..."
                className="flex-1 px-3 py-2 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm text-slate-900 dark:text-slate-100"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs cursor-pointer transition-colors"
              >
                Save
              </button>
            </div>
            {nicknameSuccess && (
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
                ✓ Display name successfully saved!
              </div>
            )}
          </form>

          {/* Section 3: Gemini API Key Setup */}
          <form onSubmit={handleSaveApiKey} className="space-y-3 border-t border-slate-100 dark:border-neutral-800/80 pt-5">
            <h4 className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Gemini API Key</h4>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-normal">
              Zimu uses Gemini to write context-calibrated Chinese stories. Provide your own key to enable custom story generation.
            </p>
            <div className="space-y-2">
              <input
                type="password"
                placeholder={geminiApiKey ? "••••••••••••••••" : "AIzaSy..."}
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-sm font-mono text-slate-900 dark:text-slate-100"
              />
              {apiError && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold leading-normal">
                  ⚠️ {apiError}
                </div>
              )}
              {apiSuccess && (
                <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold">
                  ✓ {apiSuccess}
                </div>
              )}
              <button
                type="submit"
                disabled={apiLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-lg text-xs cursor-pointer transition duration-150"
              >
                {apiLoading ? 'Verifying...' : 'Update API Key'}
              </button>
            </div>
          </form>

          {/* Section 4: Data Export / Backup */}
          <div className="space-y-3 border-t border-slate-100 dark:border-neutral-800/80 pt-5">
            <h4 className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Data Export / Backup</h4>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-normal">
              Export your structured learning progress (known words, target level boundaries, and active SRS flashcard metrics) into a JSON backup for safe storage or re-importing.
            </p>
            
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                type="button"
                onClick={handleExportBackup}
                className="bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 font-bold px-3 py-2 rounded-lg text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
                </svg>
                <span>Export JSON Backup</span>
              </button>

              <label className="bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 font-bold px-3 py-2 rounded-lg text-xs cursor-pointer flex items-center gap-1.5 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <span>{importing ? 'Importing...' : 'Upload JSON Backup'}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackupFile}
                  disabled={importing}
                  className="hidden"
                />
              </label>
            </div>

            {importError && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold leading-normal">
                ⚠️ Import Failed: {importError}
              </div>
            )}
            {importSuccess && (
              <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold">
                ✓ Backup imported successfully! Learning progress restored.
              </div>
            )}
          </div>

          {/* Section 5: Mastery Reset */}
          <div className="space-y-3 border-t border-slate-100 dark:border-neutral-800/80 pt-5">
            <h4 className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Mastery Reset</h4>
            <p className="text-[11px] text-slate-500 dark:text-neutral-400 leading-normal">
              Irreversibly restore or wipe individual portions of your profile metrics. Choose from the two specialized reset paths below.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="border border-slate-100 dark:border-neutral-800/60 p-3.5 rounded-xl space-y-2 flex flex-col justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Reset SRS Flashcard Progress</h5>
                  <p className="text-[10px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                    Wipes out active spaced repetition metrics (ease factors, recall statistics, repetitions, due dates). Your mastered word list remains untouched.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetFlashcards}
                  className="w-full text-center bg-amber-50 hover:bg-amber-100 border border-amber-200 dark:bg-amber-950/10 dark:hover:bg-amber-950/30 dark:border-amber-900/50 text-amber-600 dark:text-amber-400 font-bold py-1.5 rounded-lg text-xs cursor-pointer transition-colors mt-2"
                >
                  Wipe Flashcard Metrics
                </button>
              </div>

              <div className="border border-slate-100 dark:border-neutral-800/60 p-3.5 rounded-xl space-y-2 flex flex-col justify-between">
                <div>
                  <h5 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Reset Known Words Pool</h5>
                  <p className="text-[10px] text-slate-500 dark:text-neutral-400 leading-relaxed">
                    Re-initializes known words back to the base boundaries of your target HSK tier, discarding any manually marked or auto-graduated vocabulary.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleResetKnownWords}
                  className="w-full text-center bg-amber-50 hover:bg-amber-100 border border-amber-200 dark:bg-amber-950/10 dark:hover:bg-amber-950/30 dark:border-amber-900/50 text-amber-600 dark:text-amber-400 font-bold py-1.5 rounded-lg text-xs cursor-pointer transition-colors mt-2"
                >
                  Reset Words to Base Level
                </button>
              </div>
            </div>
          </div>

          {/* Section 6: Security Updates (Firebase Only) */}
          {isFirebaseConfigured && (
            <div className="border-t border-slate-100 dark:border-neutral-800/80 pt-5 space-y-5">
              {/* Change Email */}
              <form onSubmit={handleUpdateEmail} className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Change Email Address</h4>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400">Current Password</label>
                    <input
                      type="password"
                      required
                      value={emailCurrentPassword}
                      onChange={(e) => setEmailCurrentPassword(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400">New Email Address</label>
                    <input
                      type="email"
                      required
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-xs"
                    />
                  </div>
                  {emailError && (
                    <div className="p-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold leading-normal">
                      ⚠️ {emailError}
                    </div>
                  )}
                  {emailSuccess && (
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold">
                      ✓ {emailSuccess}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={emailLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-1.5 px-3 rounded-lg text-[11px] cursor-pointer"
                  >
                    {emailLoading ? 'Updating...' : 'Update Email Address'}
                  </button>
                </div>
              </form>

              {/* Change Password */}
              <form onSubmit={handleUpdatePassword} className="space-y-3 border-t border-slate-100 dark:border-neutral-800/40 pt-5">
                <h4 className="text-xs font-bold text-slate-400 dark:text-neutral-500 uppercase tracking-wider">Change Account Password</h4>
                <div className="space-y-2">
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400">Current Password</label>
                    <input
                      type="password"
                      required
                      value={passwordCurrentPassword}
                      onChange={(e) => setPasswordCurrentPassword(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400">New Password</label>
                    <input
                      type="password"
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400">Confirm New Password</label>
                    <input
                      type="password"
                      required
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-lg text-xs"
                    />
                  </div>
                  {passwordError && (
                    <div className="p-2 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold leading-normal">
                      ⚠️ {passwordError}
                    </div>
                  )}
                  {passwordSuccess && (
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold">
                      ✓ {passwordSuccess}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-1.5 px-3 rounded-lg text-[11px] cursor-pointer"
                  >
                    {passwordLoading ? 'Updating Password...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Section 7: Account Deletion */}
          <div className="space-y-3 border-t border-slate-100 dark:border-neutral-800/80 pt-5">
            <h4 className="text-xs font-bold text-rose-500 uppercase tracking-wider">Account Deletion</h4>
            <p className="text-[11px] text-rose-600 dark:text-rose-400/90 leading-normal">
              Permanently and irreversibly delete your Zimu account. This deletes your credentials and recursively sweeps all of your Firestore documents and subcollections (flashcards, read history, custom progress).
            </p>
            <div className="space-y-2">
              <label htmlFor="delete-confirm-input" className="block text-[10px] font-bold text-slate-500 dark:text-slate-400">
                Type <span className="font-mono text-rose-500 font-black">DELETE</span> below to confirm deletion:
              </label>
              <input
                id="delete-confirm-input"
                type="text"
                value={deleteInput}
                onChange={(e) => setDeleteInput(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 bg-rose-50/20 dark:bg-rose-950/10 border border-rose-200 dark:border-rose-900/50 rounded-lg text-sm font-black tracking-widest text-rose-700 dark:text-rose-300"
              />
              {deleteErrorMsg && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold leading-normal">
                  ⚠️ Deletion error: {deleteErrorMsg}
                </div>
              )}
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteInput !== 'DELETE' || isDeleting}
                className="w-full text-center bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:hover:bg-rose-600 text-white font-bold py-2.5 rounded-xl text-xs cursor-pointer transition-all flex items-center justify-center gap-1"
              >
                {isDeleting ? 'Erasing User Profile...' : 'Permanently Delete My Account'}
              </button>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-neutral-800 bg-slate-50 dark:bg-neutral-900/80 flex items-center justify-between">
          <button
            onClick={() => {
              setShowSettingsModal(false);
              logout();
            }}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 dark:text-rose-400 font-bold text-xs rounded-xl border border-rose-200 dark:border-rose-900/60 cursor-pointer transition duration-150"
          >
            Sign Out
          </button>
          
          <button
            onClick={() => setShowSettingsModal(false)}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-neutral-700 cursor-pointer transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}