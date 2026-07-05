import React, { useState } from 'react';
import { normalizePinyin } from '@/lib/pinyin';

interface HistorySidebarProps {
  isHistoryOpen: boolean;
  setIsHistoryOpen: (val: boolean) => void;
  storyHistory: any[];
  storyId?: string;
  selectStoryFromHistory: (idx: number) => void;
  openLevels: Record<number, boolean>;
  toggleLevel: (lvl: number) => void;
}

const getHskDotColor = (level: number) => {
  switch (level) {
    case 1: return 'bg-emerald-500';
    case 2: return 'bg-sky-500';
    case 3: return 'bg-amber-500';
    case 4: return 'bg-orange-500';
    case 5: return 'bg-rose-500';
    case 6: return 'bg-violet-500';
    case 7: return 'bg-fuchsia-500';
    default: return 'bg-slate-400 dark:bg-neutral-500';
  }
};

function storyMatchesQuery(story: any, query: string): boolean {
  if (!query) return true;
  
  const cleanQuery = query.trim().toLowerCase();
  if (cleanQuery === '') return true;

  // Detect Chinese characters
  const isChinese = /[\u4e00-\u9fa5]/.test(cleanQuery);

  if (isChinese) {
    const cleanChineseQuery = cleanQuery.replace(/\s+/g, '');
    const titleClean = (story.title || '').toLowerCase().replace(/\s+/g, '');
    const textClean = (story.tokens || [])
      .map((t: any) => t.text)
      .join('')
      .toLowerCase()
      .replace(/\s+/g, '');
      
    return titleClean.includes(cleanChineseQuery) || textClean.includes(cleanChineseQuery);
  } else {
    const normQuery = normalizePinyin(cleanQuery);
    if (!normQuery) return false;

    const normTokensPinyin = (story.tokens || [])
      .map((t: any) => t.isWord && t.pinyin ? normalizePinyin(t.pinyin) : '')
      .join('');

    const normTitle = normalizePinyin(story.title || '');
    const titleClean = (story.title || '').toLowerCase();
    const translationClean = (story.translation || '').toLowerCase();

    return titleClean.includes(cleanQuery) || 
           translationClean.includes(cleanQuery) || 
           normTitle.includes(normQuery) || 
           normTokensPinyin.includes(normQuery);
  }
}

export function HistorySidebar({
  isHistoryOpen,
  setIsHistoryOpen,
  storyHistory,
  storyId,
  selectStoryFromHistory,
  openLevels,
  toggleLevel,
}: HistorySidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredHistory = storyHistory.filter(story => storyMatchesQuery(story, searchQuery));

  // Group history by targetLevel
  const groupedHistory = filteredHistory.reduce((acc, histStory) => {
    const level = histStory.targetLevel || 0;
    if (!acc[level]) acc[level] = [];
    acc[level].push(histStory);
    return acc;
  }, {} as Record<number, any[]>);

  const sortedLevels = Object.keys(groupedHistory).map(Number).sort((a, b) => b - a);

  return (
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

      {/* Search Input Panel */}
      <div className="p-3 border-b border-slate-100 dark:border-neutral-800 bg-slate-50/20 dark:bg-neutral-900/20">
        <div className="relative">
          <input
            type="text"
            placeholder="Search stories (title, content, pinyin)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 py-2 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-800 dark:text-slate-100"
          />
          <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none">
            <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer animate-fadeIn"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {storyHistory.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-xs text-slate-400 dark:text-neutral-500">No previously generated stories. Your history will be recorded as you read.</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-xs text-slate-400 dark:text-neutral-500">No stories matching your query were found.</p>
          </div>
        ) : (
          sortedLevels.map(lvl => {
            // Auto-expand levels that contain matches when searching
            const isExpanded = searchQuery.trim() !== '' ? true : (openLevels[lvl] !== false);

            return (
              <div key={lvl} className="space-y-2">
                <button 
                  onClick={() => toggleLevel(lvl)}
                  className="w-full flex items-center justify-between text-xs font-bold text-slate-500 dark:text-neutral-400 px-1 py-1 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${getHskDotColor(lvl)}`} />
                    {lvl === 0 ? 'Custom / Legacy' : `HSK ${lvl === 7 ? '7-9' : lvl}`}
                  </span>
                  <svg 
                    className={`w-3.5 h-3.5 transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
                    fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </button>
                
                {isExpanded && (
                  <div className="space-y-2">
                    {groupedHistory[lvl].map((histStory: any) => {
                      const isActive = storyId === histStory.storyId;
                      const isCompleted = histStory.completed;

                      // Visual indicators for completed stories
                      const borderStyle = isCompleted
                        ? 'border-emerald-500/50 dark:border-emerald-500/30 shadow-xs shadow-emerald-500/10'
                        : isActive
                          ? 'border-blue-200 dark:border-blue-900'
                          : 'border-slate-100 dark:border-neutral-800';

                      const bgStyle = isActive
                        ? isCompleted
                          ? 'bg-emerald-50/40 dark:bg-emerald-950/20 text-emerald-900 dark:text-emerald-200'
                          : 'bg-blue-50/80 dark:bg-blue-950/20 text-blue-900 dark:text-blue-200'
                        : isCompleted
                          ? 'bg-emerald-50/10 dark:bg-emerald-950/5 hover:bg-emerald-50/20'
                          : 'bg-white dark:bg-neutral-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-800/60';

                      return (
                        <button
                          key={histStory.storyId}
                          onClick={() => {
                            const originalIdx = storyHistory.findIndex(s => s.storyId === histStory.storyId);
                            if (originalIdx !== -1) selectStoryFromHistory(originalIdx);
                          }}
                          className={`w-full text-left p-3 rounded-xl transition duration-150 border flex flex-col gap-2 cursor-pointer ${borderStyle} ${bgStyle}`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="font-bold text-sm line-clamp-1 flex-1">{histStory.title}</span>
                            {isCompleted && (
                              <span className="ml-1.5 text-emerald-600 dark:text-emerald-400 flex-none" title="Completed">
                                <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center justify-between w-full text-[10px] font-semibold">
                            <span className="text-slate-400 dark:text-neutral-500">{histStory.tokens?.length || 0} words</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
}