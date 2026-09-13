/**
 * Practice Store (Zustand)
 * Manages flashcard deck state, card flips, confidence ratings, and review progress.
 * Author: Aakarsh Sharma
 */

import { create } from 'zustand';

export const usePracticeStore = create((set, get) => ({
  // ── State ─────────────────────────────────────────────────────────────────
  deck: [],
  currentIndex: 0,
  isFlipped: false,
  confidenceHistory: {}, // { [cardId]: number (1=again, 2=hard, 3=good, 4=easy) }
  coveredCards: new Set(),
  isFinished: false,

  // ── Actions ───────────────────────────────────────────────────────────────
  /**
   * Initializes practice session with a set of flashcards.
   *
   * @param {Array<Object>} flashcards - Cards array from active kit.
   */
  initializeDeck: (flashcards = []) => {
    // Sort deck: prioritize cards with lower past confidence scores
    const safeCards = Array.isArray(flashcards) ? [...flashcards] : [];
    set({
      deck: safeCards,
      currentIndex: 0,
      isFlipped: false,
      isFinished: safeCards.length === 0,
      coveredCards: new Set(),
    });
  },

  /**
   * Flips the current active card to reveal the answer outline.
   */
  flipCard: () => {
    set((state) => ({ isFlipped: !state.isFlipped }));
  },

  /**
   * Records candidate confidence score on current card and advances deck.
   *
   * @param {number} confidenceLevel - 1=again, 2=hard, 3=good, 4=easy.
   */
  recordConfidence: (confidenceLevel) => {
    const { deck, currentIndex, confidenceHistory, coveredCards } = get();
    const currentCard = deck[currentIndex];
    if (!currentCard) return;

    // Update confidence record
    const updatedHistory = {
      ...confidenceHistory,
      [currentCard.id]: confidenceLevel,
    };

    // Mark card as covered
    const updatedCovered = new Set(coveredCards);
    updatedCovered.add(currentCard.id);

    const nextIndex = currentIndex + 1;
    const isFinished = nextIndex >= deck.length;

    set({
      confidenceHistory: updatedHistory,
      coveredCards: updatedCovered,
      currentIndex: nextIndex,
      isFlipped: false,
      isFinished,
    });
  },

  /**
   * Re-sorts the flashcard deck using the spaced-repetition algorithm.
   * Cards with lower confidence (e.g. Again=1, Hard=2) appear at the beginning of the queue.
   */
  restartDeckWithSpacedSort: () => {
    const { deck, confidenceHistory } = get();

    // Spaced repetition sort: Lowest confidence score first
    const sortedDeck = [...deck].sort((cardA, cardB) => {
      const scoreA = confidenceHistory[cardA.id] || 0;
      const scoreB = confidenceHistory[cardB.id] || 0;
      return scoreA - scoreB;
    });

    set({
      deck: sortedDeck,
      currentIndex: 0,
      isFlipped: false,
      isFinished: false,
      coveredCards: new Set(),
    });
  },

  /**
   * Resets practice state.
   */
  resetPractice: () => {
    set({
      deck: [],
      currentIndex: 0,
      isFlipped: false,
      isFinished: false,
      coveredCards: new Set(),
      confidenceHistory: {},
    });
  },
}));
