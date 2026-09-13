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
import { Play, Mic, ArrowLeft, Loader2, Printer } from 'lucide-react';
import { BentoGridBuilder } from '../../../src/components/builder/BentoGridBuilder.jsx';
import { GapAnalyzerMatrix } from '../../../src/components/coverage/GapAnalyzerMatrix.jsx';
import { MockInterviewModal } from '../../../src/components/mock/MockInterviewModal.jsx';
import { useKitStore } from '../../../src/hooks/useKitStore.js';
import { RoutePaths } from '../../../src/utils/appConstants.js';
import { PageStrings } from '../../../src/utils/pageStrings.js';

export default function KitDetailPage() {
  const params = useParams();
  const router = useRouter();
  const kitId = params.id;

  const { activeKit, fetchKitById, isLoading, error } = useKitStore();
  const [isMockModalOpen, setIsMockModalOpen] = useState(false);

  useEffect(() => {
    if (kitId) {
      fetchKitById(kitId);
    }
  }, [kitId, fetchKitById]);

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
        <Link href={RoutePaths.KITS} className="btn btn-sm btn-primary rounded-xl text-xs">
          Return to Kits List
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-2 sm:py-4">
      {/* ── Top Workspace Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-theme-border pb-5">
        <div className="flex items-center space-x-3">
          <Link
            href={RoutePaths.KITS}
            className="p-2 rounded-xl bg-theme-surface border border-theme-border text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-elevated transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-display font-bold text-theme-text-primary">
              {activeKit.role.title}
            </h1>
            <p className="text-xs font-mono text-theme-text-muted mt-0.5">
              {activeKit.source.company} • {activeKit.schedule.days_available} Days Paced Schedule
            </p>
          </div>
        </div>

        {/* Action Controls: Practice Mode & Mock Simulator */}
        <div className="flex items-center gap-2.5 flex-wrap self-start sm:self-auto">
          <button
            onClick={() => window.print()}
            title="Printable Kit Summary"
            className="btn btn-sm btn-ghost border border-theme-border text-xs font-mono text-theme-text-secondary hover:text-theme-text-primary hidden md:inline-flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>

          <button
            onClick={() => setIsMockModalOpen(true)}
            className="btn btn-sm btn-outline border-brand-indigo text-brand-indigo hover:bg-brand-indigo/10 rounded-xl text-xs font-medium flex items-center gap-1.5"
          >
            <Mic className="w-3.5 h-3.5" />
            <span>Mock Screening</span>
          </button>

          <Link
            href={RoutePaths.KIT_PRACTICE(activeKit._id)}
            className="btn btn-sm btn-primary rounded-xl text-xs font-medium flex items-center gap-1.5 shadow-lg shadow-brand-indigo/20"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{PageStrings.NAV_PRACTICE}</span>
          </Link>
        </div>
      </div>

      {/* ── Signature Component 2: Gapless Bento Grid Builder ─────────────── */}
      <BentoGridBuilder />

      {/* ── Signature Component 4: Deterministic Gap Analyzer Visualizer ─── */}
      <div className="pt-6">
        <GapAnalyzerMatrix
          requirements={activeKit.role.requirements}
          questions={activeKit.questions}
          coverage={activeKit.coverage}
        />
      </div>

      {/* ── Creative Feature: Mock Interview Simulator Modal ─────────────── */}
      <MockInterviewModal
        isOpen={isMockModalOpen}
        onClose={() => setIsMockModalOpen(false)}
        questions={activeKit.questions}
        roleTitle={activeKit.role.title}
      />
    </div>
  );
}
