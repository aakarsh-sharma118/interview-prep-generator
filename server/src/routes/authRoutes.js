/**
 * Authentication Routes
 * Endpoints for register, login, and profile fetching.
 * Author: Aakarsh Sharma
 */

import { Router } from 'express';
import { register, login, logout, getMe } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// ── Public Routes ───────────────────────────────────────────────────────────
// Register a new user
router.post('/register', register);

// Authenticate user credentials
router.post('/login', login);

// Clear authentication session
router.post('/logout', logout);

// ── Protected Routes ────────────────────────────────────────────────────────
// Retrieve authenticated profile
router.get('/me', requireAuth, getMe);

export default router;
