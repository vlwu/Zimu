'use client';

import React from 'react';
import { useHomeReader } from '@/hooks/useHomeReader';
import { HistorySidebar } from '@/components/HistorySidebar';
import { ReaderHeader } from '@/components/ReaderHeader';
import { StoryView } from '@/components/StoryView';
import { FlashcardView } from '@/components/FlashcardView';
import { SettingsView } from '@/components/SettingsView';
import { WordPopup } from '@/components/WordPopup';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { QuickTipsModal } from '@/components/QuickTipsModal';
import { LandingPage } from '@/components/LandingPage';

const SettingsViewWithProps = SettingsView as React.ComponentType<{
  showSettingsModal: boolean;
  setShowSettingsModal: React.Dispatch<React.SetStateAction<boolean>>;
}>;

export default function HomeReaderPage() {
  const reader = useHomeReader();

  if (reader.userProgressLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-neutral-950">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-500 mt-4 text-sm font-semibold tracking-wide">Synchronizing profile...</p>
        </div>
      </div>
    );
  }

  // If the user is unauthenticated, render the newly designed LandingPage
  if (!reader.userId) {
    return <LandingPage />;
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
          viewMode={reader.viewMode as any}
          setViewMode={reader.setViewMode as any}
          storyLength={reader.storyLength}
          setStoryLength={reader.setStoryLength}
          setShowApiKeyModal={reader.setShowApiKeyModal}
          setShowTipsModal={reader.setShowTipsModal}
          nickname={reader.nickname}
          setShowSettingsModal={reader.setShowSettingsModal}
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
              onCompleteStory={reader.completeStory}
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
      <ApiKeyModal
        showApiKeyModal={reader.showApiKeyModal}
        setShowApiKeyModal={reader.setShowApiKeyModal}
        geminiApiKey={reader.geminiApiKey}
        updateGeminiApiKey={reader.updateGeminiApiKey}
        setApiKeySetupSkipped={reader.setApiKeySetupSkipped}
      />

      {/* Settings Modal Component */}
      <SettingsViewWithProps
        showSettingsModal={reader.showSettingsModal}
        setShowSettingsModal={reader.setShowSettingsModal}
      />

      {/* Quick Study Tips Modal */}
      <QuickTipsModal
        showTipsModal={reader.showTipsModal}
        setShowTipsModal={reader.setShowTipsModal}
      />
    </div>
  );
}