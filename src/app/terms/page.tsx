'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function TermsOfServicePage() {
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
            <span className="text-xs font-bold uppercase tracking-widest text-[#b4c5ff]">Legal Contract</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-white mt-1">Terms of Service</h1>
            <p className="text-xs text-[#c3c6d7]/50 mt-2">Last Updated: July 2026</p>
          </header>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white">1. Acceptance of Terms</h2>
            <p className="text-sm text-[#c3c6d7] leading-relaxed">
              By registering an account or accessing the services provided on Zimu (&ldquo;Zimu&rdquo;, &ldquo;we&rdquo;, &ldquo;our&rdquo;), you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, you may not register or access the application.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white">2. Educational & AI Content Disclaimer</h2>
            <p className="text-sm text-[#c3c6d7] leading-relaxed">
              Zimu uses artificial intelligence (primarily Large Language Models from the Gemini platform) to generate personalized Chinese graded readers.
            </p>
            <p className="text-sm text-[#c3c6d7] leading-relaxed font-semibold text-[#b4c5ff]">
              ⚠️ Please Note: Generative AI models are subject to errors. Zimu does not guarantee the pedagogical accuracy, factual correctness, grammatical precision, spelling accuracy, or natural tone of any generated stories, comprehension checks, or English translations.
            </p>
            <p className="text-sm text-[#c3c6d7] leading-relaxed">
              Stories and explanations are created automatically for educational preview and vocabulary engagement purposes only. They are not a replacement for formal professional instruction.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white">3. CC-CEDICT License & Data Compliance</h2>
            <p className="text-sm text-[#c3c6d7] leading-relaxed">
              Our dictionary search tools and popup definition services incorporate parsing metrics derived from the **CC-CEDICT Chinese-English Dictionary database**.
            </p>
            <p className="text-sm text-[#c3c6d7] leading-relaxed">
              This dictionary dataset is utilized in compliance with, and under the legal requirements of, the **Creative Commons Attribution-ShareAlike 4.0 International License (CC BY-SA 4.0)**.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white">4. User Provided API Keys</h2>
            <p className="text-sm text-[#c3c6d7] leading-relaxed">
              Zimu allows you to supply your own Gemini API Key to enable custom story generation. You retain absolute responsibility for your key usage metrics, quotas, and account limits. We are not responsible for billing charges or API usage fees incurred as a result of using your personal API key on this platform.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white">5. Disclaimer of Warranties</h2>
            <p className="text-sm text-[#c3c6d7] leading-relaxed">
              ZIMU IS PROVIDED ON AN &ldquo;AS IS&rdquo; AND &ldquo;AS AVAILABLE&rdquo; BASIS, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="text-lg font-bold text-white">6. Limitation of Liability</h2>
            <p className="text-sm text-[#c3c6d7] leading-relaxed">
              IN NO EVENT SHALL THE DEVELOPERS OR CONTRIBUTORS OF ZIMU BE LIABLE FOR ANY CLAIM, DAMAGES, LOSS OF DATA, PROGRESS DISRUPTION, OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT, OR OTHERWISE, ARISING FROM, OUT OF, OR IN CONNECTION WITH THE USE OF OR INABILITY TO USE THE PLATFORM.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}