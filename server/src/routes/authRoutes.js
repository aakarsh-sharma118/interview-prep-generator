/**
 * Authentication Routes
 * Endpoints for register, login, and profile fetching.
 * Author: Aakarsh Sharma
 */

import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { requireAuth } from '../middlewares/authMiddleware.js';

const router = Router();

// ── Public Routes ───────────────────────────────────────────────────────────
// Register a new user
router.post('/register', register);

// Authenticate user credentials
router.post('/login', login);

// ── Protected Routes ────────────────────────────────────────────────────────
// Retrieve authenticated profile
router.get('/me', requireAuth, getMe);

export default router;
