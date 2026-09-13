/**
 * Home Page
 * Main landing and input form for generating interview preparation kits.
 * Supports light/dark themes, full responsive layouts, and live pipeline streaming.
 * Author: Aakarsh Sharma
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, AlertCircle, Terminal, Layers } from 'lucide-react';
import { LiveExecutionConsole } from '../src/components/execution/LiveExecutionConsole.jsx';
import { useKitStore } from '../src/hooks/useKitStore.js';
import { useAuthStore } from '../src/hooks/useAuthStore.js';
import { RoutePaths } from '../src/utils/appConstants.js';
import { PageStrings } from '../src/utils/pageStrings.js';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const {
    isGenerating,
    generationProgress,
    currentExecutionStep,
    executionLogs,
    generateKit,
    error,
  } = useKitStore();

  // ── Route Prefetching for Instant Navigation ─────────────────────────────
  React.useEffect(() => {
    router.prefetch(RoutePaths.KITS);
    router.prefetch(RoutePaths.LOGIN);
    router.prefetch(RoutePaths.REGISTER);
  }, [router]);

  // ── Form Input State ──────────────────────────────────────────────────────
  const [jdText, setJdText] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [daysAvailable, setDaysAvailable] = useState(5);
  const [formValidation, setFormValidation] = useState(null);

  // ── Generation Submit Handler ─────────────────────────────────────────────
  const handleGenerate = async (e) => {
    e.preventDefault();

    if (!jdText.trim()) {
      setFormValidation('Please paste a job description text to proceed.');
      return;
    }

    setFormValidation(null);

    // If user is not logged in, auto-authenticate with demo guest account
    if (!isAuthenticated) {
      await useAuthStore.getState().demoLogin();
    }

    const result = await generateKit({
      jdText: jdText.trim(),
      companyUrl: companyUrl.trim(),
      daysAvailable: parseInt(daysAvailable, 10),
    });

    if (result.success && result.kit) {
      router.push(RoutePaths.KIT_DETAIL(result.kit._id));
    }
  };

  const handleFillSample = (sampleType = 'stripe') => {
    if (sampleType === 'spotify') {
      setJdText(`Role: Machine Learning Engineer
Company: Spotify
Location: New York, NY / Remote

About the Role:
Join the Personalization team at Spotify. You will research, train, and deploy large-scale recommendation models serving 500M+ active music and podcast listeners.

Key Requirements:
- 4+ years building production ML systems using Python, PyTorch, and TensorFlow.
- Experience with vector search, collaborative filtering, and embedding-based retrieval at scale.
- Strong knowledge of real-time data streaming (Kafka) and feature store architecture.
- Track record conducting rigorous A/B experimentation and evaluating offline vs online metric trade-offs.
- Excellent communication skills partnering with product managers and backend engineers.`);
      setCompanyUrl('https://spotify.com');
      setDaysAvailable(5);
      setFormValidation(null);
    } else if (sampleType === 'google') {
      setJdText(`Role: Technical Product Manager
Company: Google
Location: Mountain View, CA / Remote

About the Role:
We are seeking a Technical Product Manager to drive developer platforms and cloud infrastructure tools. You will lead cross-functional engineering teams to define product strategy and roadmap.

Key Requirements:
- 4+ years of product management experience shipping technical platforms or developer tools.
- Strong technical fluency in cloud architecture, distributed systems, and API ecosystems.
- Proven expertise in data-driven prioritization using RICE frameworks and customer user research.
- Experience defining and measuring key North Star metrics, retention cohorts, and feature engagement.
- High executive presence with exceptional stakeholder alignment and written PRD documentation.`);
      setCompanyUrl('https://google.com');
      setDaysAvailable(7);
      setFormValidation(null);
    } else {
      setJdText(`Role: Senior Full-Stack Engineer
Company: Stripe
Location: Remote (US / Global)

About the Role:
We are looking for a Senior Full Stack Engineer to join our Developer Platform group. In this role, you will design and build low-latency APIs, developer SDKs, and merchant-facing dashboards.

Key Requirements:
- 5+ years building scalable distributed web applications using TypeScript, Node.js, and React.
- Strong knowledge of relational databases (PostgreSQL) and caching layers (Redis).
- Deep experience designing RESTful and GraphQL APIs with strict idempotency and reliability guarantees.
- Track record collaborating with product designers, writing clean modular code, and mentoring junior engineers.
- Strong debugging skills under production traffic and comprehensive automated test habits.`);
      setCompanyUrl('https://stripe.com');
      setDaysAvailable(5);
      setFormValidation(null);
    }
  };

  return (
    <div className="space-y-10 py-2 sm:py-6">
      {/* ── Top Hero & Typography ─────────────────────────────────────────── */}
      <div className="space-y-4 max-w-3xl">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-theme-surface border border-theme-border text-xs font-mono text-brand-emerald shadow-sm">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{PageStrings.HERO_BADGE}</span>
        </div>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-display font-bold tracking-tight text-theme-text-primary leading-[1.12]">
          {PageStrings.HERO_HEADLINE}
        </h1>
        <p className="text-sm sm:text-base text-theme-text-secondary leading-relaxed font-sans max-w-2xl">
          {PageStrings.HERO_SUBTITLE}
        </p>

        {/* ── 3-Step Guided Workflow Banner ───────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 text-xs font-mono">
          <div className="p-3 rounded-2xl bg-theme-surface border border-theme-border flex items-center space-x-2.5">
            <span className="w-6 h-6 rounded-full bg-brand-indigo/15 text-brand-indigo font-bold flex items-center justify-center text-xs">1</span>
            <span className="text-theme-text-secondary font-medium">Input Job Description</span>
          </div>
          <div className="p-3 rounded-2xl bg-theme-surface border border-theme-border flex items-center space-x-2.5">
            <span className="w-6 h-6 rounded-full bg-brand-emerald/15 text-brand-emerald font-bold flex items-center justify-center text-xs">2</span>
            <span className="text-theme-text-secondary font-medium">Role Analysis & Questions</span>
          </div>
          <div className="p-3 rounded-2xl bg-theme-surface border border-theme-border flex items-center space-x-2.5">
            <span className="w-6 h-6 rounded-full bg-brand-violet/15 text-brand-violet font-bold flex items-center justify-center text-xs">3</span>
            <span className="text-theme-text-secondary font-medium">Practice & Mock Screening</span>
          </div>
        </div>
      </div>

      {/* ── Split Viewport: Inputs (Left) & Pinned Live Console (Right) ───── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
        {/* ── Left Column: Form Controls ──────────────────────────────────── */}
        <form
          onSubmit={handleGenerate}
          className="lg:col-span-6 space-y-5 bg-theme-surface/90 border border-theme-border rounded-3xl p-5 sm:p-8 backdrop-blur-xl shadow-card-light dark:shadow-card-dark transition-colors"
        >
          {/* Job Description Textarea */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
              <label className="text-xs font-mono font-semibold text-theme-text-secondary block uppercase tracking-wider">
                {PageStrings.LABEL_JOB_DESCRIPTION}
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-mono text-theme-text-muted">Fill Sample:</span>
                <button
                  type="button"
                  onClick={() => handleFillSample('stripe')}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-theme-elevated border border-theme-border hover:border-brand-indigo text-theme-text-secondary hover:text-brand-indigo transition-colors"
                >
                  Full-Stack
                </button>
                <button
                  type="button"
                  onClick={() => handleFillSample('spotify')}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-theme-elevated border border-theme-border hover:border-brand-emerald text-theme-text-secondary hover:text-brand-emerald transition-colors"
                >
                  ML Engineer
                </button>
                <button
                  type="button"
                  onClick={() => handleFillSample('google')}
                  className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-theme-elevated border border-theme-border hover:border-brand-violet text-theme-text-secondary hover:text-brand-violet transition-colors"
                >
                  Product Mgr
                </button>
              </div>
            </div>
            <textarea
              value={jdText}
              onChange={(e) => setJdText(e.target.value)}
              rows={7}
              placeholder={PageStrings.PLACEHOLDER_JOB_DESCRIPTION}
              className="w-full bg-theme-elevated/70 border border-theme-border focus:border-brand-indigo rounded-2xl p-4 text-xs text-theme-text-primary font-sans leading-relaxed resize-none focus:outline-none transition-colors"
              disabled={isGenerating}
            />
          </div>

          {/* Company Website URL Input */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-semibold text-theme-text-secondary block uppercase tracking-wider">
              {PageStrings.LABEL_COMPANY_URL}
            </label>
            <input
              type="text"
              value={companyUrl}
              onChange={(e) => setCompanyUrl(e.target.value)}
              placeholder={PageStrings.PLACEHOLDER_COMPANY_URL}
              className="w-full bg-theme-elevated/70 border border-theme-border focus:border-brand-indigo rounded-xl px-4 py-3 text-xs text-theme-text-primary font-mono focus:outline-none transition-colors"
              disabled={isGenerating}
            />
          </div>

          {/* Days Available Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-mono font-semibold text-theme-text-secondary block uppercase tracking-wider">
                {PageStrings.LABEL_DAYS_AVAILABLE}
              </label>
              <span className="text-xs font-mono text-brand-emerald font-bold">{daysAvailable} days</span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              value={daysAvailable}
              onChange={(e) => setDaysAvailable(e.target.value)}
              className="range range-xs range-primary"
              disabled={isGenerating}
            />
            <div className="w-full flex justify-between text-[10px] font-mono text-theme-text-muted px-1">
              <span>1 Day (Sprint)</span>
              <span>5 Days (Standard)</span>
              <span>14 Days</span>
              <span>30 Days</span>
            </div>
          </div>

          {/* Error Message if any */}
          {(formValidation || error) && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{formValidation || error}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isGenerating}
            className="w-full btn btn-primary rounded-xl font-medium text-sm flex items-center justify-center space-x-2 py-3 shadow-lg shadow-brand-indigo/25 hover:shadow-brand-indigo/40 transition-all"
          >
            <span>{isGenerating ? PageStrings.BTN_GENERATING : PageStrings.BTN_GENERATE_KIT}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* ── Right Column: Pinned Live-Execution Flow (Signature #1) ─────── */}
        <div className="lg:col-span-6 w-full">
          <LiveExecutionConsole
            isGenerating={isGenerating}
            progress={generationProgress}
            currentStep={currentExecutionStep}
            logs={executionLogs}
            companyUrl={companyUrl}
          />
        </div>
      </div>
    </div>
  );
}
