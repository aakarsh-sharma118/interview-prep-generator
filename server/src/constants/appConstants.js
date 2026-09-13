/**
 * Shared Application Constants
 * Author: Aakarsh Sharma
 *
 * Status codes, categories, difficulty bounds, and time values.
 */

// ── HTTP Status Codes ───────────────────────────────────────────────────────
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
};

// ── Question Categories & Priorities ───────────────────────────────────────
export const REQUIREMENT_KINDS = ['technical', 'behavioural', 'domain'];
export const REQUIREMENT_PRIORITIES = ['must', 'nice'];
export const QUESTION_CATEGORIES = ['technical', 'behavioural', 'system-design', 'company-fit'];

// ── Quantitative Bounds & Magic Numbers ─────────────────────────────────────
export const DIFFICULTY_MIN = 1;
export const DIFFICULTY_MAX = 3;
export const DIFFICULTY_DEFAULT = 2;

// Minutes per question difficulty for deterministic schedule calculation
export const MINUTES_PER_DIFFICULTY = {
  1: 15, // Easy concept: 15 minutes
  2: 25, // Medium technical challenge: 25 minutes
  3: 40, // Hard architecture/system design: 40 minutes
};

// Minimum daily preparation allocation in minutes
export const MIN_DAILY_MINUTES = 30;

// Maximum passes allowed for coverage loop
export const MAX_COVERAGE_PASSES = 3;

// Kit Item State Management
export const ITEM_ORIGINS = {
  GENERATED: 'generated',
  EDITED: 'edited',
  MANUAL: 'manual',
};

// Batch Runner Status Codes
export const BATCH_STATUS = {
  OK: 'ok',
  FAILED: 'failed',
};

// Standard Failure Codes
export const ERROR_CODES = {
  COMPANY_UNREACHABLE: 'COMPANY_UNREACHABLE',
  INVALID_INPUT: 'INVALID_INPUT',
  LLM_GENERATION_FAILED: 'LLM_GENERATION_FAILED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
};
