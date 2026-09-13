/**
 * Frontend Constants and Route Definitions
 * Author: Aakarsh Sharma
 */

// ── Centralized Environment Configuration ───────────────────────────────────
const rawApiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000';
const normalizedApiUrl =
  rawApiUrl.startsWith('http://') || rawApiUrl.startsWith('https://')
    ? rawApiUrl
    : `https://${rawApiUrl}`;

export const envConfig = {
  // Public API Base URL string
  API_BASE_URL: normalizedApiUrl,
  // App environment mode
  NODE_ENV: process.env.NODE_ENV || 'development',
};

// ── Application Route Paths ─────────────────────────────────────────────────
export const RoutePaths = {
  HOME: '/',
  KITS: '/kits',
  KIT_DETAIL: (id) => `/kits/${id}`,
  KIT_PRACTICE: (id) => `/kits/${id}/practice`,
  LOGIN: '/login',
  REGISTER: '/register',
};

// ── Difficulty Metadata (1 to 3) ────────────────────────────────
export const DIFFICULTY_CONFIG = {
  1: {
    label: 'Foundational',
    badgeClass: 'badge-success text-emerald-300 bg-emerald-950/60 border-emerald-800/40',
    color: '#10B981',
  },
  2: {
    label: 'Applied / Senior',
    badgeClass: 'badge-warning text-amber-300 bg-amber-950/60 border-amber-800/40',
    color: '#F59E0B',
  },
  3: {
    label: 'Hard / Architectural',
    badgeClass: 'badge-error text-rose-300 bg-rose-950/60 border-rose-800/40',
    color: '#EF4444',
  },
};

// ── Question Categories ─────────────────────────────────────────────────────
export const QUESTION_CATEGORIES = [
  { id: 'technical', label: 'Technical Depth', icon: 'Code' },
  { id: 'system-design', label: 'System Architecture', icon: 'Cpu' },
  { id: 'behavioural', label: 'Behavioral & Leadership', icon: 'Users' },
  { id: 'company-fit', label: 'Company Fit & Culture', icon: 'Building' },
];

// ── Flashcard Confidence Levels (Practice Mode) ───────────────────
export const CONFIDENCE_LEVELS = {
  AGAIN: { value: 1, label: 'Again', color: 'btn-error', badge: 'bg-rose-900/60 text-rose-300' },
  HARD: { value: 2, label: 'Hard', color: 'btn-warning', badge: 'bg-amber-900/60 text-amber-300' },
  GOOD: { value: 3, label: 'Good', color: 'btn-success', badge: 'bg-emerald-900/60 text-emerald-300' },
  EASY: { value: 4, label: 'Easy', color: 'btn-info', badge: 'bg-blue-900/60 text-blue-300' },
};

// ── Storage Keys ────────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'prepkit_auth_token',
  USER_DATA: 'prepkit_user_data',
  THEME_MODE: 'prepkit_theme_mode',
};
