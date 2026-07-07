'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function PrivacyPolicyPage() {
  const router = useRouter();

  return (
    <div className="bg-[#11131b] text-[#e1e2ed] min-h-screen py-16 px-6 font-sans relative overflow-hidden selection:bg-[#2563eb]/30">
      
      {/* Decorative subtle header glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[150px] bg-[#2563eb]/10 rounded-full blur-[100px] pointer-events-none z-0" />

      <div className="max-w-3xl mx-auto relative z-10 space-y-12">
        {/* Navigation */}
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-[#b4c5ff] hover:text-white transition-colors cursor-pointer group"
        >
          <svg className="w-4 h-4 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
          <span>Back to Home</span>
        </button>

        {/* Content Panel */}
        <article className="bg-[#191b23] border border-white/5 rounded-2xl p-8 sm:p-12 shadow-[0_20px_40px_rgba(0,0,0,0.4)] space-y-8">
          <header className="border-b border-white/10 pb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[#b4c5ff]">Legal Documentation</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">Privacy Policy</h1>
            <p className="text-xs text-[#c3c6d7]/50 mt-2">Last Updated: July 2026</p>
          </header>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white">1. Introduction</h2>
            <p className="text-sm text-[#c3c6d7] leading-relaxed">
              Welcome to Zimu (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or &ldquo;us&rdquo;). This Privacy Policy explains how we collect, use, and protect your information when you access and use our Chinese graded reading platform. Zimu is a free, non-commercial educational project designed to assist language learners in vocabulary acquisition.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white">2. Information We Collect</h2>
            <p className="text-sm text-[#c3c6d7] leading-relaxed">
              To provide a personalized learning experience, we collect only the minimum required technical data:
            </p>
            <ul className="list-disc list-inside text-sm text-[#c3c6d7] space-y-2 pl-2">
              <li><strong className="text-white">Account Information:</strong> Your email address and a secured, hashed password (managed by Firebase Authentication) are collected to identify your unique learning workspace.</li>
              <li><strong className="text-white">Learning Metrics:</strong> Your known Chinese words, target HSK level, custom display nickname, completed stories history, and Spaced Repetition (SRS) flashcard metrics are recorded to calibrate future content.</li>
              <li><strong className="text-white">API Preferences:</strong> Your provided Gemini API Key is stored securely within your authenticated user document to authorize generation requests made on your behalf.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white">3. Third-Party Integrations</h2>
            <p className="text-sm text-[#c3c6d7] leading-relaxed">
              We leverage trusted cloud providers to maintain our application:
            </p>
            <ul className="list-disc list-inside text-sm text-[#c3c6d7] space-y-2 pl-2">
              <li><strong className="text-white">Google Cloud & Firebase:</strong> Authentication details and data backups are stored securely on Google Firestore. Data storage practices adhere to standard Google Cloud compliance frameworks.</li>
              <li><strong className="text-white">Gemini API:</strong> Reading prompt structures and HSK tier parameters are passed to the Gemini LLM to generate customized text. No personal identifiers (like your email address or password) are shared with the Gemini API.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white">4. Cookies and Local Storage</h2>
            <p className="text-sm text-[#c3c6d7] leading-relaxed">
              We utilize browser-based <strong className="text-white">localStorage</strong> to cache your story history, active flashcards, and interface settings. This provides immediate page loading and prevents unnecessary network requests. These storage entities do not track your activity across other websites.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white">5. Your Choices & Data Rights</h2>
            <p className="text-sm text-[#c3c6d7] leading-relaxed">
              You maintain absolute control over your study data:
            </p>
            <ul className="list-disc list-inside text-sm text-[#c3c6d7] space-y-2 pl-2">
              <li>You can view and modify your account settings (including your display name and email address) at any time.</li>
              <li>You can download a structured copy of your learning statistics using our **JSON Data Export** tool.</li>
              <li>You can trigger a full, irreversible profile erase using the **Delete Account** option inside your Settings modal, which systematically purges all associated authentication records and Firestore documents.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white">6. Changes to this Policy</h2>
            <p className="text-sm text-[#c3c6d7] leading-relaxed">
              We may periodically update this policy as new educational features are developed. All structural revisions will be accompanied by an updated &ldquo;Last Updated&rdquo; timestamp at the top of this document.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}