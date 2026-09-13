/**
 * Rate Limiter and Retry Handler
 * Manages request pacing and exponential backoff for LLM API calls.
 * Author: Aakarsh Sharma
 */

import { logger } from '../../utils/logger.js';

/**
 * Sleeps for a designated duration in milliseconds.
 *
 * @param {number} ms - Milliseconds to sleep.
 * @returns {Promise<void>}
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Token bucket and concurrency queue protecting free-tier rate limits.
 */
class RateLimiter {
  constructor(maxRequestsPerMinute = 15, maxConcurrent = 2) {
    this.maxRequestsPerMinute = maxRequestsPerMinute;
    this.maxConcurrent = maxConcurrent;
    this.activeRequests = 0;
    this.timestamps = [];
  }

  /**
   * Waits until an execution slot becomes available.
   *
   * @returns {Promise<void>}
   */
  async acquireSlot() {
    // If running in mock provider mode, bypass rate limiting
    if (process.env.LLM_PROVIDER === 'mock' || !process.env.GEMINI_API_KEY) {
      return;
    }

    while (this.activeRequests >= this.maxConcurrent) {
      await sleep(100);
    }

    const now = Date.now();
    // Prune timestamps older than 60 seconds
    this.timestamps = this.timestamps.filter((ts) => now - ts < 60000);

    if (this.timestamps.length >= this.maxRequestsPerMinute) {
      const oldest = this.timestamps[0];
      const waitTime = Math.max(100, 60000 - (now - oldest) + 50);
      logger.warn('Rate limiter throttling request to respect LLM quotas', { waitTimeMs: waitTime });
      await sleep(waitTime);
    }

    this.timestamps.push(Date.now());
    this.activeRequests++;
  }

  /**
   * Releases an active execution slot.
   */
  releaseSlot() {
    this.activeRequests = Math.max(0, this.activeRequests - 1);
  }

  /**
   * Executes an asynchronous task with exponential jittered retry logic.
   *
   * @template T
   * @param {() => Promise<T>} taskFn - Asynchronous function to execute.
   * @param {number} [maxRetries=3] - Maximum retry attempts.
   * @param {number} [baseDelayMs=1500] - Base backoff delay.
   * @returns {Promise<T>} Task result.
   */
  async executeWithRetry(taskFn, maxRetries = 3, baseDelayMs = 1500) {
    let attempt = 0;

    while (attempt <= maxRetries) {
      await this.acquireSlot();
      try {
        const result = await taskFn();
        this.releaseSlot();
        return result;
      } catch (error) {
        this.releaseSlot();
        attempt++;

        const isRateLimit =
          error.status === 429 ||
          error.message?.includes('429') ||
          error.message?.includes('quota') ||
          error.message?.includes('RESOURCE_EXHAUSTED') ||
          error.message?.includes('rate limit');

        const isTransient = isRateLimit || error.status === 503 || error.status === 502;

        if (attempt > maxRetries || !isTransient) {
          logger.error('LLM task failed after retries or non-retriable error', {
            attempt,
            maxRetries,
            error: error.message,
          });
          throw error;
        }

        // Calculate exponential backoff with full jitter
        const backoff = Math.pow(2, attempt) * baseDelayMs;
        const jitter = Math.random() * 500;
        const totalDelay = Math.round(backoff + jitter);

        logger.warn('LLM request throttled or failed transiently, backing off', {
          attempt,
          delayMs: totalDelay,
          error: error.message,
        });

        await sleep(totalDelay);
      }
    }

    throw new Error('LLM execution exceeded retry limits.');
  }
}

// Export singleton limiter instance
export const llmRateLimiter = new RateLimiter(15, 2);
