import React from 'react';
import { Token, ComprehensionQuestion } from '@/lib/types';
import { convertTonality } from '@/lib/pinyin';

interface StoryViewProps {
  story: {
    storyId: string;
    title: string;
    translation: string;
    targetLevel?: number;
    tokens: Token[];
    comprehensionQuestions?: ComprehensionQuestion[];
  };
  showPinyin: boolean;
  setShowPinyin: (val: boolean) => void;
  colorCodeHsk: boolean;
  setColorCodeHsk: (val: boolean) => void;
  knownWords: string[];
  setActiveToken: (token: Token) => void;
  toggleWordKnown: (word: string) => void;
  quizAnswers: Record<number, number>;
  setQuizAnswers: React.Dispatch<React.SetStateAction<Record<number, number>>>;
  quizSubmitted: boolean;
  setQuizSubmitted: (val: boolean) => void;
  isStoryCompleted: boolean;
  setIsStoryCompleted: (val: boolean) => void;
  onCompleteStory?: (storyId: string) => void;
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

const getHskColorClass = (hsk: number | null | undefined, isKnown: boolean) => {
  if (!hsk) return 'hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-800 dark:text-slate-200';
  
  const opacityStyle = isKnown ? 'opacity-50 hover:opacity-100 transition duration-150 border-dotted' : 'border-b-2 font-bold';

  switch (hsk) {
    case 1:
      return `${opacityStyle} bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-800/90 dark:text-emerald-300/90 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100/70 dark:hover:bg-emerald-900/30`;
    case 2:
      return `${opacityStyle} bg-sky-50/50 dark:bg-sky-950/10 text-sky-800/90 dark:text-sky-300/90 border-sky-300 dark:border-sky-800 hover:bg-sky-100/70 dark:hover:bg-sky-900/30`;
    case 3:
      return `${opacityStyle} bg-amber-50/50 dark:bg-amber-950/10 text-amber-800/90 dark:text-amber-300/90 border-amber-300 dark:border-amber-800 hover:bg-amber-100/70 dark:hover:bg-amber-900/30`;
    case 4:
      return `${opacityStyle} bg-orange-50/50 dark:bg-orange-950/10 text-orange-800/90 dark:text-orange-300/90 border-orange-300 dark:border-orange-800 hover:bg-orange-100/70 dark:hover:bg-orange-900/30`;
    case 5:
      return `${opacityStyle} bg-rose-50/50 dark:bg-rose-950/10 text-rose-800/90 dark:text-rose-300/90 border-rose-300 dark:border-rose-800 hover:bg-rose-100/70 dark:hover:bg-rose-900/30`;
    case 6:
      return `${opacityStyle} bg-violet-50/50 dark:bg-violet-950/10 text-violet-800/90 dark:text-violet-300/90 border-violet-300 dark:border-violet-800 hover:bg-violet-100/70 dark:hover:bg-violet-900/30`;
    default:
      return `${opacityStyle} bg-fuchsia-50/50 dark:bg-fuchsia-950/10 text-fuchsia-800/90 dark:text-fuchsia-300/90 border-fuchsia-300 dark:border-fuchsia-800 hover:bg-fuchsia-100/70 dark:hover:bg-fuchsia-900/30`;
  }
};

export function StoryView({
  story,
  showPinyin,
  setShowPinyin,
  colorCodeHsk,
  setColorCodeHsk,
  knownWords,
  setActiveToken,
  toggleWordKnown,
  quizAnswers,
  setQuizAnswers,
  quizSubmitted,
  setQuizSubmitted,
  isStoryCompleted,
  setIsStoryCompleted,
  onCompleteStory,
}: StoryViewProps) {
  return (
    <main className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-neutral-800 pb-3">
        <div>
          <span className="text-[10px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase">
            HSK {story.targetLevel ? (story.targetLevel === 7 ? '7-9' : story.targetLevel) : 'custom'} Reader
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">{story.title}</h2>
        </div>
        
        {/* Interactive Toolbar Options */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setShowPinyin(!showPinyin)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition duration-150 flex items-center gap-1 ${
              showPinyin
                ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900'
                : 'bg-white border-slate-200 text-slate-700 dark:bg-neutral-900 dark:text-slate-300 dark:border-neutral-800'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>{showPinyin ? 'Pinyin' : 'No Pinyin'}</span>
          </button>

          <button
            onClick={() => setColorCodeHsk(!colorCodeHsk)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition duration-150 flex items-center gap-1 ${
              colorCodeHsk
                ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900'
                : 'bg-white border-slate-200 text-slate-700 dark:bg-neutral-900 dark:text-slate-300 dark:border-neutral-800'
            }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 00-5.78 1.128 2.25 2.25 0 01-2.4 2.245 4.5 4.5 0 008.4-2.245c0-.399-.078-.78-.22-1.128zm0 0a15.998 15.998 0 003.388-1.62m-5.01-1.25a15.998 15.998 0 011.355-1.758m1.355-1.758a15.998 15.998 0 012.3-1.624m2.3-1.624a15.997 15.997 0 012.87-1.472m-3.41 1.745a15.986 15.986 0 00-2.87 2.228m-2.87 2.228a15.986 15.986 0 00-1.625 2.383m-1.625 2.383a15.986 15.986 0 00-1.1 2.875m-.385-11.49a3.75 3.75 0 114.95 4.95l-4.95-4.95z" />
            </svg>
            <span>{colorCodeHsk ? 'Color Code' : 'Monochrome'}</span>
          </button>
        </div>
      </div>
      
      {/* Interactive Reader Block */}
      <div className="flex flex-wrap gap-y-10 gap-x-3 leading-[2.6] text-2xl sm:text-3xl tracking-wide select-none p-5 sm:p-8 rounded-2xl bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-xs">
        {story.tokens.map((token, index) => {
          const isKnown = knownWords.includes(token.text);

          if (!token.isWord) {
            return (
              <span key={index} className="text-slate-400 dark:text-neutral-500 self-end mb-1 font-medium">
                {token.text}
              </span>
            );
          }

          return (
            <span
              key={index}
              onClick={() => setActiveToken(token)}
              onDoubleClick={(e) => {
                e.stopPropagation();
                toggleWordKnown(token.text);
              }}
              className={`group relative inline-flex flex-col items-center cursor-pointer rounded-lg px-2 pb-0.5 transition-all duration-150 ${
                colorCodeHsk
                  ? getHskColorClass(token.hsk, isKnown)
                  : isKnown
                    ? 'hover:bg-amber-100/60 dark:hover:bg-neutral-800 text-slate-400 dark:text-neutral-500 line-through decoration-slate-300/40'
                    : 'hover:bg-amber-100/60 dark:hover:bg-neutral-800 text-slate-800 dark:text-slate-200 border-b border-dashed border-slate-300 dark:border-neutral-700'
              }`}
            >
              {showPinyin && token.pinyin && (
                <span className="text-[11px] text-slate-500 dark:text-neutral-400 font-medium block select-none h-4 mb-1">
                  {convertTonality(token.pinyin)}
                </span>
              )}
              
              <span className="font-semibold tracking-wider relative">
                {token.text}
                
                {/* Color-code target tier superscript marker */}
                {colorCodeHsk && token.hsk && (
                  <span className="absolute -top-1.5 -right-2 text-[8px] leading-none font-extrabold opacity-60 bg-white/90 dark:bg-neutral-800/90 px-0.5 rounded border border-current scale-75 select-none z-10">
                    {token.hsk === 7 ? '7+' : token.hsk}
                  </span>
                )}
              </span>
            </span>
          );
        })}
      </div>

      <details className="p-4 bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 rounded-xl text-slate-700 dark:text-slate-300 shadow-2xs group">
        <summary className="cursor-pointer text-sm font-bold select-none flex items-center justify-between">
          <span>View Story English Translation</span>
          <svg className="w-4 h-4 text-slate-400 transition-transform duration-200 group-open:rotate-180" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
          </svg>
        </summary>
        <p className="mt-3 text-base leading-relaxed text-slate-600 dark:text-neutral-400 italic bg-slate-50 dark:bg-neutral-900/50 p-3.5 rounded-lg border border-slate-100 dark:border-neutral-800">
          &ldquo;{story.translation}&rdquo;
        </p>
      </details>

      {/* Comprehension Quiz section */}
      {story.comprehensionQuestions && story.comprehensionQuestions.length > 0 && (
        <section className="mt-8 border-t border-slate-200 dark:border-neutral-800 pt-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Comprehension Check</span>
              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 px-2.5 py-0.5 rounded-full font-bold">
                3 Challenges
              </span>
            </h3>
            {isStoryCompleted && (
              <span className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-full font-extrabold flex items-center gap-1 animate-fadeIn">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                <span>Story Completed</span>
              </span>
            )}
          </div>

          <div className="space-y-6">
            {story.comprehensionQuestions.map((q, qIndex) => {
              const selectedIdx = quizAnswers[qIndex];
              const isAnswered = selectedIdx !== undefined;

              return (
                <div key={qIndex} className="p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs space-y-4">
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-base leading-relaxed">
                    <span className="text-blue-600 dark:text-blue-400 mr-1.5 font-black">{qIndex + 1}.</span> {q.question}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options.map((option, optIndex) => {
                      const isCorrect = optIndex === q.answerIndex;
                      const isSelected = selectedIdx === optIndex;
                      
                      let btnStyle = "bg-slate-50 dark:bg-neutral-800 border-slate-200 dark:border-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700/80 text-slate-700 dark:text-slate-300";
                      
                      if (quizSubmitted) {
                        if (isCorrect) {
                          btnStyle = "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-500 text-emerald-800 dark:text-emerald-200 font-bold";
                        } else if (isSelected) {
                          btnStyle = "bg-rose-50 dark:bg-rose-950/20 border-rose-500 text-rose-800 dark:text-rose-200 font-bold";
                        } else {
                          btnStyle = "bg-slate-50 dark:bg-neutral-800/40 border-slate-100 dark:border-neutral-800/40 opacity-40 text-slate-400 dark:text-neutral-500";
                        }
                      } else {
                        if (isSelected) {
                          btnStyle = "bg-blue-50 dark:bg-blue-950/30 border-blue-600 text-blue-900 dark:text-blue-100 font-bold ring-2 ring-blue-500/20";
                        }
                      }

                      return (
                        <button
                          key={optIndex}
                          disabled={quizSubmitted}
                          onClick={() => {
                            setQuizAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
                          }}
                          className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition-all duration-150 flex items-center gap-3 cursor-pointer ${btnStyle}`}
                        >
                          <span className="font-black text-xs bg-slate-200/60 dark:bg-neutral-700/60 px-2 py-0.5 rounded text-slate-600 dark:text-neutral-400">
                            {String.fromCharCode(65 + optIndex)}
                          </span>
                          <span>{option}</span>
                        </button>
                      );
                    })}
                  </div>

                  {quizSubmitted && (
                    <div className="mt-2 p-4 bg-blue-50/50 dark:bg-blue-950/15 border-l-4 border-blue-500 text-xs sm:text-sm text-slate-600 dark:text-neutral-400 leading-relaxed rounded-r-xl animate-fadeIn">
                      <span className="font-bold text-blue-800 dark:text-blue-300">Explanation:</span> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="pt-2">
            {!quizSubmitted ? (
              <button
                onClick={() => {
                  if (Object.keys(quizAnswers).length < story.comprehensionQuestions!.length) {
                    alert('Please complete all questions before submitting.');
                    return;
                  }
                  
                  const allCorrect = story.comprehensionQuestions?.every((q, qIndex) => quizAnswers[qIndex] === q.answerIndex);
                  setQuizSubmitted(true);
                  if (allCorrect) {
                    setIsStoryCompleted(true);
                    onCompleteStory?.(story.storyId);
                  }
                }}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition duration-150 text-sm shadow-md shadow-blue-500/15 cursor-pointer flex items-center justify-center gap-1.5"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Submit Answers & Finish Story</span>
              </button>
            ) : (
              story.comprehensionQuestions?.every((q, qIndex) => quizAnswers[qIndex] === q.answerIndex) ? (
                <div className="w-full text-center py-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-xl font-extrabold text-sm flex items-center justify-center gap-1.5 animate-fadeIn">
                  <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>Excellent! Challenge finished. Click &quot;New Story&quot; above to keep learning.</span>
                </div>
              ) : (
                <div className="space-y-3 animate-fadeIn">
                  <div className="w-full text-center py-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300 rounded-xl font-bold text-sm">
                    Some answers were incorrect. Review the explanations below and try again!
                  </div>
                  <button
                    onClick={() => {
                      setQuizSubmitted(false);
                      setIsStoryCompleted(false);
                    }}
                    className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-xl transition duration-150 text-sm shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    <span>Retry Quiz</span>
                  </button>
                </div>
              )
            )}
          </div>
        </section>
      )}
    </main>
  );
}