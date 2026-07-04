'use client';

import { useState } from 'react';
import { Token } from '@/lib/types';
import { useUserProgress } from '@/context/UserProgressContext';

export default function HomeReaderPage() {
  const {
    userId,
    targetHskLevel,
    addKnownWord,
    updateTargetHskLevel,
    loading: userProgressLoading,
  } = useUserProgress();

  const [showPinyin, setShowPinyin] = useState(true);
  const [activeToken, setActiveToken] = useState<Token | null>(null);
  const [loading, setLoading] = useState(false);
  const [story, setStory] = useState<{
    title: string;
    translation: string;
    tokens: Token[];
  } | null>(null);

  const fetchNewStory = async () => {
    setLoading(true);
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

  const markWordAsKnown = async (word: string) => {
    await addKnownWord(word);
    setActiveToken(null);
  };

  if (userProgressLoading) {
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
    <div className="max-w-2xl mx-auto p-6 min-h-screen flex flex-col justify-between">
      <div>
        <header className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            Zimu <span className="text-gray-400 font-normal">字幕</span>
          </h1>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <label htmlFor="hsk-select" className="text-sm font-medium text-gray-700">Target Level:</label>
              <select
                id="hsk-select"
                value={targetHskLevel}
                onChange={(e) => updateTargetHskLevel(Number(e.target.value))}
                className="px-2 py-1 text-sm bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-md transition cursor-pointer font-medium"
              >
                <option value={1}>HSK 1</option>
                <option value={2}>HSK 2</option>
                <option value={3}>HSK 3</option>
              </select>
            </div>
            <button
              onClick={() => setShowPinyin(!showPinyin)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition font-medium"
            >
              {showPinyin ? 'Hide Pinyin' : 'Show Pinyin'}
            </button>
            <button
              onClick={fetchNewStory}
              disabled={loading}
              className="px-4 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition font-medium"
            >
              {loading ? 'Generating...' : 'Next Story'}
            </button>
          </div>
        </header>

        {story ? (
          <main className="space-y-6">
            <h2 className="text-xl font-bold">{story.title}</h2>
            
            <div className="flex flex-wrap gap-y-5 gap-x-1 leading-loose text-3xl tracking-wide select-none p-4 rounded-xl bg-gray-50 border border-gray-100">
              {story.tokens.map((token, index) => {
                if (!token.isWord) {
                  return (
                    <span key={index} className="text-gray-400 self-end">
                      {token.text}
                    </span>
                  );
                }

                return (
                  <span
                    key={index}
                    onClick={() => setActiveToken(token)}
                    className="group relative inline-flex flex-col items-center cursor-pointer hover:bg-yellow-100 rounded px-1 transition duration-150"
                  >
                    {showPinyin && token.pinyin && (
                      <span className="text-xs text-gray-500 font-light block select-none h-4">
                        {token.pinyin.replace(/[0-9]/g, '')}
                      </span>
                    )}
                    <span className="text-gray-800">{token.text}</span>
                  </span>
                );
              })}
            </div>

            <details className="mt-4 p-4 bg-gray-50 border border-gray-100 rounded-lg text-gray-700">
              <summary className="cursor-pointer text-sm font-semibold select-none">
                Show Story Translation
              </summary>
              <p className="mt-2 text-base leading-relaxed italic">{story.translation}</p>
            </details>
          </main>
        ) : (
          <div className="text-center py-20 border-2 border-dashed rounded-xl bg-gray-50">
            <p className="text-gray-500 mb-4">Click below to generate your first custom story based on your vocabulary level.</p>
            <button
              onClick={fetchNewStory}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
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
              className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
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
              className="flex-1 bg-green-600 hover:bg-green-700 text-white text-sm font-semibold py-2 px-4 rounded-xl transition"
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