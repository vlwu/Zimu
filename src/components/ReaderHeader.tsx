import React from 'react';

interface ReaderHeaderProps {
  isHistoryOpen: boolean;
  setIsHistoryOpen: (val: boolean) => void;
  targetHskLevel: number;
  updateTargetHskLevel: (val: number) => void;
  fetchNewStory: () => void;
  loading: boolean;
  logout: () => void;
  viewMode: 'stories' | 'flashcards';
  setViewMode: (mode: 'stories' | 'flashcards') => void;
  storyLength: 'short' | 'medium' | 'long';
  setStoryLength: (len: 'short' | 'medium' | 'long') => void;
  setShowApiKeyModal?: (val: boolean) => void;
}

export function ReaderHeader({
  isHistoryOpen,
  setIsHistoryOpen,
  targetHskLevel,
  updateTargetHskLevel,
  fetchNewStory,
  loading,
  logout,
  viewMode,
  setViewMode,
  storyLength,
  setStoryLength,
  setShowApiKeyModal,
}: ReaderHeaderProps) {
  return (
    <header className="flex flex-col gap-4 mb-6 pb-4 border-b border-slate-200 dark:border-neutral-800">
      <div className="flex justify-between items-center w-full gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="md:hidden p-2 rounded-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-600 dark:text-slate-300 transition cursor-pointer"
            title="Toggle History"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Zimu <span className="text-slate-400 dark:text-neutral-500 font-normal">字幕</span>
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Level Selector Dropdown */}
          <div className="relative group min-w-35">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 011.875 1.875v1.5a1.875 1.875 0 01-1.875 1.875H5.625a1.875 1.875 0 01-1.875-1.875v-1.5c0-1.036.84-1.875 1.875-1.875z" />
              </svg>
            </div>
            <select
              id="hsk-select"
              value={targetHskLevel}
              onChange={(e) => updateTargetHskLevel(Number(e.target.value))}
              className="appearance-none w-full bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 hover:border-blue-400 dark:hover:border-blue-500 text-slate-800 dark:text-slate-100 font-bold text-sm rounded-xl pl-9 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all cursor-pointer shadow-sm"
            >
              <option value={1}>HSK 1 (Beginner)</option>
              <option value={2}>HSK 2 (Elementary)</option>
              <option value={3}>HSK 3 (Intermediate)</option>
              <option value={4}>HSK 4 (Upper Int.)</option>
              <option value={5}>HSK 5 (Advanced)</option>
              <option value={6}>HSK 6 (Proficient)</option>
              <option value={7}>HSK 7-9 (Mastery)</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" />
              </svg>
            </div>
          </div>

          <button
            onClick={fetchNewStory}
            disabled={loading}
            className="px-4 py-2 text-xs sm:text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-all font-semibold shadow-xs shadow-blue-500/20 cursor-pointer flex items-center gap-1.5"
          >
            {loading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span>New Story</span>
              </>
            )}
          </button>

          {/* Gemini API Key Settings Panel Toggle */}
          <button
            onClick={() => setShowApiKeyModal?.(true)}
            className="p-2 text-slate-500 hover:text-blue-600 dark:text-neutral-400 dark:hover:text-blue-400 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 rounded-lg transition duration-150 cursor-pointer"
            title="Gemini API Key Settings"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
            </svg>
          </button>

          <button
            onClick={logout}
            className="p-2 text-slate-500 hover:text-red-600 dark:text-neutral-400 dark:hover:text-red-400 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700 rounded-lg transition duration-150 cursor-pointer"
            title="Logout"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
            </svg>
          </button>
        </div>
      </div>

      {/* Primary View Switcher Navigation Tab */}
      <div className="flex bg-slate-100 dark:bg-neutral-800 p-1 rounded-xl w-full border border-slate-200/50 dark:border-neutral-700/50">
        <button
          onClick={() => setViewMode('stories')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition cursor-pointer ${
            viewMode === 'stories'
              ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Stories
        </button>
        <button
          onClick={() => setViewMode('flashcards')}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition cursor-pointer ${
            viewMode === 'flashcards'
              ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-white shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Flashcard Review
        </button>
      </div>

      {/* Target Story Length Slider / Selection Toolbar (Shown in Story mode) */}
      {viewMode === 'stories' && (
        <div className="flex items-center justify-between bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl p-3 shadow-2xs w-full">
          <span className="text-xs font-bold text-slate-500 dark:text-neutral-400 flex items-center gap-1">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
            </svg>
            <span>Estimated Story Length:</span>
          </span>
          <div className="flex bg-slate-100 dark:bg-neutral-800 p-0.5 rounded-lg border border-slate-200/50 dark:border-neutral-700/50">
            <button
              onClick={() => setStoryLength('short')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                storyLength === 'short'
                  ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Short (80-150)
            </button>
            <button
              onClick={() => setStoryLength('medium')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                storyLength === 'medium'
                  ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Medium (150-250)
            </button>
            <button
              onClick={() => setStoryLength('long')}
              className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                storyLength === 'long'
                  ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Long (250-400)
            </button>
          </div>
        </div>
      )}
    </header>
  );
}