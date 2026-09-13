/**
 * Unit Tests for Kit Store (Vitest)
 * Author: Aakarsh Sharma
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useKitStore } from '../hooks/useKitStore.js';
import { apiClient } from '../api/apiClient.js';

// Mock apiClient
vi.mock('../api/apiClient.js', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
  },
}));

describe('useKitStore', () => {
  const mockKit = {
    _id: 'kit-123',
    source: { company: 'Stripe', company_url: 'https://stripe.com' },
    role: { title: 'Full Stack Engineer', requirements: [{ id: 'r1', text: 'React' }] },
    company_brief: { summary: 'Fintech platform', what_they_do: 'Payment processing' },
    questions: [
      { id: 'q1', prompt: 'Original prompt', category: 'technical', origin: 'generated', isPinned: false },
      { id: 'q2', prompt: 'System design prompt', category: 'system-design', origin: 'generated', isPinned: false },
    ],
    schedule: {
      days_available: 2,
      days: [
        { day: 1, question_ids: ['q1'], minutes: 45 },
        { day: 2, question_ids: ['q2'], minutes: 45 },
      ],
    },
    flashcards: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    useKitStore.setState({
      activeKit: null,
      kitsList: [],
      isLoading: false,
      isGenerating: false,
      generationProgress: 0,
      currentExecutionStep: null,
      executionLogs: [],
      error: null,
      isDirty: false,
    });
  });

  it('tracks execution progress and appends crawler logs', () => {
    const store = useKitStore.getState();
    store.setExecutionProgress('CRAWLER', 'Crawling website...', 30);

    let state = useKitStore.getState();
    expect(state.currentExecutionStep).toBe('CRAWLER');
    expect(state.generationProgress).toBe(30);
    expect(state.executionLogs).toHaveLength(1);
    expect(state.executionLogs[0].message).toBe('Crawling website...');

    store.clearExecutionLogs();
    state = useKitStore.getState();
    expect(state.executionLogs).toHaveLength(0);
    expect(state.generationProgress).toBe(0);
    expect(state.currentExecutionStep).toBeNull();
  });

  it('fetches kits list successfully', async () => {
    apiClient.get.mockResolvedValueOnce({
      success: true,
      data: [mockKit],
    });

    await useKitStore.getState().fetchKitsList();
    const state = useKitStore.getState();
    expect(state.kitsList).toHaveLength(1);
    expect(state.kitsList[0]._id).toBe('kit-123');
    expect(state.isLoading).toBe(false);
  });

  it('fetches a single kit by id successfully', async () => {
    apiClient.get.mockResolvedValueOnce({
      success: true,
      data: mockKit,
    });

    await useKitStore.getState().fetchKitById('kit-123');
    const state = useKitStore.getState();
    expect(state.activeKit).toBeDefined();
    expect(state.activeKit._id).toBe('kit-123');
    expect(state.isDirty).toBe(false);
  });

  it('updates question prompt inline and marks origin as edited', () => {
    useKitStore.setState({ activeKit: JSON.parse(JSON.stringify(mockKit)) });

    useKitStore.getState().updateQuestionInline('q1', 'Updated prompt text');
    const state = useKitStore.getState();
    const q1 = state.activeKit.questions.find((q) => q.id === 'q1');

    expect(q1.prompt).toBe('Updated prompt text');
    expect(q1.origin).toBe('edited');
    expect(state.isDirty).toBe(true);
  });

  it('toggles pinned status on a question', () => {
    useKitStore.setState({ activeKit: JSON.parse(JSON.stringify(mockKit)) });

    useKitStore.getState().togglePinQuestion('q1');
    let state = useKitStore.getState();
    expect(state.activeKit.questions[0].isPinned).toBe(true);
    expect(state.isDirty).toBe(true);

    useKitStore.getState().togglePinQuestion('q1');
    state = useKitStore.getState();
    expect(state.activeKit.questions[0].isPinned).toBe(false);
  });

  it('adds custom question manually with manual origin and pinned flag', () => {
    useKitStore.setState({ activeKit: JSON.parse(JSON.stringify(mockKit)) });

    useKitStore.getState().addQuestionManual({
      prompt: 'New manual question',
      category: 'behavioural',
      difficulty: 1,
    });

    const state = useKitStore.getState();
    expect(state.activeKit.questions).toHaveLength(3);
    const added = state.activeKit.questions[2];
    expect(added.prompt).toBe('New manual question');
    expect(added.origin).toBe('manual');
    expect(added.isPinned).toBe(true);
    expect(state.isDirty).toBe(true);
  });

  it('deletes a question and cleans schedule references', () => {
    useKitStore.setState({ activeKit: JSON.parse(JSON.stringify(mockKit)) });

    useKitStore.getState().deleteQuestion('q1');
    const state = useKitStore.getState();
    expect(state.activeKit.questions).toHaveLength(1);
    expect(state.activeKit.questions[0].id).toBe('q2');

    // Verify day 1 schedule no longer contains q1
    const day1 = state.activeKit.schedule.days.find((d) => d.day === 1);
    expect(day1.question_ids).not.toContain('q1');
    expect(state.isDirty).toBe(true);
  });

  it('saves active kit modifications via apiClient.put', async () => {
    useKitStore.setState({
      activeKit: JSON.parse(JSON.stringify(mockKit)),
      isDirty: true,
    });

    apiClient.put.mockResolvedValueOnce({
      success: true,
      data: mockKit,
    });

    const result = await useKitStore.getState().saveActiveKit();
    expect(result.success).toBe(true);
    const state = useKitStore.getState();
    expect(state.isDirty).toBe(false);
  });
});
