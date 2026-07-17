import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Token, ComprehensionQuestion } from '@/lib/types';
import { useUserProgress } from '@/context/UserProgressContext';

export function useHomeReader() {
  const router = useRouter();
  const {
    userId,
    knownWords,
    targetHskLevel,
    addKnownWord,
    removeKnownWord,
    updateTargetHskLevel,
    flashcardProgress,
    saveFlashcardProgress,
    loading: userProgressLoading,
    logout,
    geminiApiKey,
    updateGeminiApiKey,
    storyHistory,
    setStoryHistory,
    completeStory,
    nickname,
    updateNickname,
    resetFlashcards,
    resetKnownWords,
    deleteAccount,
    importBackup,
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
    targetLevel?: number;
    tokens: Token[];
    comprehensionQuestions?: ComprehensionQuestion[];
  } | null>(null);

  const [viewMode, setViewMode] = useState<'stories' | 'flashcards'>('stories');

  // Flashcards state
  const [flashcardsList, setFlashcardsList] = useState<any[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState<number>(0);
  const [showBack, setShowBack] = useState<boolean>(false);
  const [flashcardsLoading, setFlashcardsLoading] = useState<boolean>(false);
  const [sessionLimit, setSessionLimit] = useState<number>(15);
  const [sessionComplete, setSessionComplete] = useState<boolean>(false);

  // Story History local state tracking
  const [currentStoryIndex, setCurrentStoryIndex] = useState<number>(-1);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [openLevels, setOpenLevels] = useState<Record<number, boolean>>({});

  // Quiz tracking states
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [isStoryCompleted, setIsStoryCompleted] = useState(false);

  // Gemini Onboarding, API Key, and Settings Modal States
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [apiKeySetupSkipped, setApiKeySetupSkipped] = useState(false);
  const [showTipsModal, setShowTipsModal] = useState(false);

  // Intercept new entries & trigger onboarding if API key is missing (ensuring userProgressLoading is false first)
  useEffect(() => {
    if (!userProgressLoading && userId && geminiApiKey === null && !apiKeySetupSkipped && viewMode === 'stories') {
      setShowApiKeyModal(true);
    }
  }, [userId, geminiApiKey, apiKeySetupSkipped, viewMode, userProgressLoading]);

  // Set active story when storyHistory becomes available
  useEffect(() => {
    if (storyHistory && storyHistory.length > 0 && !story) {
      setStory(storyHistory[0]);
      setCurrentStoryIndex(0);
    }
  }, [storyHistory, story]);

  // Sync reading history changes with localStorage
  useEffect(() => {
    if (userId && storyHistory.length > 0) {
      localStorage.setItem(`zimu_history_${userId}`, JSON.stringify(storyHistory));
    }
  }, [storyHistory, userId]);

  const fetchNewStory = async () => {
    if (!userId) return;

    // Block client request early and show dialog if no API key is available
    if (!geminiApiKey) {
      setShowApiKeyModal(true);
      return;
    }

    const displayLevelText = targetHskLevel === 7 ? '7-9' : String(targetHskLevel);
    const proceed = window.confirm(`Generating this story at HSK ${displayLevelText} — proceed?`);
    if (!proceed) return;

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
        if (data.code === 'INVALID_API_KEY' || data.code === 'MISSING_API_KEY') {
          alert(data.error);
          setShowApiKeyModal(true);
        } else {
          alert(data.error || 'Failed to generate story.');
        }
      }
    } catch (err: any) {
      console.error(err);
      alert(`Network error or failure during story generation: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const startFlashcardSession = async (limitNum: number = 15) => {
    setFlashcardsLoading(true);
    setSessionComplete(false);
    setCurrentCardIndex(0);
    setShowBack(false);

    try {
      const trackedWords = Object.entries(flashcardProgress).map(([word, value]) => ({
        word,
        interval: value.interval,
        repetition: value.repetition,
        efactor: value.efactor,
        dueDate: value.dueDate,
      }));

      const res = await fetch('/api/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          targetHskLevel,
          knownWords,
          trackedWords,
          limit: limitNum,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFlashcardsList(data.cards || []);
      } else {
        alert(data.error || 'Failed to assemble flashcards.');
      }
    } catch (err: any) {
      console.error(err);
      alert(`Failed to load flashcards: ${err.message || err}`);
    } finally {
      setFlashcardsLoading(false);
    }
  };

  const handleRateCard = async (quality: number) => {
    if (!flashcardsList || flashcardsList.length === 0) return;
    const currentCard = flashcardsList[currentCardIndex];

    const prevProgress = currentCard.progress || {
      interval: 0,
      repetition: 0,
      efactor: 2.5,
    };

    let interval = 1;
    let repetition = 0;
    let efactor = prevProgress.efactor;

    if (quality >= 3) {
      // Correct Recall
      if (prevProgress.repetition === 0) {
        interval = 1;
      } else if (prevProgress.repetition === 1) {
        interval = 6;
      } else {
        interval = Math.round(prevProgress.interval * prevProgress.efactor);
      }
      repetition = prevProgress.repetition + 1;
    } else {
      // Incorrect Recall
      repetition = 0;
      interval = 1;
    }

    // Apply standard SM-2 ease factor formula updates
    efactor = efactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    if (efactor < 1.3) {
      efactor = 1.3;
    }

    // Apply custom modifiers for Hard / Easy recalls
    if (quality === 3) { // Hard
      if (prevProgress.repetition > 1) {
        interval = Math.round(prevProgress.interval * 1.2);
      }
    } else if (quality === 5) { // Easy
      if (prevProgress.repetition > 1) {
        interval = Math.round(prevProgress.interval * prevProgress.efactor * 1.3);
      }
    }

    if (interval < 1) {
      interval = 1;
    }

    const dueDate = new Date(Date.now() + interval * 24 * 60 * 60 * 1000).toISOString();

    await saveFlashcardProgress(currentCard.word, interval, repetition, efactor, dueDate);

    if (currentCardIndex + 1 < flashcardsList.length) {
      setShowBack(false);
      setCurrentCardIndex(prev => prev + 1);
    } else {
      setSessionComplete(true);
      setFlashcardsList([]);
    }
  };

  const selectStoryFromHistory = (index: number) => {
    const selected = storyHistory[index];
    if (!selected) return;

    setQuizAnswers({});
    setQuizSubmitted(selected.completed ? true : false);
    setIsStoryCompleted(selected.completed ? true : false);

    // If already completed, pre-select the correct answers for review
    if (selected.completed && selected.comprehensionQuestions) {
      const correctAnswers: Record<number, number> = {};
      selected.comprehensionQuestions.forEach((q: any, i: number) => {
        correctAnswers[i] = q.answerIndex;
      });
      setQuizAnswers(correctAnswers);
    }

    setStory(selected);
    setCurrentStoryIndex(index);
    setIsHistoryOpen(false);
    setViewMode('stories');
  };

  const toggleLevel = (level: number) => {
    setOpenLevels(prev => ({ ...prev, [level]: prev[level] === false ? true : false }));
  };

  const toggleWordKnown = async (word: string) => {
    if (knownWords.includes(word)) {
      await removeKnownWord(word);
    } else {
      await addKnownWord(word);
    }
  };

  return {
    userId,
    knownWords,
    targetHskLevel,
    userProgressLoading,
    logout,
    addKnownWord,
    removeKnownWord,
    updateTargetHskLevel,
    flashcardProgress,
    saveFlashcardProgress,
    geminiApiKey,
    updateGeminiApiKey,
    completeStory,
    nickname,
    updateNickname,
    resetFlashcards,
    resetKnownWords,
    deleteAccount,
    importBackup,

    showPinyin,
    setShowPinyin,
    colorCodeHsk,
    setColorCodeHsk,
    activeToken,
    setActiveToken,
    loading,
    setLoading,
    storyLength,
    setStoryLength,
    story,
    setStory,
    viewMode,
    setViewMode,

    flashcardsList,
    setFlashcardsList,
    currentCardIndex,
    setCurrentCardIndex,
    showBack,
    setShowBack,
    flashcardsLoading,
    setFlashcardsLoading,
    sessionLimit,
    setSessionLimit,
    sessionComplete,
    setSessionComplete,

    storyHistory,
    setStoryHistory,
    currentStoryIndex,
    setCurrentStoryIndex,
    isHistoryOpen,
    setIsHistoryOpen,
    openLevels,
    setOpenLevels,

    quizAnswers,
    setQuizAnswers,
    quizSubmitted,
    setQuizSubmitted,
    isStoryCompleted,
    setIsStoryCompleted,

    showApiKeyModal,
    setShowApiKeyModal,
    showSettingsModal,
    setShowSettingsModal,
    apiKeySetupSkipped,
    setApiKeySetupSkipped,
    showTipsModal,
    setShowTipsModal,

    fetchNewStory,
    startFlashcardSession,
    handleRateCard,
    selectStoryFromHistory,
    toggleLevel,
    toggleWordKnown,
  };
}