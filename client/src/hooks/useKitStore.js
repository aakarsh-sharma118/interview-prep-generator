/**
 * Interview Kit Store (Zustand)
 * Manages loaded kit data, edit history, section regeneration, and generation progress.
 * Author: Aakarsh Sharma
 */

import { create } from 'zustand';
import { apiClient } from '../api/apiClient.js';
import { ApiUrls } from '../api/apiUrls.js';
import { logger } from '../utils/logger.js';

export const useKitStore = create((set, get) => ({
  // ── State ─────────────────────────────────────────────────────────────────
  activeKit: null,
  kitsList: [],
  isLoading: false,
  isGenerating: false,
  generationProgress: 0,
  currentExecutionStep: null,
  executionLogs: [],
  error: null,
  isDirty: false,

  // ── Generation Pipeline Execution ─────────────────────────────────────────
  /**
   * Sets live progress indicators and appends to crawler logs.
   *
   * @param {string} step - Pipeline phase.
   * @param {string} message - Status log message.
   * @param {number} percent - Estimated completion percentage (0-100).
   */
  setExecutionProgress: (step, message, percent) => {
    const timestamp = new Date().toLocaleTimeString();
    set((state) => ({
      currentExecutionStep: step,
      generationProgress: percent,
      executionLogs: [...state.executionLogs, { timestamp, step, message }],
    }));
  },

  /**
   * Clears live execution logs.
   */
  clearExecutionLogs: () => {
    set({ executionLogs: [], generationProgress: 0, currentExecutionStep: null });
  },

  /**
   * Initiates kit generation from job description text and company URL.
   *
   * @param {Object} params - Input parameters.
   * @param {string} params.jdText - Job description.
   * @param {string} params.companyUrl - Company address.
   * @param {number} params.daysAvailable - Preparation days.
   */
  generateKit: async ({ jdText, companyUrl, daysAvailable }) => {
    set({ isGenerating: true, error: null, executionLogs: [] });

    // Stream simulated visual progress increments to demonstrate crawler movement
    get().setExecutionProgress('CRAWLER', `Connecting to ${companyUrl}... crawling homepage`, 20);

    try {
      const response = await apiClient.post(ApiUrls.KITS_GENERATE, {
        jdText,
        companyUrl,
        daysAvailable,
      });

      if (response.success && response.data) {
        get().setExecutionProgress('COMPLETE', 'Preparation kit generated and validated.', 100);
        set({ activeKit: response.data, isGenerating: false });
        return { success: true, kit: response.data };
      }
    } catch (err) {
      logger.error('Kit generation failed', err);
      set({ isGenerating: false, error: err.message || 'Generation failed' });
      return { success: false, error: err.message };
    }
  },

  // ── Kit Retrieval & Listing ───────────────────────────────────────────────
  /**
   * Fetches all kits owned by authenticated user.
   */
  fetchKitsList: async () => {
    set({ isLoading: true });
    try {
      const response = await apiClient.get(ApiUrls.KITS_LIST);
      if (response.success && response.data) {
        set({ kitsList: response.data, isLoading: false });
      }
    } catch (err) {
      set({ isLoading: false, error: err.message });
    }
  },

  /**
   * Loads specific kit by ID.
   *
   * @param {string} kitId - Kit identifier.
   */
  fetchKitById: async (kitId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.get(ApiUrls.KIT_BY_ID(kitId));
      if (response.success && response.data) {
        set({ activeKit: response.data, isLoading: false, isDirty: false });
      }
    } catch (err) {
      set({ isLoading: false, error: err.message });
    }
  },

  // ── Inline Editing & Builder Actions ─────────────────────────────────────
  /**
   * Updates question prompt inline. Marks origin as 'edited' to protect from regeneration.
   *
   * @param {string} questionId - Question identifier.
   * @param {string} newPrompt - Updated prompt text.
   */
  updateQuestionInline: (questionId, newPrompt) => {
    set((state) => {
      if (!state.activeKit) return {};
      const updatedQuestions = state.activeKit.questions.map((q) =>
        q.id === questionId ? { ...q, prompt: newPrompt, origin: 'edited' } : q
      );
      return {
        activeKit: { ...state.activeKit, questions: updatedQuestions },
        isDirty: true,
      };
    });
  },

  /**
   * Updates answer outline for a question. Marks origin as 'edited'.
   *
   * @param {string} questionId - Question identifier.
   * @param {string} newOutline - Updated outline text.
   */
  updateAnswerOutlineInline: (questionId, newOutline) => {
    set((state) => {
      if (!state.activeKit) return {};
      const updatedQuestions = state.activeKit.questions.map((q) =>
        q.id === questionId ? { ...q, answer_outline: newOutline, origin: 'edited' } : q
      );
      return {
        activeKit: { ...state.activeKit, questions: updatedQuestions },
        isDirty: true,
      };
    });
  },

  /**
   * Toggles pinned protection status on a question.
   *
   * @param {string} questionId - Question identifier.
   */
  togglePinQuestion: (questionId) => {
    set((state) => {
      if (!state.activeKit) return {};
      const updatedQuestions = state.activeKit.questions.map((q) =>
        q.id === questionId ? { ...q, isPinned: !q.isPinned } : q
      );
      return {
        activeKit: { ...state.activeKit, questions: updatedQuestions },
        isDirty: true,
      };
    });
  },

  /**
   * Adds a new question manually. Marked as 'manual'.
   *
   * @param {Object} newQuestion - Question object.
   */
  addQuestionManual: (newQuestion) => {
    set((state) => {
      if (!state.activeKit) return {};
      const questionId = `custom-q-${Date.now()}`;
      const questionToAdd = {
        id: questionId,
        requirement_ids: newQuestion.requirement_ids || ['r1'],
        category: newQuestion.category || 'technical',
        prompt: newQuestion.prompt || 'Custom technical interview question',
        answer_outline: newQuestion.answer_outline || '',
        difficulty: newQuestion.difficulty || 2,
        origin: 'manual',
        isPinned: true,
      };
      return {
        activeKit: {
          ...state.activeKit,
          questions: [...state.activeKit.questions, questionToAdd],
        },
        isDirty: true,
      };
    });
  },

  /**
   * Deletes a question from the kit.
   *
   * @param {string} questionId - Question identifier.
   */
  deleteQuestion: (questionId) => {
    set((state) => {
      if (!state.activeKit) return {};
      const updatedQuestions = state.activeKit.questions.filter((q) => q.id !== questionId);
      // Clean schedule references
      const updatedScheduleDays = state.activeKit.schedule.days.map((day) => ({
        ...day,
        question_ids: day.question_ids.filter((id) => id !== questionId),
      }));
      return {
        activeKit: {
          ...state.activeKit,
          questions: updatedQuestions,
          schedule: {
            ...state.activeKit.schedule,
            days: updatedScheduleDays,
          },
        },
        isDirty: true,
      };
    });
  },

  /**
   * Moves question to a different category.
   *
   * @param {string} questionId - Question identifier.
   * @param {string} targetCategory - New category name.
   */
  moveQuestionCategory: (questionId, targetCategory) => {
    set((state) => {
      if (!state.activeKit) return {};
      const updatedQuestions = state.activeKit.questions.map((q) =>
        q.id === questionId ? { ...q, category: targetCategory, origin: 'edited' } : q
      );
      return {
        activeKit: { ...state.activeKit, questions: updatedQuestions },
        isDirty: true,
      };
    });
  },

  /**
   * Updates company brief fields inline.
   *
   * @param {Object} briefUpdates - Updates to summary or what_they_do.
   */
  updateCompanyBriefInline: (briefUpdates) => {
    set((state) => {
      if (!state.activeKit) return {};
      return {
        activeKit: {
          ...state.activeKit,
          company_brief: { ...state.activeKit.company_brief, ...briefUpdates },
        },
        isDirty: true,
      };
    });
  },

  /**
   * Regenerates a single section via the backend endpoint while preserving edits.
   *
   * @param {string} section - 'company_brief' | 'schedule' | 'category'
   * @param {string} [categoryName] - Optional category identifier
   */
  regenerateSection: async (section, categoryName) => {
    const kit = get().activeKit;
    if (!kit) return;

    set({ isLoading: true });
    try {
      const response = await apiClient.post(ApiUrls.KIT_REGENERATE_SECTION(kit._id), {
        section,
        categoryName,
      });

      if (response.success && response.data) {
        set({ activeKit: response.data, isLoading: false, isDirty: false });
        return { success: true };
      }
    } catch (err) {
      set({ isLoading: false, error: err.message });
      return { success: false, error: err.message };
    }
  },

  /**
   * Saves active kit modifications to the backend database.
   */
  saveActiveKit: async () => {
    const kit = get().activeKit;
    if (!kit) return;

    try {
      const response = await apiClient.put(ApiUrls.KIT_UPDATE(kit._id), kit);
      if (response.success) {
        set({ isDirty: false });
        return { success: true };
      }
    } catch (err) {
      logger.error('Failed to save kit changes', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Deletes a preparation kit by ID and updates local state.
   *
   * @param {string} kitId - Kit identifier to delete.
   * @returns {Promise<{ success: boolean, error?: string }>}
   */
  deleteKit: async (kitId) => {
    try {
      const response = await apiClient.delete(ApiUrls.KIT_DELETE(kitId));
      if (response.success) {
        set((state) => ({
          kitsList: state.kitsList.filter((k) => k._id !== kitId),
          activeKit: state.activeKit?._id === kitId ? null : state.activeKit,
        }));
        return { success: true };
      }
      return { success: false, error: response.error?.message || 'Delete failed' };
    } catch (err) {
      logger.error('Failed to delete preparation kit', err);
      return { success: false, error: err.message || 'Failed to delete preparation kit' };
    }
  },
}));
