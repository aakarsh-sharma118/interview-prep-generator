/**
 * Flashcard Practice Page
 * Interactive practice route with flashcard decks and confidence progression.
 * Supports light/dark mode and responsive desktop/mobile viewports.
 * Author: Aakarsh Sharma
 */

'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { FlashcardDeck } from '../../../../src/components/practice/FlashcardDeck.jsx';
import { useKitStore } from '../../../../src/hooks/useKitStore.js';
import { RoutePaths } from '../../../../src/utils/appConstants.js';
import { PageStrings } from '../../../../src/utils/pageStrings.js';

export default function PracticeModePage() {
  const router = useRouter();
  const params = useParams();
  const kitId = params.id;
  const { activeKit, fetchKitById, isLoading } = useKitStore();

  useEffect(() => {
    router.prefetch(RoutePaths.KITS);
    if (kitId) {
      router.prefetch(RoutePaths.KIT_DETAIL(kitId));
      if (!activeKit || activeKit._id !== kitId) {
        fetchKitById(kitId);
      }
    }
  }, [kitId, router, activeKit, fetchKitById]);

  if (isLoading || !activeKit) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-4 font-mono text-xs text-theme-text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-brand-emerald" />
        <p>Loading flashcard practice deck...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2 sm:py-4">
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
        <Link href={RoutePaths.KIT_DETAIL(activeKit._id)} prefetch={true} className="hover:text-brand-indigo transition-colors truncate max-w-[150px] sm:max-w-[250px]">
          {activeKit.role.title}
        </Link>
        <span>/</span>
        <span className="text-theme-text-primary font-medium">
          {PageStrings.PRACTICE_TITLE}
        </span>
      </nav>

      {/* ── Navigation Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-theme-border pb-4 gap-3">
        <div className="flex items-center space-x-3">
          <Link
            href={RoutePaths.KIT_DETAIL(activeKit._id)}
            prefetch={true}
            aria-label="Back to Kit Workspace"
            className="p-2.5 rounded-xl bg-theme-surface border border-theme-border text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-elevated transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-lg sm:text-xl font-display font-bold text-theme-text-primary">{PageStrings.PRACTICE_TITLE}</h1>
            <p className="text-xs text-theme-text-muted font-mono">
              {activeKit.role.title} • {activeKit.flashcards.length} Flashcards in Deck
            </p>
          </div>
        </div>

        <Link
          href={RoutePaths.KIT_DETAIL(activeKit._id)}
          prefetch={true}
          className="btn btn-sm btn-ghost border border-theme-border rounded-xl text-xs font-mono text-theme-text-secondary hover:text-theme-text-primary"
        >
          Return to Studio
        </Link>
      </div>

      {/* ── Signature Component 3: 3D Spaced-Repetition Flashcard Deck ────── */}
      <FlashcardDeck flashcards={activeKit.flashcards} />
    </div>
  );
}
