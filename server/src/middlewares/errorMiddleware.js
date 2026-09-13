/**
 * Error Handling Middleware
 * Author: Aakarsh Sharma
 *
 * Catches unhandled errors and returns formatted JSON responses.
 */

import { HTTP_STATUS } from '../constants/appConstants.js';
import { logger } from '../utils/logger.js';

/**
 * Centralized error-handling middleware.
 *
 * @param {Error} err - Error object.
 * @param {import('express').Request} req - Request.
 * @param {import('express').Response} res - Response.
 * @param {import('express').NextFunction} _next - Next.
 */
export const errorHandler = (err, req, res, _next) => {
  logger.error('Unhandled request exception', {
    url: req.originalUrl,
    method: req.method,
    message: err.message,
    stack: err.stack,
  });

  const statusCode = err.status || HTTP_STATUS.INTERNAL_SERVER_ERROR;
  const isProd = process.env.NODE_ENV === 'production';
  const isInternal500 = !err.status || err.status === HTTP_STATUS.INTERNAL_SERVER_ERROR;

  // Never leak internal server exception details or database diagnostics in production
  const safeMessage = (isProd && isInternal500)
    ? 'An unexpected error occurred while processing your request.'
    : (err.message || 'An unexpected error occurred while processing your request.');

  return res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || 'INTERNAL_SERVER_ERROR',
      message: safeMessage,
    },
  });
};
