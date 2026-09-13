/**
 * Flashcard Practice Page
 * Interactive practice route with flashcard decks and confidence progression.
 * Supports light/dark mode and responsive desktop/mobile viewports.
 * Author: Aakarsh Sharma
 */

'use client';

import React, { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { FlashcardDeck } from '../../../../src/components/practice/FlashcardDeck.jsx';
import { useKitStore } from '../../../../src/hooks/useKitStore.js';
import { RoutePaths } from '../../../../src/utils/appConstants.js';
import { PageStrings } from '../../../../src/utils/pageStrings.js';

export default function PracticeModePage() {
  const params = useParams();
  const kitId = params.id;
  const { activeKit, fetchKitById, isLoading } = useKitStore();

  useEffect(() => {
    if (kitId && (!activeKit || activeKit._id !== kitId)) {
      fetchKitById(kitId);
    }
  }, [kitId, activeKit, fetchKitById]);

  if (isLoading || !activeKit) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-4 font-mono text-xs text-theme-text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-brand-emerald" />
        <p>Loading flashcard practice deck...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-2 sm:py-4">
      {/* ── Navigation Header ─────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-theme-border pb-4 gap-3">
        <div className="flex items-center space-x-3">
          <Link
            href={RoutePaths.KIT_DETAIL(activeKit._id)}
            className="p-2 rounded-xl bg-theme-surface border border-theme-border text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-elevated transition-colors"
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
          className="btn btn-sm btn-ghost text-xs font-mono text-theme-text-secondary hover:text-theme-text-primary"
        >
          Return to Workspace
        </Link>
      </div>

      {/* ── Signature Component 3: 3D Spaced-Repetition Flashcard Deck ────── */}
      <FlashcardDeck flashcards={activeKit.flashcards} />
    </div>
  );
}
