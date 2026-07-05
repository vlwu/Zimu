import React from 'react';

interface QuickTipsModalProps {
  showTipsModal: boolean;
  setShowTipsModal: (val: boolean) => void;
}

export function QuickTipsModal({ showTipsModal, setShowTipsModal }: QuickTipsModalProps) {
  if (!showTipsModal) return null;

  return (
    <div className="fixed inset-0 bg-neutral-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-neutral-800">
          <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707M12 5a7 7 0 00-7 7c0 2.902 1.86 5.37 4.433 6.273a.75.75 0 00.567-.04V20a1 1 0 001 1h2a1 1 0 001-1v-1.767a.75.75 0 00.567.04A7.001 7.001 0 0012 5z" />
            </svg>
            <span>Quick Study Tips</span>
          </h3>
          <button
            onClick={() => setShowTipsModal(false)}
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
          onClick={() => setShowTipsModal(false)}
          className="w-full bg-slate-100 hover:bg-slate-200 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-slate-700 dark:text-slate-300 font-bold py-2.5 rounded-lg text-xs cursor-pointer transition-all text-center"
        >
          Got it, thanks!
        </button>
      </div>
    </div>
  );
}