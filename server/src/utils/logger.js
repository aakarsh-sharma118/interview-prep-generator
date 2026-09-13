/**
 * Logger Utility
 * Author: Aakarsh Sharma
 *
 * Configures Winston logging for standard formatted console logs.
 */

import winston from 'winston';
import { NODE_ENV } from '../config/env.js';

// ── Custom Formatters ───────────────────────────────────────────────────────
// Format timestamp and log payload into human-readable console output
const consoleFormat = winston.format.printf(({ level, message, timestamp, ...metadata }) => {
  // Format metadata object if present
  const metaString = Object.keys(metadata).length ? ` | ${JSON.stringify(metadata)}` : '';
  // Return formatted log line
  return `[${timestamp}] [${level.toUpperCase()}]: ${message}${metaString}`;
});

// ── Logger Instance Construction ───────────────────────────────────────────
export const logger = winston.createLogger({
  // Base log level dependent on current runtime environment
  level: NODE_ENV === 'production' ? 'info' : 'debug',
  // Combine timestamp and custom string formatting
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    consoleFormat
  ),
  // Default transports
  transports: [
    // Output directly to standard console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        consoleFormat
      ),
    }),
  ],
  // Prevent unhandled errors from terminating logger
  exitOnError: false,
});
