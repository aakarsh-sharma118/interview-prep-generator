/**
 * Kit Schema Validation
 * Validates generated prep kits against the specification schema using Zod.
 * Author: Aakarsh Sharma
 */

import { z } from 'zod';
import { REQUIREMENT_KINDS, REQUIREMENT_PRIORITIES, QUESTION_CATEGORIES, DIFFICULTY_MIN, DIFFICULTY_MAX } from '../constants/appConstants.js';

// ── Source Schema ───────────────────────────────────────────────────────────
export const sourceSchema = z.object({
  company: z.string().default(''),
  company_url: z.string().default(''),
  role: z.string().default(''),
  location: z.string().default(''),
  jd_chars: z.number().int().nonnegative().default(0),
  researched_at: z.string().default(() => new Date().toISOString()),
  pages_used: z.array(z.string()).default([]),
});

// ── Company Brief Schema ────────────────────────────────────────────────────
export const companyBriefSchema = z.object({
  summary: z.string().default(''),
  what_they_do: z.string().default(''),
  sources: z.array(z.string()).default([]),
});

// ── Requirement Schema ──────────────────────────────────────────────────────
export const requirementSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  kind: z.enum(REQUIREMENT_KINDS),
  priority: z.enum(REQUIREMENT_PRIORITIES),
});

// ── Role Schema ─────────────────────────────────────────────────────────────
export const roleSchema = z.object({
  title: z.string().default(''),
  seniority: z.string().default(''),
  responsibilities: z.array(z.string()).default([]),
  requirements: z.array(requirementSchema).default([]),
});

// ── Question Schema ─────────────────────────────────────────────────────────
export const questionSchema = z.object({
  id: z.string().min(1),
  requirement_ids: z.array(z.string()).default([]),
  category: z.enum(QUESTION_CATEGORIES),
  prompt: z.string().min(1),
  answer_outline: z.string().default(''),
  difficulty: z.number().int().min(DIFFICULTY_MIN).max(DIFFICULTY_MAX).default(2),
  // Optional metadata for builder state tracking
  origin: z.enum(['generated', 'edited', 'manual']).optional(),
  isPinned: z.boolean().optional(),
});

// ── Flashcard Schema ────────────────────────────────────────────────────────
export const flashcardSchema = z.object({
  id: z.string().min(1),
  front: z.string().min(1),
  back: z.string().min(1),
  requirement_ids: z.array(z.string()).default([]),
  origin: z.enum(['generated', 'edited', 'manual']).optional(),
  isPinned: z.boolean().optional(),
});

// ── Schedule Day Schema ─────────────────────────────────────────────────────
export const scheduleDaySchema = z.object({
  day: z.number().int().positive(),
  focus: z.string().default(''),
  question_ids: z.array(z.string()).default([]),
  minutes: z.number().int().nonnegative(),
});

// ── Schedule Schema ─────────────────────────────────────────────────────────
export const scheduleSchema = z.object({
  days_available: z.number().int().positive(),
  days: z.array(scheduleDaySchema),
});

// ── Coverage Schema ─────────────────────────────────────────────────────────
export const coverageSchema = z.object({
  uncovered_requirement_ids: z.array(z.string()).default([]),
  passes: z.number().int().nonnegative().default(1),
});

// ── Complete Kit Schema ────────────────────────────────────────────────────
export const kitSchema = z.object({
  source: sourceSchema,
  company_brief: companyBriefSchema,
  role: roleSchema,
  questions: z.array(questionSchema),
  flashcards: z.array(flashcardSchema),
  schedule: scheduleSchema,
  coverage: coverageSchema,
}).superRefine((data, context) => {
  // Validate referential integrity: Every question_id in schedule must exist in questions
  const questionIdSet = new Set(data.questions.map((question) => question.id));
  data.schedule.days.forEach((day, index) => {
    day.question_ids.forEach((questionId) => {
      if (!questionIdSet.has(questionId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Schedule day ${day.day} references unknown question_id "${questionId}"`,
          path: ['schedule', 'days', index, 'question_ids'],
        });
      }
    });
  });

  // Validate schedule day count strictly equals days_available
  if (data.schedule.days.length !== data.schedule.days_available) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Schedule days length (${data.schedule.days.length}) must equal days_available (${data.schedule.days_available})`,
      path: ['schedule', 'days'],
    });
  }
});

/**
 * Validates a preparation kit payload against the specification schema.
 *
 * @param {Object} kitData - Raw kit object to validate.
 * @returns {{ success: boolean, data?: Object, errors?: Array }} Validation result.
 */
export const validateKit = (kitData) => {
  // Parse through strict Zod schema
  const result = kitSchema.safeParse(kitData);
  // Return typed result format
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    errors: result.error.errors.map((error) => ({
      path: error.path.join('.'),
      message: error.message,
    })),
  };
};
