/**
 * JWT Authentication Middleware
 * Author: Aakarsh Sharma
 *
 * Verifies JWT bearer tokens and attaches the user session to requests.
 */

import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/env.js';
import { HTTP_STATUS } from '../constants/appConstants.js';
import { User } from '../models/User.js';
import { logger } from '../utils/logger.js';

/**
 * Express middleware validating incoming bearer tokens.
 *
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Next function.
 */
export const requireAuth = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    // 2. Reject missing tokens
    if (!token) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication token is required to access this resource.',
        },
      });
    }

    // 3. Verify token signature
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (jwtError) {
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(HTTP_STATUS.UNAUTHORIZED).json({
          success: false,
          error: {
            code: 'SESSION_EXPIRED',
            message: 'Your session has expired. Please log in again.',
          },
        });
      }
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Malformed or invalid authentication token.',
        },
      });
    }

    // 4. Retrieve user record
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'The user account associated with this session no longer exists.',
        },
      });
    }

    // Attach user record to request
    req.user = user;
    next();
  } catch (error) {
    logger.error('Unexpected error in auth middleware', { error: error.message });
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal authentication error.',
      },
    });
  }
};
