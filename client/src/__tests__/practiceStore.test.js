/**
 * Unit Tests for Practice Store (Vitest)
 * Author: Aakarsh Sharma
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { usePracticeStore } from '../hooks/usePracticeStore.js';

describe('usePracticeStore', () => {
  const sampleCards = [
    { id: 'c1', prompt: 'Explain virtual DOM', outline: ['In-memory representation', 'Reconciliation'] },
    { id: 'c2', prompt: 'Difference between let and const', outline: ['Reassignment rules', 'Block scoping'] },
    { id: 'c3', prompt: 'What is CORS?', outline: ['Cross-origin resource sharing', 'Preflight OPTIONS'] },
  ];

  beforeEach(() => {
    usePracticeStore.getState().resetPractice();
  });

  it('initializes deck correctly with provided flashcards', () => {
    const store = usePracticeStore.getState();
    store.initializeDeck(sampleCards);

    const state = usePracticeStore.getState();
    expect(state.deck.length).toBe(3);
    expect(state.currentIndex).toBe(0);
    expect(state.isFlipped).toBe(false);
    expect(state.isFinished).toBe(false);
  });

  it('toggles isFlipped state when flipCard is called', () => {
    const store = usePracticeStore.getState();
    store.initializeDeck(sampleCards);

    expect(usePracticeStore.getState().isFlipped).toBe(false);
    store.flipCard();
    expect(usePracticeStore.getState().isFlipped).toBe(true);
    store.flipCard();
    expect(usePracticeStore.getState().isFlipped).toBe(false);
  });

  it('records confidence rating and advances through the deck', () => {
    const store = usePracticeStore.getState();
    store.initializeDeck(sampleCards);

    // Card 1: rating 4 (Easy)
    store.recordConfidence(4);
    let state = usePracticeStore.getState();
    expect(state.currentIndex).toBe(1);
    expect(state.confidenceHistory['c1']).toBe(4);
    expect(state.coveredCards.has('c1')).toBe(true);
    expect(state.isFinished).toBe(false);

    // Card 2: rating 2 (Hard)
    store.recordConfidence(2);
    state = usePracticeStore.getState();
    expect(state.currentIndex).toBe(2);
    expect(state.confidenceHistory['c2']).toBe(2);

    // Card 3: rating 3 (Good) -> Finishes deck
    store.recordConfidence(3);
    state = usePracticeStore.getState();
    expect(state.isFinished).toBe(true);
  });

  it('resets practice deck cleanly', () => {
    const store = usePracticeStore.getState();
    store.initializeDeck(sampleCards);
    store.recordConfidence(3);
    store.resetPractice();

    const state = usePracticeStore.getState();
    expect(state.currentIndex).toBe(0);
    expect(state.isFlipped).toBe(false);
    expect(state.isFinished).toBe(false);
    expect(state.deck.length).toBe(0);
  });
});
