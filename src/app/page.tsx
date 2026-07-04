'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Token, ComprehensionQuestion } from '@/lib/types';
import { useUserProgress } from '@/context/UserProgressContext';

export default function HomeReaderPage() {
  const router = useRouter();
  const {
    userId,
    knownWords,
    targetHskLevel,
    addKnownWord,
    removeKnownWord,
    updateTargetHskLevel,
    loading: userProgressLoading,
    logout,
  } = useUserProgress();

  const [showPinyin, setShowPinyin] = useState(true);
  const [colorCodeHsk, setColorCodeHsk] = useState(true);
  const [activeToken, setActiveToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(false);
  const [storyLength, setStoryLength] = useState<'short' | 'medium' | 'long'>('short');
  
  const [story, setStory] = useState<{
    storyId: string;
    title: string;
    translation: string;
    tokens: Token[];
    comprehensionQuestions?: ComprehensionQuestion[];
  } | null>(null);

  // Story History states
  const [storyHistory, setStoryHistory] = useState<any[]>([]);
  const [currentStoryIndex, setCurrentStoryIndex] = useState<number>(-1);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Quiz tracking states
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isStoryCompleted, setIsStoryCompleted] = useState(false);

  // Client-side route guard: redirect if loading is finished and no user exists
  useEffect(() => {
    if (!userProgressLoading && !userId) {
      router.push('/login');
    }
  }, [userId, userProgressLoading, router]);

  // Load reading history from localStorage scoped to user ID on mount
  useEffect(() => {
    if (userId) {
      const stored = localStorage.getItem(`zimu_history_${userId}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setStoryHistory(parsed);
            setStory(parsed[0]);
            setCurrentStoryIndex(0);
          }
        } catch (e) {
          console.error('Failed to load story history:', e);
        }
      }
    }
  }, [userId]);

  // Sync reading history changes with localStorage
  useEffect(() => {
    if (userId && storyHistory.length > 0) {
      localStorage.setItem(`zimu_history_${userId}`, JSON.stringify(storyHistory));
    }
  }, [storyHistory, userId]);

  const fetchNewStory = async () => {
    if (!userId) return;
    setLoading(true);

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
          storyLength,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStory(data);
        
        // Append to reading history
        setStoryHistory(prev => {
          const alreadyExists = prev.some(item => item.storyId === data.storyId);
          if (alreadyExists) return prev;
          return [data, ...prev];
        });
        setCurrentStoryIndex(0);
      } else {
        alert(data.error || 'Failed to generate story.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectStoryFromHistory = (index: number) => {
    const selected = storyHistory[index];
    if (!selected) return;

    setQuizAnswers({});
    setQuizSubmitted(false);
    setIsStoryCompleted(false);

    setStory(selected);
    setCurrentStoryIndex(index);
    setIsHistoryOpen(false); // Auto close sidebar drawer on mobile
  };

  // Toggle words quickly with visual cues and tactile feedback
  const toggleWordKnown = async (word: string) => {
    if (knownWords.includes(word)) {
      await removeKnownWord(word);
    } else {
      await addKnownWord(word);
    }
  };

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
      default: // HSK 7-9 (represented by level 7)
        return 'bg-fuchsia-50 dark:bg-fuchsia-950/20 text-fuchsia-800 dark:text-fuchsia-300 border-fuchsia-200 dark:border-fuchsia-900/60';
    }
  };

  const getHskColorClass = (hsk: number | null | undefined, isKnown: boolean) => {
    if (!hsk) return 'hover:bg-slate-100 dark:hover:bg-neutral-800 text-slate-800 dark:text-slate-200';
    
    // Style marked words to fade into standard reading states
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
      default: // HSK 7-9 (represented by targetHskLevel 7)
        return `${opacityStyle} bg-fuchsia-50/50 dark:bg-fuchsia-950/10 text-fuchsia-800/90 dark:text-fuchsia-300/90 border-fuchsia-300 dark:border-fuchsia-800 hover:bg-fuchsia-100/70 dark:hover:bg-fuchsia-900/30`;
    }
  };

  if (userProgressLoading || !userId) {
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
      {isHistoryOpen && (
        <div 
          className="fixed inset-0 bg-neutral-900/40 z-40 md:hidden backdrop-blur-xs"
          onClick={() => setIsHistoryOpen(false)}
        />
      )}

      {/* History Sidebar Panel */}
      <aside className={`fixed inset-y-0 left-0 w-72 bg-white dark:bg-neutral-900 border-r border-slate-200 dark:border-neutral-800 z-50 transform transition-transform duration-300 md:relative md:transform-none md:z-0 flex flex-col ${
        isHistoryOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        <div className="p-4 border-b border-slate-100 dark:border-neutral-800 flex justify-between items-center bg-slate-50/50 dark:bg-neutral-900/50">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <span>Story History</span>
          </h3>
          <button 
            onClick={() => setIsHistoryOpen(false)}
            className="md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {storyHistory.length === 0 ? (
            <div className="text-center py-8 px-4">
              <p className="text-xs text-slate-400 dark:text-neutral-500">No previously generated stories. Your history will be recorded as you read.</p>
            </div>
          ) : (
            storyHistory.map((histStory, idx) => {
              const isActive = story?.storyId === histStory.storyId;
              return (
                <button
                  key={histStory.storyId}
                  onClick={() => selectStoryFromHistory(idx)}
                  className={`w-full text-left p-3 rounded-xl transition duration-150 border flex flex-col gap-2 cursor-pointer ${
                    isActive
                      ? 'bg-blue-50/80 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200'
                      : 'bg-white dark:bg-neutral-800 border-slate-100 dark:border-neutral-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-800/60'
                  }`}
                >
                  <span className="font-bold text-sm line-clamp-1">{histStory.title}</span>
                  <div className="flex items-center justify-between w-full text-[10px] font-semibold">
                    <span className={`px-2 py-0.5 rounded-full border font-bold ${getHskBadgeColors(histStory.targetLevel)}`}>
                      HSK {histStory.targetLevel === 7 ? '7-9' : histStory.targetLevel}
                    </span>
                    <span className="text-slate-400 dark:text-neutral-500">{histStory.tokens?.length || 0} words</span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-4xl mx-auto w-full p-4 sm:p-6 lg:p-8">
        
        {/* Navigation & Toolbar Header */}
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
              <div className="relative group min-w-[140px]">
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

          {/* Target Story Length Slider / Selection Toolbar */}
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
        </header>

        {story ? (
          <main className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-neutral-800 pb-3">
              <div>
                <span className="text-[10px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase">
                  HSK {story.comprehensionQuestions ? (storyHistory[currentStoryIndex]?.targetLevel === 7 ? '7-9' : storyHistory[currentStoryIndex]?.targetLevel) : 'custom'} Reader
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

            <div className="text-xs bg-blue-50/50 dark:bg-blue-950/10 text-slate-500 dark:text-neutral-400 p-3 rounded-lg border border-slate-100 dark:border-neutral-800 text-center select-none font-medium">
              💡 <span className="font-semibold text-slate-700 dark:text-slate-300">Quick tip:</span> Double-click any word to instantly toggle your known words.
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
                        {token.pinyin.replace(/[0-9]/g, '')}
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
                    <span className="text-xs bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-full font-extrabold flex items-center gap-1">
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
                          <div className="mt-2 p-4 bg-blue-50/50 dark:bg-blue-950/15 border-l-4 border-blue-500 text-xs sm:text-sm text-slate-600 dark:text-neutral-400 leading-relaxed rounded-r-xl">
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
                        setQuizSubmitted(true);
                        setIsStoryCompleted(true);
                      }}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl transition duration-150 text-sm shadow-md shadow-blue-500/15 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Submit Answers & Finish Story</span>
                    </button>
                  ) : (
                    <div className="w-full text-center py-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-xl font-extrabold text-sm flex items-center justify-center gap-1.5">
                      <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Excellent! Challenge finished. Click &quot;New Story&quot; above to keep learning.</span>
                    </div>
                  )}
                </div>
              </section>
            )}
          </main>
        ) : (
          <div className="text-center py-20 px-6 border-2 border-dashed border-slate-200 dark:border-neutral-800 rounded-2xl bg-white dark:bg-neutral-900/50 shadow-inner">
            <svg className="w-12 h-12 text-slate-300 dark:text-neutral-700 mx-auto mb-4" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <p className="text-slate-500 dark:text-neutral-400 mb-5 max-w-sm mx-auto text-sm leading-relaxed">
              No active story loaded. Select your target language level and generate your first custom contextual story.
            </p>
            <button
              onClick={fetchNewStory}
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 disabled:opacity-50 transition duration-150 cursor-pointer shadow-md shadow-blue-500/10"
            >
              {loading ? 'Creating custom reader...' : 'Generate First Story'}
            </button>
          </div>
        )}
      </div>

      {activeToken && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-lg bg-white dark:bg-neutral-900 border border-slate-200 dark:border-neutral-800 shadow-2xl p-6 rounded-2xl z-50">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{activeToken.text}</h3>
              <p className="text-blue-600 dark:text-blue-400 font-bold text-sm tracking-wide mt-0.5">{activeToken.pinyin || 'No pinyin'}</p>
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
      )}
    </div>
  );
}