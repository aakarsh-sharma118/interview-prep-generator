/**
 * Kit Details and Workspace Page
 * Displays prep kit details, interactive bento grid, and coverage analysis.
 * Supports light/dark mode and responsive desktop/mobile viewports.
 * Author: Aakarsh Sharma
 */

'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Play,
  Mic,
  ArrowLeft,
  Loader2,
  Printer,
  BarChart3,
  Layers,
  ShieldCheck,
  Sparkles,
  Building2,
  CheckCircle2,
  Calendar,
  Trash2,
} from 'lucide-react';
import { BentoGridBuilder } from '../../../src/components/builder/BentoGridBuilder.jsx';
import { GapAnalyzerMatrix } from '../../../src/components/coverage/GapAnalyzerMatrix.jsx';
import { ScheduleTimelineVisualizer } from '../../../src/components/visualizer/ScheduleTimelineVisualizer.jsx';
import { MockInterviewModal } from '../../../src/components/mock/MockInterviewModal.jsx';
import { useKitStore } from '../../../src/hooks/useKitStore.js';
import { RoutePaths } from '../../../src/utils/appConstants.js';
import { PageStrings } from '../../../src/utils/pageStrings.js';

export default function KitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const kitId = params.id;

  const { activeKit, fetchKitById, deleteKit, isLoading, error } = useKitStore();
  const [isMockModalOpen, setIsMockModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'workspace' | 'visualizer' | 'coverage'

  const handleDeleteKit = async () => {
    setIsDeleting(true);
    const res = await deleteKit(kitId);
    setIsDeleting(false);
    if (res.success) {
      router.push(RoutePaths.KITS);
    }
  };

  useEffect(() => {
    router.prefetch(RoutePaths.KITS);
    if (kitId) {
      router.prefetch(RoutePaths.KIT_PRACTICE(kitId));
      fetchKitById(kitId);
    }
  }, [kitId, router, fetchKitById]);

  if (isLoading && !activeKit) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-4 font-mono text-xs text-theme-text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-brand-emerald" />
        <p>Loading preparation kit workspace...</p>
      </div>
    );
  }

  if (error || !activeKit) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-3xl bg-theme-surface border border-theme-border text-center space-y-4 shadow-card-light dark:shadow-card-dark">
        <h2 className="text-lg font-bold text-theme-text-primary">Kit Not Found</h2>
        <p className="text-xs text-theme-text-muted font-mono">{error || 'Unable to retrieve the requested preparation kit.'}</p>
        <Link href={RoutePaths.KITS} prefetch={true} className="btn btn-sm btn-primary rounded-xl text-xs">
          Return to Kits List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2 sm:py-4">
      {/* ── Official Breadcrumb Navigation ───────────────────────────────── */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs font-mono text-theme-text-muted">
        <Link href={RoutePaths.HOME} prefetch={true} className="hover:text-brand-indigo transition-colors">
          Home
        </Link>
        <span>/</span>
        <Link href={RoutePaths.KITS} prefetch={true} className="hover:text-brand-indigo transition-colors">
          {PageStrings.NAV_DASHBOARD}
        </Link>
        <span>/</span>
        <span className="text-theme-text-primary font-medium truncate max-w-[200px] sm:max-w-[360px]">
          {activeKit.role.title}
        </span>
      </nav>

      {/* ── Top Workspace Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-theme-border pb-5">
        <div className="flex items-center space-x-3">
          <Link
            href={RoutePaths.KITS}
            prefetch={true}
            aria-label="Back to Kits List"
            className="p-2.5 rounded-xl bg-theme-surface border border-theme-border text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-elevated transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap text-xs font-mono">
              <span className="text-brand-indigo font-semibold flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {activeKit.source.company || 'Target Company'}
              </span>
              <span className="text-theme-text-muted">•</span>
              <span className="text-brand-emerald flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verified Kit
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-theme-text-primary">
              {activeKit.role.title}
            </h1>
            <div className="flex items-center gap-2 text-xs font-mono text-theme-text-muted flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {activeKit.schedule.days_available} Days Paced Schedule
              </span>
              <span>•</span>
              <span>{activeKit.questions?.length || 0} Tailored Questions</span>
              <span>•</span>
              <span>{activeKit.role.requirements?.length || 0} Evaluated Skills</span>
            </div>
          </div>
        </div>

        {/* Action Controls: Practice Mode & Mock Simulator */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            onClick={() => window.print()}
            title="Printable Kit Summary"
            aria-label="Export Printable Kit Summary"
            className="btn btn-sm btn-ghost border border-theme-border text-xs font-mono text-theme-text-secondary hover:text-theme-text-primary hidden md:inline-flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMockModalOpen(true)}
            aria-label="Launch Mock Screening Simulator"
            className="btn btn-sm btn-outline border-brand-indigo text-brand-indigo hover:bg-brand-indigo/10 rounded-xl text-xs font-medium flex items-center gap-1.5"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Mock Screening</span>
          </button>

          <Link
            href={RoutePaths.KIT_PRACTICE(activeKit._id)}
            prefetch={true}
            className="btn btn-sm btn-primary rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-brand-indigo/20"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{PageStrings.NAV_PRACTICE}</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            title="Delete this preparation kit"
            aria-label="Delete preparation kit"
            className="btn btn-sm btn-ghost border border-theme-border text-xs font-mono text-theme-text-muted hover:text-rose-500 hover:border-rose-500/30 rounded-xl flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Delete</span>
          </button>
        </div>
      </div>

      {/* ── Official Preparation Roadmap Guide Banner ─────────────────────── */}
      <div className="rounded-2xl bg-theme-surface/80 border border-theme-border p-4 backdrop-blur-md shadow-card-light dark:shadow-card-dark">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-theme-border/60">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-brand-emerald" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-theme-text-primary">
              Official Preparation Roadmap
            </span>
          </div>
          <span className="text-[11px] font-mono text-brand-emerald font-medium">
            ✓ Tailored to Job Description • Ready for Mock Screening
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 text-xs font-mono">
          <div className="p-2.5 rounded-xl bg-theme-elevated border border-theme-border/50 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-brand-indigo/15 text-brand-indigo font-bold flex items-center justify-center text-[10px]">1</span>
              <p className="font-semibold text-theme-text-primary font-sans">Company Intel</p>
            </div>
            <p className="text-[11px] text-theme-text-muted pl-7">Culture, engineering values, and company overview.</p>
          </div>
          <div className="p-2.5 rounded-xl bg-theme-elevated border border-theme-border/50 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-brand-emerald/15 text-brand-emerald font-bold flex items-center justify-center text-[10px]">2</span>
              <p className="font-semibold text-theme-text-primary font-sans">Role Questions</p>
            </div>
            <p className="text-[11px] text-theme-text-muted pl-7">STAR talking points for technical & behavioral prompts.</p>
          </div>
          <div className="p-2.5 rounded-xl bg-theme-elevated border border-theme-border/50 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-brand-violet/15 text-brand-violet font-bold flex items-center justify-center text-[10px]">3</span>
              <p className="font-semibold text-theme-text-primary font-sans">Paced Schedule</p>
            </div>
            <p className="text-[11px] text-theme-text-muted pl-7">Daily study blocks matched to your interview deadline.</p>
          </div>
          <div className="p-2.5 rounded-xl bg-theme-elevated border border-theme-border/50 space-y-1">
            <div className="flex items-center space-x-2">
              <span className="w-5 h-5 rounded-full bg-brand-amber/15 text-brand-amber font-bold flex items-center justify-center text-[10px]">4</span>
              <p className="font-semibold text-theme-text-primary font-sans">Mock & Practice</p>
            </div>
            <p className="text-[11px] text-theme-text-muted pl-7">Interactive simulator and flashcard retention deck.</p>
          </div>
        </div>
      </div>

      {/* ── View Navigation Tabs with Clear Labels ────────────────────────── */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 border-b border-theme-border pb-1 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-brand-emerald/15 text-brand-emerald border border-brand-emerald/30'
                : 'text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-elevated'
            }`}
          >
            <span>Complete Studio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('workspace')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'workspace'
                ? 'bg-brand-violet/15 text-brand-violet border border-brand-violet/30'
                : 'text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-elevated'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Questions & Company Intel</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('visualizer')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'visualizer'
                ? 'bg-brand-indigo/15 text-brand-indigo border border-brand-indigo/30'
                : 'text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-elevated'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Study Schedule & Timeline</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('coverage')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors flex items-center gap-1.5 ${
              activeTab === 'coverage'
                ? 'bg-brand-amber/15 text-brand-amber border border-brand-amber/30'
                : 'text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-elevated'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Requirements Match Matrix</span>
          </button>
        </div>

        <p className="text-xs font-mono text-theme-text-muted px-1">
          {activeTab === 'all' && 'Viewing complete interview prep kit with company intel, questions, study schedule, and coverage matrix.'}
          {activeTab === 'workspace' && 'Review company intel, core requirements, and tailored interview questions with STAR answer outlines.'}
          {activeTab === 'visualizer' && 'Interactive day-by-day study schedule with workload distribution and progress checklist.'}
          {activeTab === 'coverage' && 'Deterministic gap analyzer verifying that all job requirements have targeted practice questions.'}
        </p>
      </div>

      {/* ── Visualizer Section ────────────────────────────────────────────── */}
      {(activeTab === 'all' || activeTab === 'visualizer') && (
        <div className="space-y-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-brand-indigo" />
            <h2 className="text-base font-display font-bold text-theme-text-primary">
              Interactive Study Timeline & Load Visualizer
            </h2>
          </div>
          <ScheduleTimelineVisualizer
            schedule={activeKit.schedule}
            questions={activeKit.questions}
            role={activeKit.role}
          />
        </div>
      )}

      {/* ── Signature Component 2: Gapless Bento Grid Builder ─────────────── */}
      {(activeTab === 'all' || activeTab === 'workspace') && (
        <div className="pt-2">
          <BentoGridBuilder />
        </div>
      )}

      {/* ── Signature Component 4: Deterministic Gap Analyzer Visualizer ─── */}
      {(activeTab === 'all' || activeTab === 'coverage') && (
        <div className="pt-4">
          <GapAnalyzerMatrix
            requirements={activeKit.role.requirements}
            questions={activeKit.questions}
            coverage={activeKit.coverage}
          />
        </div>
      )}

      {/* ── Creative Feature: Mock Interview Simulator Modal ─────────────── */}
      <MockInterviewModal
        isOpen={isMockModalOpen}
        onClose={() => setIsMockModalOpen(false)}
        questions={activeKit.questions}
        roleTitle={activeKit.role.title}
      />

      {/* ── Delete Confirmation Modal ────────────────────────────────────── */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-theme-surface border border-theme-border rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-500">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-theme-text-primary font-display">Delete Preparation Kit?</h3>
                <p className="text-xs text-theme-text-muted font-mono">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs text-theme-text-secondary leading-relaxed font-sans">
              Are you sure you want to permanently delete the preparation kit for <strong className="text-theme-text-primary">{activeKit.role.title}</strong> at <strong className="text-theme-text-primary">{activeKit.source.company || 'Target Company'}</strong>?
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-theme-border">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setIsDeleteModalOpen(false)}
                className="btn btn-sm btn-ghost border border-theme-border text-xs font-mono text-theme-text-secondary hover:text-theme-text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteKit}
                className="btn btn-sm btn-outline border-rose-500/40 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl text-xs font-medium flex items-center gap-1.5"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete Kit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
