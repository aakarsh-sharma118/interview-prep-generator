/**
 * Environment Configuration
 * Author: Aakarsh Sharma
 *
 * Central module for reading environment variables with fallback defaults.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// ── Environment Resolution ──────────────────────────────────────────────────
// Resolve directory path for ECMAScript module context
const currentFilePath = fileURLToPath(import.meta.url);
// Extract parent directory
const currentDirPath = path.dirname(currentFilePath);

// Load root or server-level .env file
dotenv.config({ path: path.resolve(currentDirPath, '../../../.env') });
dotenv.config({ path: path.resolve(currentDirPath, '../../.env') });

// ── Network & Server Settings ───────────────────────────────────────────────
// Port on which the Express HTTP server listens
export const PORT = parseInt(process.env.PORT || '5000', 10);

// Current runtime environment node mode (development, production, test)
export const NODE_ENV = process.env.NODE_ENV || 'development';

// Front-end application URL for CORS and redirect resolution
const rawFrontEnd = (process.env.FRONT_END_URL || 'http://localhost:3000').replace(/\/+$/, '');
export const FRONT_END_URL = rawFrontEnd.startsWith('http://') || rawFrontEnd.startsWith('https://')
  ? rawFrontEnd
  : `https://${rawFrontEnd}`;

// Public API Base URL string
const rawPublicApi = (process.env.PUBLIC_API_BASE_URL || 'http://localhost:5000').replace(/\/+$/, '');
export const PUBLIC_API_BASE_URL = rawPublicApi.startsWith('http://') || rawPublicApi.startsWith('https://')
  ? rawPublicApi
  : `https://${rawPublicApi}`;

// Whitelisted origins for Cross-Origin Resource Sharing
const configuredOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const normalizedOrigins = configuredOrigins.flatMap((origin) => {
  if (origin === '*' || origin.startsWith('http://') || origin.startsWith('https://')) return [origin];
  return [`https://${origin}`, `http://${origin}`];
});

if (!normalizedOrigins.includes(FRONT_END_URL)) {
  normalizedOrigins.push(FRONT_END_URL);
}

export const ALLOWED_ORIGINS = normalizedOrigins;

// ── Persistence & Database Settings ─────────────────────────────────────────
// MongoDB connection URI; when empty in non-production, an in-memory instance starts automatically
export const MONGODB_URI = process.env.MONGODB_URI || '';

// ── Security & Authentication Settings ──────────────────────────────────────
// Secret key used to sign and verify JSON Web Tokens
export const JWT_SECRET = process.env.JWT_SECRET || 'dev_jwt_secret_key_aakarsh_sharma_2026';

// Expiration time window for generated authentication tokens
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// ── LLM Service Settings ────────────────────────────────────────────────────
// Selected AI model provider identifier (gemini | groq | openai | mock)
export const LLM_PROVIDER = process.env.LLM_PROVIDER || 'gemini';

// Google Gemini API secret key and model configuration
export const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
export const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

// Groq API secret key
export const GROQ_API_KEY = process.env.GROQ_API_KEY || '';

// OpenAI compatible API secret key
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// ── Crawler & SSRF Safeguards ───────────────────────────────────────────────
// Allow local and private IP addresses (e.g., localhost:8099 for batch evaluation testing)
export const ALLOW_LOCAL_URLS = process.env.ALLOW_LOCAL_URLS === 'true' || NODE_ENV !== 'production';

// HTTP request timeout limit for page crawls in milliseconds
export const CRAWLER_TIMEOUT_MS = parseInt(process.env.CRAWLER_TIMEOUT_MS || '5000', 10);

// Maximum number of internal subpages crawled per company
export const CRAWLER_MAX_PAGES = parseInt(process.env.CRAWLER_MAX_PAGES || '4', 10);
