'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Token, ComprehensionQuestion } from '@/lib/types';
import { useUserProgress } from '@/context/UserProgressContext';

export default function HomeReaderPage() {
  const router = useRouter();
  const {
    userId,
    targetHskLevel,
    addKnownWord,
    updateTargetHskLevel,
    loading: userProgressLoading,
    logout,
  } = useUserProgress();

  const [showPinyin, setShowPinyin] = useState(true);
  const [colorCodeHsk, setColorCodeHsk] = useState(false);
  const [activeToken, setActiveToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState<{
    title: string;
    translation: string;
    tokens: Token[];
    comprehensionQuestions?: ComprehensionQuestion[];
  } | null>(null);

  // Speech and Quiz tracking states
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isStoryCompleted, setIsStoryCompleted] = useState(false);

  // Client-side route guard: redirect if loading is finished and no user exists
  useEffect(() => {
    if (!userProgressLoading && !userId) {
      router.push('/login');
    }
  }, [userId, userProgressLoading, router]);

  // Clean up native speech synthesis on unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
    };
  }, []);

  const fetchNewStory = async () => {
    if (!userId) return;
    setLoading(true);
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();
    setIsSpeaking(false);

    // Reset quiz states
    setQuizAnswers({});
    setQuizSubmitted(false);
    setIsStoryCompleted(false);

    try {
      const res = await fetch('/api/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          targetHskLevel,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStory(data);
      } else {
        alert(data.error || 'Failed to generate story.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSpeak = () => {
    if (!story) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToSpeak = story.tokens.map(t => t.text).join('');
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'zh-CN';
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const markWordAsKnown = async (word: string) => {
    await addKnownWord(word);
    setActiveToken(null);
  };

  const getHskColorClass = (hsk: number | null | undefined) => {
    if (!hsk) return 'hover:bg-gray-100 dark:hover:bg-neutral-800 text-gray-800 dark:text-gray-200';
    switch (hsk) {
      case 1:
        return 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 border-b-2 border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/40';
      case 2:
        return 'bg-sky-50 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200 border-b-2 border-sky-300 dark:border-sky-800 hover:bg-sky-100 dark:hover:bg-sky-900/40';
      case 3:
        return 'bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 border-b-2 border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/40';
      default:
        return 'bg-purple-50 dark:bg-purple-950/30 text-purple-900 dark:text-purple-200 border-b-2 border-purple-300 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/40';
    }
  };

  if (userProgressLoading || !userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-500 mt-4 text-sm font-medium">Loading user profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6 min-h-screen flex flex-col justify-between">
      <div>
        <header className="flex justify-between items-center mb-6 border-b pb-4">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            Zimu <span className="text-gray-400 font-normal">字幕</span>
          </h1>
          <div className="flex gap-2 sm:gap-4 items-center">
            <div className="flex items-center gap-1.5">
              <label htmlFor="hsk-select" className="text-xs sm:text-sm font-medium text-gray-700">Target:</label>
              <select
                id="hsk-select"
                value={targetHskLevel}
                onChange={(e) => updateTargetHskLevel(Number(e.target.value))}
                className="px-1.5 py-1 text-xs sm:text-sm bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-md transition cursor-pointer font-medium text-gray-900"
              >
                <option value={1}>HSK 1</option>
                <option value={2}>HSK 2</option>
                <option value={3}>HSK 3</option>
              </select>
            </div>
            <button
              onClick={fetchNewStory}
              disabled={loading}
              className="px-3 py-1 text-xs sm:text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition font-medium cursor-pointer"
            >
              {loading ? 'Generating...' : 'Next Story'}
            </button>
            <button
              onClick={logout}
              className="px-2.5 py-1 text-xs sm:text-sm bg-red-50 hover:bg-red-100 text-red-600 rounded-md transition font-medium cursor-pointer"
            >
              Logout
            </button>
          </div>
        </header>

        {story ? (
          <main className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gray-100 pb-3">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">{story.title}</h2>
              
              {/* Reading Experience Toolbar */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setShowPinyin(!showPinyin)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                    showPinyin
                      ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900'
                      : 'bg-white border-gray-200 text-gray-700 dark:bg-neutral-800 dark:text-gray-300 dark:border-neutral-700'
                  }`}
                >
                  {showPinyin ? 'Pinyin On' : 'Pinyin Off'}
                </button>
                <button
                  onClick={() => setColorCodeHsk(!colorCodeHsk)}
                  className={`px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                    colorCodeHsk
                      ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900'
                      : 'bg-white border-gray-200 text-gray-700 dark:bg-neutral-800 dark:text-gray-300 dark:border-neutral-700'
                  }`}
                >
                  {colorCodeHsk ? 'Color Code On' : 'Color Code Off'}
                </button>
                <button
                  onClick={handleSpeak}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold cursor-pointer transition ${
                    isSpeaking
                      ? 'bg-red-50 border-red-200 text-red-700 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900 animate-pulse'
                      : 'bg-green-50 border-green-200 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                  }`}
                >
                  <span>{isSpeaking ? '⏹ Stop' : '🔊 Listen'}</span>
                </button>
              </div>
            </div>
            
            {/* Main Interactive Reader Block with comfortable character layout */}
            <div className="flex flex-wrap gap-y-7 gap-x-2 leading-[2.5] text-2xl sm:text-3xl tracking-wide select-none p-5 sm:p-7 rounded-2xl bg-gray-50 dark:bg-neutral-900 border border-gray-100 dark:border-neutral-800/80 shadow-inner">
              {story.tokens.map((token, index) => {
                if (!token.isWord) {
                  return (
                    <span key={index} className="text-gray-400 dark:text-gray-500 self-end mb-1">
                      {token.text}
                    </span>
                  );
                }

                return (
                  <span
                    key={index}
                    onClick={() => setActiveToken(token)}
                    className={`group relative inline-flex flex-col items-center cursor-pointer rounded px-1.5 pb-0.5 transition duration-150 ${
                      colorCodeHsk
                        ? getHskColorClass(token.hsk)
                        : 'hover:bg-yellow-100 dark:hover:bg-neutral-800 text-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {showPinyin && token.pinyin && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 font-light block select-none h-4 mb-0.5">
                        {token.pinyin.replace(/[0-9]/g, '')}
                      </span>
                    )}
                    <span className="font-semibold">{token.text}</span>
                  </span>
                );
              })}
            </div>

            <details className="p-4 bg-gray-50 dark:bg-neutral-900/40 border border-gray-100 dark:border-neutral-800 rounded-xl text-gray-700 dark:text-gray-300">
              <summary className="cursor-pointer text-sm font-semibold select-none">
                Show Story Translation
              </summary>
              <p className="mt-2 text-base leading-relaxed italic">{story.translation}</p>
            </details>

            {/* Comprehension Quiz block */}
            {story.comprehensionQuestions && story.comprehensionQuestions.length > 0 && (
              <section className="mt-8 border-t pt-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-extrabold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <span>Comprehension Check</span>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 px-2 py-0.5 rounded-full font-medium">3 Qs</span>
                  </h3>
                  {isStoryCompleted && (
                    <span className="text-xs bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-300 px-2.5 py-0.5 rounded-full font-bold">
                      ✓ Story Completed
                    </span>
                  )}
                </div>

                <div className="space-y-6">
                  {story.comprehensionQuestions.map((q, qIndex) => {
                    const selectedIdx = quizAnswers[qIndex];
                    const isAnswered = selectedIdx !== undefined;

                    return (
                      <div key={qIndex} className="p-4 sm:p-5 rounded-2xl border border-gray-100 dark:border-neutral-800 bg-gray-50/50 dark:bg-neutral-900/20 space-y-3">
                        <p className="font-bold text-gray-800 dark:text-gray-200">
                          {qIndex + 1}. {q.question}
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options.map((option, optIndex) => {
                            const isCorrect = optIndex === q.answerIndex;
                            const isSelected = selectedIdx === optIndex;
                            
                            let btnStyle = "bg-white dark:bg-neutral-800 border-gray-200 dark:border-neutral-700 hover:bg-gray-100 dark:hover:bg-neutral-700 text-gray-700 dark:text-gray-300";
                            
                            if (quizSubmitted) {
                              if (isCorrect) {
                                btnStyle = "bg-green-50 dark:bg-green-950/30 border-green-500 text-green-800 dark:text-green-200 font-semibold";
                              } else if (isSelected) {
                                btnStyle = "bg-red-50 dark:bg-red-950/30 border-red-500 text-red-800 dark:text-red-200";
                              } else {
                                btnStyle = "bg-white dark:bg-neutral-800 border-gray-100 dark:border-neutral-800 opacity-50 text-gray-400 dark:text-gray-500";
                              }
                            } else {
                              if (isSelected) {
                                btnStyle = "bg-blue-50 dark:bg-blue-950/40 border-blue-600 text-blue-950 dark:text-blue-100 font-bold";
                              }
                            }

                            return (
                              <button
                                key={optIndex}
                                disabled={quizSubmitted}
                                onClick={() => {
                                  setQuizAnswers(prev => ({ ...prev, [qIndex]: optIndex }));
                                }}
                                className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-all flex items-center gap-2 cursor-pointer ${btnStyle}`}
                              >
                                <span className="font-extrabold text-xs bg-gray-100 dark:bg-neutral-700 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-400">
                                  {String.fromCharCode(65 + optIndex)}
                                </span>
                                <span>{option}</span>
                              </button>
                            );
                          })}
                        </div>

                        {quizSubmitted && (
                          <div className="mt-2 p-3 bg-blue-50/50 dark:bg-blue-950/10 border-l-2 border-blue-500 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
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
                          alert('Please answer all 3 questions first!');
                          return;
                        }
                        setQuizSubmitted(true);
                        setIsStoryCompleted(true);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-xl transition cursor-pointer text-sm shadow-md shadow-blue-500/10"
                    >
                      Submit Answers & Complete Story
                    </button>
                  ) : (
                    <div className="w-full text-center py-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 text-green-800 dark:text-green-300 rounded-xl font-extrabold text-sm">
                      🎉 Challenge completed! Tap &quot;Next Story&quot; to continue reading.
                    </div>
                  )}
                </div>
              </section>
            )}
          </main>
        ) : (
          <div className="text-center py-20 border-2 border-dashed rounded-xl bg-gray-50">
            <p className="text-gray-500 mb-4">Click below to generate your first custom story based on your vocabulary level.</p>
            <button
              onClick={fetchNewStory}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition cursor-pointer"
            >
              {loading ? 'Generating your story...' : 'Generate First Story'}
            </button>
          </div>
        )}
      </div>

      {activeToken && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-lg bg-white border border-gray-200 shadow-2xl p-6 rounded-2xl">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">{activeToken.text}</h3>
              <p className="text-gray-500 italic mt-0.5">{activeToken.pinyin || 'No pinyin'}</p>
            </div>
            <button
              onClick={() => setActiveToken(null)}
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold cursor-pointer"
            >
              &times;
            </button>
          </div>

          <p className="text-gray-700 text-base mb-4 leading-relaxed">
            {activeToken.definition || 'Definition not available.'}
          </p>

          <div className="flex gap-3 mt-4">
            <button
              onClick={() => markWordAsKnown(activeToken.text)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 px-4 rounded-xl transition cursor-pointer"
            >
              I know this word
            </button>
            {activeToken.hsk && (
              <span className="px-3 py-2 bg-yellow-50 text-yellow-800 rounded-xl text-xs font-semibold flex items-center justify-center border border-yellow-200">
                HSK {activeToken.hsk}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}