import React from 'react';

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

export function HistorySidebar({
  isHistoryOpen,
  setIsHistoryOpen,
  storyHistory,
  storyId,
  selectStoryFromHistory,
  openLevels,
  toggleLevel,
}: HistorySidebarProps) {
  // Group history by targetLevel
  const groupedHistory = storyHistory.reduce((acc, histStory) => {
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

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {storyHistory.length === 0 ? (
          <div className="text-center py-8 px-4">
            <p className="text-xs text-slate-400 dark:text-neutral-500">No previously generated stories. Your history will be recorded as you read.</p>
          </div>
        ) : (
          sortedLevels.map(lvl => (
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
                  className={`w-3.5 h-3.5 transform transition-transform ${openLevels[lvl] !== false ? 'rotate-180' : ''}`} 
                  fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>
              
              {openLevels[lvl] !== false && (
                <div className="space-y-2">
                  {groupedHistory[lvl].map((histStory) => {
                    const isActive = storyId === histStory.storyId;
                    return (
                      <button
                        key={histStory.storyId}
                        onClick={() => {
                          const originalIdx = storyHistory.findIndex(s => s.storyId === histStory.storyId);
                          if (originalIdx !== -1) selectStoryFromHistory(originalIdx);
                        }}
                        className={`w-full text-left p-3 rounded-xl transition duration-150 border flex flex-col gap-2 cursor-pointer ${
                          isActive
                            ? 'bg-blue-50/80 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-200'
                            : 'bg-white dark:bg-neutral-800 border-slate-100 dark:border-neutral-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-neutral-800/60'
                        }`}
                      >
                        <span className="font-bold text-sm line-clamp-1">{histStory.title}</span>
                        <div className="flex items-center justify-between w-full text-[10px] font-semibold">
                          <span className="text-slate-400 dark:text-neutral-500">{histStory.tokens?.length || 0} words</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </aside>
  );
}