'use client';

import React from 'react';
import { useHomeReader } from '@/hooks/useHomeReader';
import { HistorySidebar } from '@/components/HistorySidebar';
import { ReaderHeader } from '@/components/ReaderHeader';
import { StoryView } from '@/components/StoryView';
import { FlashcardView } from '@/components/FlashcardView';
import { WordPopup } from '@/components/WordPopup';

export default function HomeReaderPage() {
  const reader = useHomeReader();

  // Dialog Key Setup State Management
  const [apiKeyInputValue, setApiKeyInputValue] = React.useState('');
  const [validatingKey, setValidatingKey] = React.useState(false);
  const [validationError, setValidationError] = React.useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = React.useState(false);

  // Sync initial input value when key setup modal loads
  React.useEffect(() => {
    if (reader.showApiKeyModal && reader.geminiApiKey) {
      setApiKeyInputValue(reader.geminiApiKey);
    }
  }, [reader.showApiKeyModal, reader.geminiApiKey]);

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
        await reader.updateGeminiApiKey(apiKeyInputValue.trim());
        setValidationSuccess(true);
        setApiKeyInputValue('');
        setTimeout(() => {
          reader.setShowApiKeyModal(false);
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

  if (reader.userProgressLoading || !reader.userId) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-neutral-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-500 mt-4 text-sm font-semibold tracking-wide">Synchronizing profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-neutral-950 flex flex-col md:flex-row">
      
      {/* Drawer Overlay for Mobile History */}
      {reader.isHistoryOpen && (
        <div 
          className="fixed inset-0 bg-neutral-900/40 z-40 md:hidden backdrop-blur-xs"
          onClick={() => reader.setIsHistoryOpen(false)}
        />
      )}

      {/* History Sidebar Panel */}
      <HistorySidebar
        isHistoryOpen={reader.isHistoryOpen}
        setIsHistoryOpen={reader.setIsHistoryOpen}
        storyHistory={reader.storyHistory}
        storyId={reader.story?.storyId}
        selectStoryFromHistory={reader.selectStoryFromHistory}
        openLevels={reader.openLevels}
        toggleLevel={reader.toggleLevel}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        
        {/* Navigation & Toolbar Header */}
        <ReaderHeader
          isHistoryOpen={reader.isHistoryOpen}
          setIsHistoryOpen={reader.setIsHistoryOpen}
          targetHskLevel={reader.targetHskLevel}
          updateTargetHskLevel={reader.updateTargetHskLevel}
          fetchNewStory={reader.fetchNewStory}
          loading={reader.loading}
          logout={reader.logout}
          viewMode={reader.viewMode}
          setViewMode={reader.setViewMode}
          storyLength={reader.storyLength}
          setStoryLength={reader.setStoryLength}
          setShowApiKeyModal={reader.setShowApiKeyModal}
          setShowTipsModal={reader.setShowTipsModal}
        />

        {reader.viewMode === 'flashcards' ? (
          <FlashcardView
            flashcardsLoading={reader.flashcardsLoading}
            flashcardsList={reader.flashcardsList}
            sessionComplete={reader.sessionComplete}
            currentCardIndex={reader.currentCardIndex}
            setCurrentCardIndex={reader.setCurrentCardIndex}
            showBack={reader.showBack}
            setShowBack={reader.setShowBack}
            sessionLimit={reader.sessionLimit}
            setSessionLimit={reader.setSessionLimit}
            startFlashcardSession={reader.startFlashcardSession}
            handleRateCard={reader.handleRateCard}
          />
        ) : (
          reader.story ? (
            <StoryView
              story={reader.story}
              showPinyin={reader.showPinyin}
              setShowPinyin={reader.setShowPinyin}
              colorCodeHsk={reader.colorCodeHsk}
              setColorCodeHsk={reader.setColorCodeHsk}
              knownWords={reader.knownWords}
              setActiveToken={reader.setActiveToken}
              toggleWordKnown={reader.toggleWordKnown}
              quizAnswers={reader.quizAnswers}
              setQuizAnswers={reader.setQuizAnswers}
              quizSubmitted={reader.quizSubmitted}
              setQuizSubmitted={reader.setQuizSubmitted}
              isStoryCompleted={reader.isStoryCompleted}
              setIsStoryCompleted={reader.setIsStoryCompleted}
            />
          ) : (
            <div className="text-center py-20 px-6 border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900/50 shadow-inner">
              <svg className="w-12 h-12 text-slate-300 dark:text-neutral-700 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <p className="text-slate-500 dark:text-neutral-400 mb-5 max-w-sm mx-auto text-sm leading-relaxed">
                No active story loaded. Select your target language level and generate your first custom contextual story.
              </p>
              <button
                onClick={reader.fetchNewStory}
                disabled={reader.loading}
                className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition duration-150 cursor-pointer shadow-md shadow-blue-500/10"
              >
                {reader.loading ? 'Creating custom reader...' : 'Generate First Story'}
              </button>
            </div>
          )
        )}
      </div>

      {reader.activeToken && (
        <WordPopup
          activeToken={reader.activeToken}
          setActiveToken={reader.setActiveToken}
          knownWords={reader.knownWords}
          toggleWordKnown={reader.toggleWordKnown}
        />
      )}

      {/* Gemini API Key Config / Onboarding Dialog Overlay */}
      {reader.showApiKeyModal && (
        <div className="fixed inset-0 bg-neutral-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
                </svg>
                <span>Gemini API Key Setup</span>
              </h3>
              <button
                onClick={() => {
                  reader.setShowApiKeyModal(false);
                  reader.setApiKeySetupSkipped(true);
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
                {reader.geminiApiKey ? `Active: ${reader.geminiApiKey.substring(0, 8)}...` : 'No API key currently set.'}
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
                    reader.setShowApiKeyModal(false);
                    reader.setApiKeySetupSkipped(true);
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

              {reader.geminiApiKey && (
                <button
                  type="button"
                  onClick={async () => {
                    const confirmClear = window.confirm("Are you sure you want to remove your API Key?");
                    if (confirmClear) {
                      await reader.updateGeminiApiKey(null);
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
      )}

      {/* Quick Study Tips Modal */}
      {reader.showTipsModal && (
        <div className="fixed inset-0 bg-neutral-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fadeIn">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-neutral-800">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707M12 5a7 7 0 00-7 7c0 2.902 1.86 5.37 4.433 6.273a.75.75 0 00.567-.04V20a1 1 0 001 1h2a1 1 0 001-1v-1.767a.75.75 0 00.567.04A7.001 7.001 0 0012 5z" />
                </svg>
                <span>Quick Study Tips</span>
              </h3>
              <button
                onClick={() => reader.setShowTipsModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xl font-bold cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
              <div className="flex gap-3">
                <div className="text-amber-500 font-bold text-lg select-none">💡</div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Tap to Define</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                    Click on any Chinese word in a story to view its translation, pinyin guide, and HSK level in the definition popup.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="text-amber-500 font-bold text-lg select-none">💡</div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Toggle Known Words</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                    Double-click any word in a story (or use the button inside the definition popup) to instantly toggle whether you know it or not.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="text-amber-500 font-bold text-lg select-none">💡</div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Visual Color-Coding</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                    With "Color Code" active, words matching your current study tier are highlighted. Once marked "Known", they fade to let you focus on new vocabulary.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="text-amber-500 font-bold text-lg select-none">💡</div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Comprehension Checks</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                    Complete the 3-question quiz at the bottom of each story to solidify your reading comprehension and save the lesson to your history.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="text-amber-500 font-bold text-lg select-none">💡</div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Spaced Repetition (SRS)</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                    Switch to the "Flashcard Review" tab to practice words you are learning using our built-in spaced repetition system (SM-2).
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="text-amber-500 font-bold text-lg select-none">💡</div>
                <div className="space-y-0.5">
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Pinyin Pronunciation Toggle</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">
                    Toggle pinyin guides on or off depending on whether you want to practice reading raw characters or verify pronunciation.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => reader.setShowTipsModal(false)}
              className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-lg text-xs cursor-pointer transition-all text-center"
            >
              Got it, thanks!
            </button>
          </div>
        </div>
      )}
    </div>
  );
}