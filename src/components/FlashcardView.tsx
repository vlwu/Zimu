import React from 'react';
import { convertTonality } from '@/lib/pinyin';

interface FlashcardViewProps {
  flashcardsLoading: boolean;
  flashcardsList: any[];
  sessionComplete: boolean;
  currentCardIndex: number;
  setCurrentCardIndex: React.Dispatch<React.SetStateAction<number>>;
  showBack: boolean;
  setShowBack: (val: boolean) => void;
  sessionLimit: number;
  setSessionLimit: (val: number) => void;
  startFlashcardSession: (limit: number) => void;
  handleRateCard: (quality: number) => void;
}

const getHskBadgeColors = (level: number) => {
  switch (level) {
    case 1:
      return 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60';
    case 2:
      return 'bg-sky-50 dark:bg-sky-950/20 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-900/60';
    case 3:
      return 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/60';
    case 4:
      return 'bg-orange-50 dark:bg-orange-950/20 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-900/60';
    case 5:
      return 'bg-rose-50 dark:bg-rose-950/20 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900/60';
    case 6:
      return 'bg-violet-50 dark:bg-violet-950/20 text-violet-800 dark:text-violet-300 border-violet-200 dark:border-violet-900/60';
    case 7:
      return 'bg-fuchsia-50 dark:bg-fuchsia-950/20 text-fuchsia-800 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-900/60';
    default:
      return 'bg-slate-50 dark:bg-neutral-800/50 text-slate-600 dark:text-neutral-400 border-slate-200 dark:border-neutral-700';
  }
};

export function FlashcardView({
  flashcardsLoading,
  flashcardsList,
  sessionComplete,
  currentCardIndex,
  setCurrentCardIndex,
  showBack,
  setShowBack,
  sessionLimit,
  setSessionLimit,
  startFlashcardSession,
  handleRateCard,
}: FlashcardViewProps) {
  return (
    <div className="space-y-6">
      <div className="border-b border-slate-100 dark:border-neutral-800 pb-3">
        <span className="text-[10px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase">
          SRS Spaced Repetition
        </span>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
          Flashcard Practice
        </h2>
      </div>

      {flashcardsLoading ? (
        <div className="text-center py-20 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl shadow-xs">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-slate-500 dark:text-slate-400 mt-4 text-sm font-medium">Assembling your practice cards...</p>
        </div>
      ) : flashcardsList.length === 0 || sessionComplete ? (
        <div className="text-center py-12 px-6 border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900/50 shadow-inner max-w-lg mx-auto">
          {sessionComplete ? (
            <>
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Review Complete!</h3>
              <p className="text-slate-500 dark:text-neutral-400 mb-6 text-sm leading-relaxed">
                You've finished your review session. Your updated recall metrics have been saved, and these words have been rescheduled.
              </p>
            </>
          ) : (
            <>
              <svg className="w-12 h-12 text-blue-500 dark:text-blue-400 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 6v.75m0 3v.75m0 3v.75m0 3V18m-3-12h.008v.008H13.5V6zm0 3h.008v.008H13.5V9zm0 3h.008v.008H13.5v-.008zm0 3h.008v.008H13.5v-.008zm0 3h.008v.008H13.5V18z" />
              </svg>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Ready for flashcard practice?</h3>
              <p className="text-slate-500 dark:text-neutral-400 mb-6 text-sm leading-relaxed">
                Cards are drawn exclusively from your known-words list and level-appropriate vocabulary, prioritizing due items.
              </p>
            </>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm bg-slate-50 dark:bg-neutral-800 p-3 rounded-xl border border-slate-200/50 dark:border-neutral-700/50">
              <span className="font-semibold text-slate-600 dark:text-slate-300">Session length:</span>
              <select
                value={sessionLimit}
                onChange={(e) => setSessionLimit(Number(e.target.value))}
                className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 font-bold px-2.5 py-1 rounded-lg text-xs"
              >
                <option value={10}>10 cards (Short)</option>
                <option value={15}>15 cards (Standard)</option>
                <option value={25}>25 cards (Medium)</option>
                <option value={50}>50 cards (Long)</option>
              </select>
            </div>

            <button
              onClick={() => startFlashcardSession(sessionLimit)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl shadow-md transition duration-150 cursor-pointer text-sm"
            >
              Start Session ({sessionLimit} Cards)
            </button>
          </div>
        </div>
      ) : (
        <div className="max-w-lg mx-auto space-y-6">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 dark:text-neutral-500 px-1">
            <span>Card {currentCardIndex + 1} of {flashcardsList.length}</span>
            <span className="bg-slate-100 dark:bg-neutral-800 px-2 py-0.5 rounded">
              {flashcardsList[currentCardIndex].progress ? 'Review' : 'New'}
            </span>
          </div>

          <div 
            onClick={() => { if (!showBack) setShowBack(true); }}
            className={`relative min-h-64 flex flex-col items-center justify-center rounded-2xl border bg-white dark:bg-neutral-900 p-8 shadow-sm select-none transition-all duration-300 ${
              !showBack ? 'cursor-pointer hover:border-blue-400 dark:hover:border-blue-800' : 'border-slate-200 dark:border-neutral-800'
            }`}
          >
            <div className="text-center">
              <span className="text-5xl sm:text-6xl font-extrabold tracking-widest text-slate-900 dark:text-white block">
                {flashcardsList[currentCardIndex].word}
              </span>
              {flashcardsList[currentCardIndex].traditional !== flashcardsList[currentCardIndex].word && showBack && (
                <span className="text-xs text-slate-400 dark:text-neutral-500 font-bold block mt-2">
                  Traditional: {flashcardsList[currentCardIndex].traditional}
                </span>
              )}
            </div>

            {showBack ? (
              <div className="mt-8 pt-6 border-t border-slate-100 dark:border-neutral-800/80 w-full text-center space-y-3 animate-fadeIn">
                <span className="text-xl sm:text-2xl text-blue-600 dark:text-blue-400 font-bold block">
                  {convertTonality(flashcardsList[currentCardIndex].pinyin)}
                </span>
                <span className="text-sm sm:text-base text-slate-600 dark:text-neutral-300 block italic leading-relaxed">
                  {flashcardsList[currentCardIndex].definition}
                </span>
                {flashcardsList[currentCardIndex].hsk && (
                  <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold border ${getHskBadgeColors(flashcardsList[currentCardIndex].hsk)}`}>
                    HSK {flashcardsList[currentCardIndex].hsk === 7 ? '7-9' : flashcardsList[currentCardIndex].hsk}
                  </span>
                )}
              </div>
            ) : (
              <div className="absolute bottom-6 text-xs text-slate-400 dark:text-neutral-500 font-bold animate-pulse">
                Tap or click anywhere to reveal
              </div>
            )}
          </div>

          {showBack ? (
            <div className="space-y-3">
              <p className="text-center text-xs font-bold text-slate-500 dark:text-neutral-400">
                Rate your recall:
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleRateCard(1)} // Again
                  className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 px-1.5 rounded-xl text-center text-xs sm:text-sm shadow-md transition-colors cursor-pointer flex flex-col items-center gap-0.5"
                >
                  <span>Again</span>
                  <span className="text-[10px] font-medium opacity-80">1d</span>
                </button>
                <button
                  onClick={() => handleRateCard(3)} // Hard
                  className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold py-3.5 px-1.5 rounded-xl text-center text-xs sm:text-sm shadow-md transition-colors cursor-pointer flex flex-col items-center gap-0.5"
                >
                  <span>Hard</span>
                  <span className="text-[10px] font-medium opacity-80">
                    {flashcardsList[currentCardIndex].progress && flashcardsList[currentCardIndex].progress.interval > 1
                      ? `${Math.round(flashcardsList[currentCardIndex].progress.interval * 1.2)}d`
                      : '1d'}
                  </span>
                </button>
                <button
                  onClick={() => handleRateCard(4)} // Good
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-1.5 rounded-xl text-center text-xs sm:text-sm shadow-md transition-colors cursor-pointer flex flex-col items-center gap-0.5"
                >
                  <span>Good</span>
                  <span className="text-[10px] font-medium opacity-80">
                    {flashcardsList[currentCardIndex].progress && flashcardsList[currentCardIndex].progress.repetition > 1
                      ? `${Math.round(flashcardsList[currentCardIndex].progress.interval * flashcardsList[currentCardIndex].progress.efactor)}d`
                      : flashcardsList[currentCardIndex].progress?.repetition === 1 ? '6d' : '1d'}
                  </span>
                </button>
                <button
                  onClick={() => handleRateCard(5)} // Easy
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-1.5 rounded-xl text-center text-xs sm:text-sm shadow-md transition-colors cursor-pointer flex flex-col items-center gap-0.5"
                >
                  <span>Easy</span>
                  <span className="text-[10px] font-medium opacity-80">
                    {flashcardsList[currentCardIndex].progress && flashcardsList[currentCardIndex].progress.repetition > 1
                      ? `${Math.round(flashcardsList[currentCardIndex].progress.interval * flashcardsList[currentCardIndex].progress.efactor * 1.3)}d`
                      : '4d'}
                  </span>
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowBack(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-md transition duration-150 text-center cursor-pointer text-sm"
            >
              Reveal Answer
            </button>
          )}
        </div>
      )}
    </div>
  );
}