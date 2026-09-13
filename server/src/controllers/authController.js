/**
 * Authentication Controller
 * Author: Aakarsh Sharma
 *
 * Handles signup, login, and active user session retrieval.
 */

import jwt from 'jsonwebtoken';
import { JWT_SECRET, JWT_EXPIRES_IN } from '../config/env.js';
import { HTTP_STATUS } from '../constants/appConstants.js';
import { User } from '../models/User.js';
import { logger } from '../utils/logger.js';

/**
 * Signs a JSON Web Token for a specific user ID.
 *
 * @param {string} userId - User identifier.
 * @returns {string} Encrypted JWT string.
 */
const signToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

/**
 * Registers a new user account.
 *
 * @param {import('express').Request} req - Request.
 * @param {import('express').Response} res - Response.
 */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate inputs
    if (!name || !email || !password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Name, email, and password are required.' },
      });
    }

    if (password.length < 6) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: { code: 'WEAK_PASSWORD', message: 'Password must be at least 6 characters long.' },
      });
    }

    // Check existing email
    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(HTTP_STATUS.CONFLICT).json({
        success: false,
        error: { code: 'USER_EXISTS', message: 'An account with this email address already exists.' },
      });
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
    });

    const token = signToken(user._id);

    // Set secure httpOnly cookie
    res.cookie('token', token, COOKIE_OPTIONS);

    logger.info('New user registered successfully', { userId: user._id, email: user.email });

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    logger.error('Registration failed', { error: error.message });
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Registration failed due to an internal server error.' },
    });
  }
};

/**
 * Logs in an existing user.
 *
 * @param {import('express').Request} req - Request.
 * @param {import('express').Response} res - Response.
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Email and password are required.' },
      });
    }

    // Retrieve user including password hash
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
      });
    }

    // Compare bcrypt password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({
        success: false,
        error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password.' },
      });
    }

    const token = signToken(user._id);

    // Set secure httpOnly cookie
    res.cookie('token', token, COOKIE_OPTIONS);

    logger.info('User logged in successfully', { userId: user._id, email: user.email });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    logger.error('Login failed', { error: error.message });
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Login failed due to an internal server error.' },
    });
  }
};

/**
 * Logs out user by clearing the httpOnly authentication cookie.
 *
 * @param {import('express').Request} req - Request.
 * @param {import('express').Response} res - Response.
 */
export const logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  });

  return res.status(HTTP_STATUS.OK).json({
    success: true,
    message: 'Logged out successfully.',
  });
};

/**
 * Retrieves the currently authenticated user's profile.
 *
 * @param {import('express').Request} req - Request.
 * @param {import('express').Response} res - Response.
 */
export const getMe = async (req, res) => {
  return res.status(HTTP_STATUS.OK).json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
      },
    },
  });
};
