/**
 * Interview Prep Kit Model
 * Author: Aakarsh Sharma
 *
 * Mongoose schema for structured interview prep kits.
 */

import mongoose from 'mongoose';

// ── Requirement Sub-Schema ──────────────────────────────────────────────────
const requirementSubSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    kind: { type: String, enum: ['technical', 'behavioural', 'domain'], required: true },
    priority: { type: String, enum: ['must', 'nice'], required: true },
  },
  { _id: false }
);

// ── Question Sub-Schema ─────────────────────────────────────────────────────
const questionSubSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    requirement_ids: [{ type: String }],
    category: {
      type: String,
      enum: ['technical', 'behavioural', 'system-design', 'company-fit'],
      required: true,
    },
    prompt: { type: String, required: true },
    answer_outline: { type: String, default: '' },
    difficulty: { type: Number, min: 1, max: 3, default: 2 },
    // Builder State Tracking
    origin: { type: String, enum: ['generated', 'edited', 'manual'], default: 'generated' },
    isPinned: { type: Boolean, default: false },
  },
  { _id: false }
);

// ── Flashcard Sub-Schema ────────────────────────────────────────────────────
const flashcardSubSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    front: { type: String, required: true },
    back: { type: String, required: true },
    requirement_ids: [{ type: String }],
    // Practice Mode State
    origin: { type: String, enum: ['generated', 'edited', 'manual'], default: 'generated' },
    isPinned: { type: Boolean, default: false },
    confidence: { type: Number, default: 0 }, // 0=unreviewed, 1=again, 2=hard, 3=good, 4=easy
    isCovered: { type: Boolean, default: false },
    lastPracticedAt: { type: Date, default: null },
  },
  { _id: false }
);

// ── Schedule Day Sub-Schema ─────────────────────────────────────────────────
const scheduleDaySubSchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    focus: { type: String, default: '' },
    question_ids: [{ type: String }],
    minutes: { type: Number, required: true },
  },
  { _id: false }
);

// ── Master Kit Schema ────────────────────────────────────────────────────────
const kitSchema = new mongoose.Schema(
  {
    // Scoped user ownership ID
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Source Metadata
    source: {
      company: { type: String, default: '' },
      company_url: { type: String, default: '' },
      role: { type: String, default: '' },
      location: { type: String, default: '' },
      jd_chars: { type: Number, default: 0 },
      researched_at: { type: String, default: '' },
      pages_used: [{ type: String }],
    },
    // Company Intelligence Brief
    company_brief: {
      summary: { type: String, default: '' },
      what_they_do: { type: String, default: '' },
      sources: [{ type: String }],
    },
    // Extracted Role Details
    role: {
      title: { type: String, default: '' },
      seniority: { type: String, default: '' },
      responsibilities: [{ type: String }],
      requirements: [requirementSubSchema],
    },
    // Categorized Question Bank
    questions: [questionSubSchema],
    // Spaced-Repetition Flashcards
    flashcards: [flashcardSubSchema],
    // Deterministic Preparation Schedule
    schedule: {
      days_available: { type: Number, default: 5 },
      days: [scheduleDaySubSchema],
    },
    // Deterministic Coverage Accounting
    coverage: {
      uncovered_requirement_ids: [{ type: String }],
      passes: { type: Number, default: 1 },
    },
  },
  {
    timestamps: true,
  }
);

export const Kit = mongoose.model('Kit', kitSchema);
