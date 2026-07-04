import React from 'react';
import { Token } from '@/lib/types';
import { convertTonality } from '@/lib/pinyin';

interface WordPopupProps {
  activeToken: Token;
  setActiveToken: (val: Token | null) => void;
  knownWords: string[];
  toggleWordKnown: (word: string) => void;
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

export function WordPopup({
  activeToken,
  setActiveToken,
  knownWords,
  toggleWordKnown,
}: WordPopupProps) {
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-2xl p-6 rounded-2xl z-50 animate-fadeIn">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{activeToken.text}</h3>
          <p className="text-blue-600 dark:text-blue-400 font-bold text-sm tracking-wide mt-0.5">
            {activeToken.pinyin ? convertTonality(activeToken.pinyin) : 'No pinyin'}
          </p>
        </div>
        <button
          onClick={() => setActiveToken(null)}
          className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-2xl font-bold cursor-pointer"
        >
          &times;
        </button>
      </div>

      <p className="text-slate-600 dark:text-neutral-300 text-base mb-5 leading-relaxed bg-slate-50 dark:bg-neutral-800/40 p-3 rounded-lg border border-slate-100 dark:border-neutral-800/80 mt-2">
        {activeToken.definition || 'Definition not available.'}
      </p>

      <div className="flex gap-3">
        {knownWords.includes(activeToken.text) ? (
          <button
            onClick={() => toggleWordKnown(activeToken.text)}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-3 px-4 rounded-xl transition duration-150 cursor-pointer shadow-xs shadow-emerald-500/15 text-center flex items-center justify-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span>Known (Click to Undo)</span>
          </button>
        ) : (
          <button
            onClick={() => toggleWordKnown(activeToken.text)}
            className="flex-1 border-2 border-slate-200 hover:border-emerald-600 hover:bg-emerald-50 dark:border-neutral-700 dark:hover:bg-emerald-950/10 text-slate-700 dark:text-slate-300 hover:text-emerald-800 dark:hover:text-emerald-300 text-sm font-bold py-3 px-4 rounded-xl transition duration-150 cursor-pointer text-center"
          >
            ✓ Mark as Known
          </button>
        )}

        {activeToken.hsk && (
          <span className={`px-4 py-3 rounded-xl text-xs font-bold flex items-center justify-center border ${getHskBadgeColors(activeToken.hsk)}`}>
            HSK {activeToken.hsk === 7 ? '7-9' : activeToken.hsk}
          </span>
        )}
      </div>
    </div>
  );
}