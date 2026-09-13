/**
 * Flashcard Deck Component
 * Interactive flashcard study interface with 3D flip animation and confidence feedback.
 * Supports light and dark themes and mobile-friendly touch responsiveness.
 * Author: Aakarsh Sharma
 */

'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import { RotateCw, Sparkles, Brain, ArrowRight } from 'lucide-react';
import { usePracticeStore } from '../../hooks/usePracticeStore.js';
import { CONFIDENCE_LEVELS } from '../../utils/appConstants.js';
import { PageStrings } from '../../utils/pageStrings.js';

/**
 * FlashcardDeck - Interactive 3D flip card practice component.
 *
 * @param {Object} props
 * @param {Array<Object>} props.flashcards - Array of flashcards from active kit.
 */
export const FlashcardDeck = ({ flashcards = [] }) => {
  const {
    deck,
    currentIndex,
    isFlipped,
    isFinished,
    coveredCards,
    initializeDeck,
    flipCard,
    recordConfidence,
    restartDeckWithSpacedSort,
  } = usePracticeStore();

  // ── Initial Deck Mount ────────────────────────────────────────────────────
  useEffect(() => {
    if (flashcards.length > 0) {
      initializeDeck(flashcards);
    }
  }, [flashcards, initializeDeck]);

  // Trigger celebration confetti when deck is finished
  useEffect(() => {
    if (isFinished && deck.length > 0) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }
  }, [isFinished, deck.length]);

  const currentCard = deck[currentIndex];
  const progressPercent = deck.length > 0 ? Math.round((coveredCards.size / deck.length) * 100) : 0;

  // ── Render: Session Finished Screen ───────────────────────────────────────
  if (isFinished || !currentCard) {
    return (
      <div className="w-full max-w-xl mx-auto my-12 p-8 rounded-3xl bg-theme-surface border border-theme-border text-center space-y-6 backdrop-blur-xl shadow-card-light dark:shadow-card-dark transition-colors">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-brand-emerald/10 border border-brand-emerald/30 flex items-center justify-center text-brand-emerald">
          <Sparkles className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-display font-bold text-theme-text-primary">{PageStrings.PRACTICE_FINISHED_TITLE}</h2>
          <p className="text-sm text-theme-text-secondary max-w-md mx-auto">{PageStrings.PRACTICE_FINISHED_DESC}</p>
        </div>
        <button
          type="button"
          onClick={restartDeckWithSpacedSort}
          className="btn btn-primary px-6 rounded-xl font-medium flex items-center justify-center gap-2 mx-auto"
        >
          <RotateCw className="w-4 h-4" />
          <span>{PageStrings.BTN_RESTART_PRACTICE}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center space-y-6">
      {/* ── Header Mastery Progress Bar ──────────────────────────────────── */}
      <div className="w-full flex items-center justify-between text-xs font-mono text-theme-text-secondary px-2">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-brand-emerald" />
          <span>
            {PageStrings.PRACTICE_PROGRESS}: <strong className="text-brand-emerald">{progressPercent}%</strong>
          </span>
        </div>
        <span className="text-theme-text-muted">{PageStrings.CARD_COUNTER(currentIndex + 1, deck.length)}</span>
      </div>

      <div className="w-full h-1.5 bg-theme-elevated rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-brand-indigo to-brand-emerald"
          initial={{ width: 0 }}
          animate={{ width: `${progressPercent}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* ── 3D Rotating Card Viewport ────────────────────────────────────── */}
      <div className="w-full h-96 perspective-1000 cursor-pointer" onClick={flipCard}>
        <motion.div
          className="relative w-full h-full rounded-3xl p-6 sm:p-8 bg-theme-surface border border-theme-border backdrop-blur-xl shadow-card-light dark:shadow-card-dark flex flex-col justify-between select-none transition-colors"
          initial={false}
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* ── Card Front (Prompt) ──────────────────────────────────────── */}
          <div
            className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between rounded-3xl backface-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="flex items-center justify-between text-xs font-mono text-theme-text-secondary">
              <span className="px-2.5 py-1 rounded-full bg-theme-elevated border border-theme-border">
                {currentCard.requirement_ids?.join(', ') || 'Requirement Review'}
              </span>
              <span className="text-theme-text-muted">{PageStrings.CARD_FRONT_LABEL}</span>
            </div>

            <div className="my-auto space-y-3 text-center">
              <h3 className="text-lg sm:text-2xl font-display font-bold text-theme-text-primary leading-relaxed">
                {currentCard.front}
              </h3>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs font-mono text-brand-emerald">
              <RotateCw className="w-3.5 h-3.5" />
              <span>{PageStrings.BTN_FLIP_CARD}</span>
            </div>
          </div>

          {/* ── Card Back (Answer Outline) ───────────────────────────────── */}
          <div
            className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between rounded-3xl backface-hidden bg-theme-elevated/95 border border-brand-emerald/40"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="flex items-center justify-between text-xs font-mono text-brand-emerald">
              <span className="px-2.5 py-1 rounded-full bg-brand-emerald/10 border border-brand-emerald/30">
                Talking Points
              </span>
              <span>{PageStrings.CARD_BACK_LABEL}</span>
            </div>

            <div className="my-auto overflow-y-auto max-h-48 pr-2 space-y-2 text-left text-xs sm:text-sm text-theme-text-primary leading-relaxed font-sans scrollbar-thin scrollbar-thumb-theme-border">
              <div className="whitespace-pre-wrap">{currentCard.back}</div>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-theme-text-muted">
              <span>Select rating below to advance</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Confidence Interval Rating Buttons ───────────────────────────── */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
        <button
          type="button"
          onClick={() => recordConfidence(CONFIDENCE_LEVELS.AGAIN.value)}
          className="btn btn-outline border-rose-500/40 text-rose-600 dark:text-rose-300 hover:bg-rose-500/10 rounded-xl text-xs font-medium py-2.5"
        >
          {PageStrings.BTN_AGAIN}
        </button>
        <button
          type="button"
          onClick={() => recordConfidence(CONFIDENCE_LEVELS.HARD.value)}
          className="btn btn-outline border-amber-500/40 text-amber-600 dark:text-amber-300 hover:bg-amber-500/10 rounded-xl text-xs font-medium py-2.5"
        >
          {PageStrings.BTN_HARD}
        </button>
        <button
          type="button"
          onClick={() => recordConfidence(CONFIDENCE_LEVELS.GOOD.value)}
          className="btn btn-outline border-emerald-500/40 text-emerald-600 dark:text-emerald-300 hover:bg-emerald-500/10 rounded-xl text-xs font-medium py-2.5"
        >
          {PageStrings.BTN_GOOD}
        </button>
        <button
          type="button"
          onClick={() => recordConfidence(CONFIDENCE_LEVELS.EASY.value)}
          className="btn btn-outline border-blue-500/40 text-blue-600 dark:text-blue-300 hover:bg-blue-500/10 rounded-xl text-xs font-medium py-2.5"
        >
          {PageStrings.BTN_EASY}
        </button>
      </div>
    </div>
  );
};

export default FlashcardDeck;
