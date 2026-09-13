/**
 * Frontend Logger
 * Author: Aakarsh Sharma
 */

import { envConfig } from './appConstants.js';

const isProduction = envConfig.NODE_ENV === 'production';

export const logger = {
  /**
   * Logs informational messages.
   *
   * @param {string} message - Message text.
   * @param {Object} [meta={}] - Context metadata.
   */
  info: (message, meta = {}) => {
    // Only log in non-production or info levels
    if (!isProduction) {
      // Safe structured log
      console.info(`[INFO] ${message}`, Object.keys(meta).length ? meta : '');
    }
  },

  /**
   * Logs warning messages.
   *
   * @param {string} message - Warning text.
   * @param {Object} [meta={}] - Context metadata.
   */
  warn: (message, meta = {}) => {
    console.warn(`[WARN] ${message}`, Object.keys(meta).length ? meta : '');
  },

  /**
   * Logs error events.
   *
   * @param {string} message - Error description.
   * @param {Error|Object} [error=null] - Caught error object.
   */
  error: (message, error = null) => {
    console.error(`[ERROR] ${message}`, error || '');
  },

  /**
   * Logs development-only diagnostics.
   *
   * @param {string} message - Diagnostic message.
   * @param {Object} [meta={}] - Context payload.
   */
  debug: (message, meta = {}) => {
    if (!isProduction) {
      console.debug(`[DEBUG] ${message}`, Object.keys(meta).length ? meta : '');
    }
  },
};
