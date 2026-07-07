'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const sandboxTokens = [
  { text: '在', pinyin: 'zài', definition: 'At; in; on; indicating action in progress', hsk: 1, isWord: true, isKnown: true },
  { text: '字幕', pinyin: 'zì mù', definition: 'Subtitles; captions; title card', hsk: 4, isWord: true, isKnown: false },
  { text: '，', isWord: false },
  { text: '您', pinyin: 'nín', definition: 'You (polite form)', hsk: 2, isWord: true, isKnown: true },
  { text: '可以', pinyin: 'kě yǐ', definition: 'Can; may; possible', hsk: 2, isWord: true, isKnown: true },
  { text: '通过', pinyin: 'tōng guò', definition: 'By means of; through; to pass', hsk: 3, isWord: true, isKnown: false },
  { text: '阅读', pinyin: 'yuè dú', definition: 'To read; reading', hsk: 4, isWord: true, isKnown: false },
  { text: '真正', pinyin: 'zhēn zhèng', definition: 'Genuine; real; truly', hsk: 3, isWord: true, isKnown: false },
  { text: '适合', pinyin: 'shì hé', definition: 'To fit; to suit', hsk: 3, isWord: true, isKnown: false },
  { text: '您', pinyin: 'nín', definition: 'You (polite form)', hsk: 2, isWord: true, isKnown: true },
  { text: '水平', pinyin: 'shuǐ píng', definition: 'Level; standard', hsk: 3, isWord: true, isKnown: false },
  { text: '的', pinyin: 'de', definition: 'Possessive or modifying particle', hsk: 1, isWord: true, isKnown: true },
  { text: '故事', pinyin: 'gù shi', definition: 'Story; tale', hsk: 3, isWord: true, isKnown: false },
  { text: '，', isWord: false },
  { text: '自然', pinyin: 'zì rán', definition: 'Natural; naturally; nature', hsk: 3, isWord: true, isKnown: false },
  { text: '而', pinyin: 'ér', definition: 'And; but; yet', hsk: 2, isWord: true, isKnown: true },
  { text: '高效', pinyin: 'gāo xiào', definition: 'Highly efficient; high efficiency', hsk: 4, isWord: true, isKnown: false },
  { text: '地', pinyin: 'de', definition: 'Adverbial particle', hsk: 1, isWord: true, isKnown: true },
  { text: '学习', pinyin: 'xué xí', definition: 'To learn; to study', hsk: 1, isWord: true, isKnown: true },
  { text: '中文', pinyin: 'zhōng wén', definition: 'Chinese language', hsk: 1, isWord: true, isKnown: true },
  { text: '。', isWord: false }
];

export function LandingPage() {
  const router = useRouter();
  const [activeToken, setActiveToken] = useState<typeof sandboxTokens[0] | null>(null);
  const [chars, setChars] = useState<Array<{
    id: number;
    char: string;
    left: number;
    top: number;
    fontSize: number;
    duration: number;
    delay: number;
  }>>([]);

  useEffect(() => {
    const pool = ['的', '一', '是', '不', '了', '人', '我', '在', '有', '他', '这', '为', '之', '大', '来', '以', '个', '中', '上', '们', '字', '幕', '语', '言', '学', '习'];
    const generated = Array.from({ length: 18 }, (_, i) => ({
      id: i,
      char: pool[Math.floor(Math.random() * pool.length)],
      left: Math.random() * 95,
      top: 102 + Math.random() * 15, // Render below the view boundaries to allow floating up
      fontSize: 28 + Math.random() * 56,
      duration: 14 + Math.random() * 14,
      delay: Math.random() * 12,
    }));
    setChars(generated);
  }, []);

  const getHskColorClass = (hsk: number | undefined, isKnown: boolean) => {
    if (!hsk) return 'text-on-surface hover:bg-white/5';
    const opacityStyle = isKnown 
      ? 'opacity-40 hover:opacity-100 transition duration-150 line-through decoration-white/20' 
      : 'border-b border-[#b4c5ff] font-bold';

    switch (hsk) {
      case 1:
        return `${opacityStyle} bg-emerald-950/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900/30`;
      case 2:
        return `${opacityStyle} bg-sky-950/20 text-sky-300 border-sky-500/50 hover:bg-sky-900/30`;
      case 3:
        return `${opacityStyle} bg-amber-950/20 text-amber-300 border-amber-500/50 hover:bg-amber-900/30`;
      case 4:
        return `${opacityStyle} bg-orange-950/20 text-orange-300 border-orange-500/50 hover:bg-orange-900/30`;
      default:
        return `${opacityStyle} bg-fuchsia-950/20 text-fuchsia-300 border-fuchsia-500/50 hover:bg-fuchsia-900/30`;
    }
  };

  const getHskBadgeColors = (level: number) => {
    switch (level) {
      case 1:
        return 'bg-emerald-950/30 text-emerald-300 border-emerald-500/30';
      case 2:
        return 'bg-sky-950/30 text-sky-300 border-sky-500/30';
      case 3:
        return 'bg-amber-950/30 text-amber-300 border-amber-500/30';
      case 4:
        return 'bg-orange-950/30 text-orange-300 border-orange-500/30';
      default:
        return 'bg-fuchsia-950/30 text-fuchsia-300 border-fuchsia-500/30';
    }
  };

  return (
    <div className="bg-[#11131b] text-[#e1e2ed] min-h-screen flex flex-col relative overflow-hidden selection:bg-[#2563eb]/30 select-none">
      {/* Self-contained style tag ensuring keyframe animation compiled independently */}
      <style>{`
        @keyframes drift {
          0% { transform: translateY(0) rotate(0deg); opacity: 0; }
          8% { opacity: 0.05; }
          90% { opacity: 0.05; }
          100% { transform: translateY(-122vh) rotate(15deg); opacity: 0; }
        }
        .watermark-char-fixed {
          position: fixed;
          font-family: 'Noto Serif SC', serif;
          color: #ffffff;
          opacity: 0;
          z-index: 0;
          pointer-events: none;
          user-select: none;
          animation: drift infinite linear;
        }
      `}</style>

      {/* Fixed Ambient Background Watermarks */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {chars.map((item) => (
          <div
            key={item.id}
            className="watermark-char-fixed"
            style={{
              left: `${item.left}vw`,
              top: `${item.top}vh`,
              fontSize: `${item.fontSize}px`,
              animationDuration: `${item.duration}s`,
              animationDelay: `${item.delay}s`,
            }}
          >
            {item.char}
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-6 py-6 flex justify-between items-center border-b border-white/5 bg-[#11131b]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-[#b4c5ff] tracking-tight">
            Zimu <span className="font-serif text-[#e1e2ed]">字幕</span>
          </span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push('/login?mode=signin')}
            className="text-sm font-semibold text-[#c3c6d7] hover:text-white transition-colors cursor-pointer"
          >
            Sign In
          </button>
          <button
            onClick={() => router.push('/login?mode=signup')}
            className="bg-[#2563eb] hover:bg-[#2563eb]/90 text-white font-bold px-4 py-2 rounded-lg text-sm shadow-md cursor-pointer transition-all active:scale-[0.98]"
          >
            Sign Up
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex-1 max-w-7xl mx-auto w-full px-6 py-12 md:py-24 flex flex-col lg:flex-row gap-16 items-center">
        {/* Left column */}
        <div className="flex-1 space-y-8 max-w-2xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 bg-[#191b23] border border-white/10 px-3 py-1.5 rounded-full text-xs text-[#b4c5ff] font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2563eb] animate-pulse"></span>
            Luminous Graded Reader
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Learn Chinese <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#b4c5ff] to-[#ddb7ff]">
              by reading
            </span>
            , not memorizing.
          </h1>

          <p className="text-base sm:text-lg text-[#c3c6d7] leading-relaxed">
            Zimu crafts custom graded stories calibrated to your exact vocabulary levels. Tap any word for instant definitions and pinyin pronunciation, while new vocabulary is seamlessly introduced in context.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
            <button
              onClick={() => router.push('/login?mode=signup')}
              className="bg-[#2563eb] hover:bg-[#2563eb]/90 text-white font-bold py-4 px-8 rounded-xl text-base shadow-lg shadow-[#2563eb]/20 cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>Get Started for Free</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </button>
            <button
              onClick={() => router.push('/login?mode=signin')}
              className="bg-transparent hover:bg-white/5 text-white font-bold py-4 px-8 rounded-xl text-base border border-white/10 cursor-pointer transition-all active:scale-[0.98]"
            >
              Sign In to Your Workspace
            </button>
          </div>
        </div>

        {/* Right column (Interactive Sandbox Card) */}
        <div className="flex-1 w-full max-w-xl">
          <div className="bg-[#191b23] inner-glow rounded-2xl p-6 sm:p-8 backdrop-blur-2xl shadow-[0_20px_40px_rgba(0,0,0,0.4)] border border-white/10 relative">
            <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-[#11131b] border border-white/5 px-2.5 py-1 rounded-full text-[10px] font-bold text-[#c3c6d7]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Live Sandbox Preview
            </div>

            <div className="mb-6 pb-4 border-b border-white/10">
              <span className="text-[10px] font-bold tracking-wider text-[#b4c5ff] uppercase block mb-1">
                HSK 3-4 Custom Reader
              </span>
              <h3 className="text-lg font-bold text-white font-serif">
                Zimu Interactive Preview
              </h3>
            </div>

            {/* Sandbox Chinese Reader Grid */}
            <div className="flex flex-wrap gap-y-8 gap-x-2.5 leading-[2.2] text-xl sm:text-2xl select-none p-5 rounded-xl bg-[#11131b] border border-white/5 shadow-inner">
              {sandboxTokens.map((token, index) => {
                if (!token.isWord) {
                  return (
                    <span key={index} className="text-white/40 self-end mb-1 font-medium font-serif">
                      {token.text}
                    </span>
                  );
                }

                const isActive = activeToken?.text === token.text;

                return (
                  <span
                    key={index}
                    onClick={() => setActiveToken(token)}
                    className={`group relative inline-flex flex-col items-center cursor-pointer rounded-lg px-1.5 pb-0.5 transition-all duration-150 ${
                      getHskColorClass(token.hsk, token.isKnown || false)
                    } ${isActive ? 'ring-2 ring-[#b4c5ff] ring-offset-2 ring-offset-[#11131b]' : ''}`}
                  >
                    <span className="text-[10px] text-[#c3c6d7]/70 font-medium block h-3.5 mb-1">
                      {token.pinyin}
                    </span>
                    <span className="font-serif tracking-wider relative font-semibold">
                      {token.text}
                      {token.hsk && (
                        <span className="absolute -top-1.5 -right-2 text-[7px] leading-none font-extrabold opacity-60 bg-[#11131b] px-0.5 rounded border border-current scale-75 select-none">
                          {token.hsk}
                        </span>
                      )}
                    </span>
                  </span>
                );
              })}
            </div>

            {/* Sandbox Definition popup */}
            <div className="mt-6 h-32 flex flex-col justify-center bg-[#11131b]/50 border border-white/5 rounded-xl p-4 relative overflow-hidden transition-all duration-300">
              {activeToken ? (
                <div className="animate-fadeIn space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-base font-extrabold text-white font-serif">{activeToken.text}</h4>
                      <p className="text-[#b4c5ff] font-bold text-xs">pinyin: {activeToken.pinyin}</p>
                    </div>
                    {activeToken.hsk && (
                      <span className={`px-2.5 py-0.5 rounded text-[9px] font-bold border ${getHskBadgeColors(activeToken.hsk)}`}>
                        HSK {activeToken.hsk}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#c3c6d7] leading-relaxed italic">
                    {activeToken.definition}
                  </p>
                </div>
              ) : (
                <div className="text-center space-y-1.5">
                  <svg className="w-8 h-8 text-white/20 mx-auto mb-1 animate-pulse" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.042 21.672L13.684 16.6m0 0l-2.51 2.225.569-3.47 5.105-5.105a2.236 2.236 0 10-3.162-3.162l-5.105 5.105-3.47.568 2.225-2.51 5.072-1.358h-.001z" />
                  </svg>
                  <p className="text-xs text-[#c3c6d7]/60 font-medium">
                    Click on any characters above to preview the lookup helper!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* How It Works Section */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 py-16 border-t border-white/5 bg-[#191b23]/30">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#b4c5ff]">Methodology</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">How Zimu Works</h2>
          <p className="text-sm sm:text-base text-[#c3c6d7] leading-relaxed">
            Our system aligns story pacing to your exact progress, creating an optimized learning curve that matches actual language acquisition science.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-[#191b23] border border-white/5 rounded-2xl p-8 relative overflow-hidden transition-all duration-300 hover:border-white/10 group">
            <div className="absolute top-4 right-6 text-5xl font-extrabold text-white/5 select-none transition-colors group-hover:text-white/10">01</div>
            <div className="w-12 h-12 rounded-xl bg-[#2563eb]/10 border border-[#2563eb]/20 flex items-center justify-center text-[#b4c5ff] mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Initialize Your Vocabulary Baseline</h3>
            <p className="text-sm text-[#c3c6d7] leading-relaxed">
              When you join, specify your initial Chinese benchmark level. Zimu automatically map-initializes your starting database, marking thousands of structural characters up to that boundary as known.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-[#191b23] border border-white/5 rounded-2xl p-8 relative overflow-hidden transition-all duration-300 hover:border-white/10 group">
            <div className="absolute top-4 right-6 text-5xl font-extrabold text-white/5 select-none transition-colors group-hover:text-white/10">02</div>
            <div className="w-12 h-12 rounded-xl bg-[#2563eb]/10 border border-[#2563eb]/20 flex items-center justify-center text-[#b4c5ff] mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Generate Calibrated Stories</h3>
            <p className="text-sm text-[#c3c6d7] leading-relaxed">
              Our Gemini pipeline leverages your baseline map to compose short stories. Narratives are structured containing 90%+ known words, introducing exactly 3 to 6 new terms as natural, context-embedded focal points.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-[#191b23] border border-white/5 rounded-2xl p-8 relative overflow-hidden transition-all duration-300 hover:border-white/10 group">
            <div className="absolute top-4 right-6 text-5xl font-extrabold text-white/5 select-none transition-colors group-hover:text-white/10">03</div>
            <div className="w-12 h-12 rounded-xl bg-[#2563eb]/10 border border-[#2563eb]/20 flex items-center justify-center text-[#b4c5ff] mb-6">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-3">Engage, Track & Auto-Progress</h3>
            <p className="text-sm text-[#c3c6d7] leading-relaxed">
              Interact with characters to toggle known states, complete comprehension quizzes, and review lookup metrics in an integrated SRS flashcard deck. Your vocabulary adapts automatically as you read.
            </p>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 w-full max-w-7xl mx-auto px-6 py-16 border-t border-white/5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-[#191b23] border border-white/5 rounded-2xl p-6 sm:p-8 hover:border-white/10 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#2563eb]/10 flex items-center justify-center text-[#b4c5ff] mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-white mb-2">Comprehensible Reading</h3>
            <p className="text-xs sm:text-sm text-[#c3c6d7] leading-relaxed">
              Ditch standard memorization lists. Learn through context-rich, naturally calibrated short stories where words appear exactly when you are ready.
            </p>
          </div>

          <div className="bg-[#191b23] border border-white/5 rounded-2xl p-6 sm:p-8 hover:border-white/10 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#2563eb]/10 flex items-center justify-center text-[#b4c5ff] mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-white mb-2">SM-2 Spaced Repetition</h3>
            <p className="text-xs sm:text-sm text-[#c3c6d7] leading-relaxed">
              Words you lookup are tracked, scheduled, and surfaced via an integrated SRS deck at mathematically perfect review intervals.
            </p>
          </div>

          <div className="bg-[#191b23] border border-white/5 rounded-2xl p-6 sm:p-8 hover:border-white/10 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-[#2563eb]/10 flex items-center justify-center text-[#b4c5ff] mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 21l8.954-8.955M21 12H3m18 0l-3-3m3 3l-3 3" />
              </svg>
            </div>
            <h3 className="text-base font-bold text-white mb-2">Gemini AI Adaptive Engine</h3>
            <p className="text-xs sm:text-sm text-[#c3c6d7] leading-relaxed">
              Zimu dynamically interfaces with advanced Gemini LLMs to generate high-quality prose with zero repetition, custom-tailored to HSK levels.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-6 py-8 border-t border-white/5 text-center flex flex-col sm:flex-row justify-between items-center gap-4">
        <p className="text-xs text-[#c3c6d7]/50">&copy; {new Date().getFullYear()} Zimu 字幕. Read your way to fluency.</p>
        <div className="flex gap-4 text-xs text-[#c3c6d7]/50">
          <a href="#" className="hover:text-[#b4c5ff] transition-colors">Privacy Policy</a>
          <span>&middot;</span>
          <a href="#" className="hover:text-[#b4c5ff] transition-colors">Terms of Service</a>
        </div>
      </footer>
    </div>
  );
}