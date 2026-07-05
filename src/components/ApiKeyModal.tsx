import React, { useState, useEffect } from 'react';

interface ApiKeyModalProps {
  showApiKeyModal: boolean;
  setShowApiKeyModal: (val: boolean) => void;
  geminiApiKey: string | null;
  updateGeminiApiKey: (key: string | null) => Promise<void>;
  setApiKeySetupSkipped: (val: boolean) => void;
}

export function ApiKeyModal({
  showApiKeyModal,
  setShowApiKeyModal,
  geminiApiKey,
  updateGeminiApiKey,
  setApiKeySetupSkipped,
}: ApiKeyModalProps) {
  const [apiKeyInputValue, setApiKeyInputValue] = useState('');
  const [validatingKey, setValidatingKey] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState(false);

  // Sync initial input value when key setup modal loads
  useEffect(() => {
    if (showApiKeyModal && geminiApiKey) {
      setApiKeyInputValue(geminiApiKey);
    } else if (!showApiKeyModal) {
      setApiKeyInputValue('');
      setValidationError(null);
      setValidationSuccess(false);
    }
  }, [showApiKeyModal, geminiApiKey]);

  const handleVerifyAndSaveKey = async () => {
    setValidationError(null);
    setValidationSuccess(false);
    setValidatingKey(true);

    try {
      const res = await fetch('/api/validate-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ geminiApiKey: apiKeyInputValue.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        await updateGeminiApiKey(apiKeyInputValue.trim());
        setValidationSuccess(true);
        setApiKeyInputValue('');
        setTimeout(() => {
          setShowApiKeyModal(false);
          setValidationSuccess(false);
        }, 1500);
      } else {
        setValidationError(data.error || 'Invalid API Key. Please verify and try again.');
      }
    } catch (err: any) {
      setValidationError(err.message || 'Verification request failed. Please check network connectivity.');
    } finally {
      setValidatingKey(false);
    }
  };

  if (!showApiKeyModal) return null;

  return (
    <div className="fixed inset-0 bg-neutral-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
            <span>Gemini API Key Setup</span>
          </h3>
          <button
            onClick={() => {
              setShowApiKeyModal(false);
              setApiKeySetupSkipped(true);
            }}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold cursor-pointer"
          >
            &times;
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
          Zimu uses Gemini to write custom, context-calibrated Chinese stories. To generate custom readers, configure your own Gemini API Key.
        </p>
        
        <div className="space-y-1">
          <span className="block text-xs font-bold text-slate-700 dark:text-slate-300">
            Current Status:
          </span>
          <div className="text-xs font-mono bg-slate-100 dark:bg-neutral-800 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300 truncate">
            {geminiApiKey ? `Active: ${geminiApiKey.substring(0, 8)}...` : 'No API key currently set.'}
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label htmlFor="modal-api-key" className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Enter Gemini API Key:
            </label>
            <input
              id="modal-api-key"
              type="password"
              value={apiKeyInputValue}
              onChange={(e) => setApiKeyInputValue(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-slate-300 dark:border-neutral-700 rounded-lg text-sm shadow-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-slate-100 font-mono"
            />
          </div>

          {validationError && (
            <div className="p-2.5 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 rounded-lg text-xs font-semibold leading-normal">
              ⚠️ {validationError}
            </div>
          )}

          {validationSuccess && (
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-semibold">
              ✓ API Key successfully verified and saved!
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setShowApiKeyModal(false);
                setApiKeySetupSkipped(true);
              }}
              className="flex-1 bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-lg text-xs cursor-pointer transition-all text-center"
            >
              Skip for Now
            </button>
            
            <button
              type="button"
              disabled={validatingKey || !apiKeyInputValue}
              onClick={handleVerifyAndSaveKey}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg text-xs cursor-pointer transition-all text-center flex items-center justify-center gap-1.5"
            >
              {validatingKey ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Validate & Save Key</span>
              )}
            </button>
          </div>

          {geminiApiKey && (
            <button
              type="button"
              onClick={async () => {
                const confirmClear = window.confirm("Are you sure you want to remove your API Key?");
                if (confirmClear) {
                  await updateGeminiApiKey(null);
                  setApiKeyInputValue('');
                  setValidationError(null);
                  setValidationSuccess(true);
                  setTimeout(() => setValidationSuccess(false), 2000);
                }
              }}
              className="w-full text-center text-[10px] font-bold text-rose-500 hover:text-rose-600 cursor-pointer pt-2"
            >
              Clear Current Key
            </button>
          )}
        </div>

        <p className="text-[10px] text-slate-400 dark:text-neutral-500 text-center leading-normal">
          Your key is used exclusively on your behalf for story requests, stored securely, and is never shared publicly or stored outside your authenticated Firestore document.
        </p>
      </div>
    </div>
  );
}