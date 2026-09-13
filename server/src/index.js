/**
 * Express Server Entry Point
 * Author: Aakarsh Sharma
 *
 * Initializes middleware, routes, database connection, and starts the server.
 */

import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { ALLOWED_ORIGINS, PORT } from './config/env.js';
import { connectDatabase } from './connections/database.js';
import { errorHandler } from './middlewares/errorMiddleware.js';
import authRoutes from './routes/authRoutes.js';
import kitRoutes from './routes/kitRoutes.js';
import { logger } from './utils/logger.js';

const app = express();

// Security headers with strict Content Security Policy (CSP)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'data:'],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'http://localhost:3000', 'http://localhost:5000', 'https://*.googleapis.com', 'https://*.groq.com'],
        frameAncestors: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Cookie parsing for secure httpOnly tokens
app.use(cookieParser());

// CORS configuration supporting credentials and custom origins
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (curl, mobile, batch runner)
      if (!origin) return callback(null, true);
      if (ALLOWED_ORIGINS.includes(origin) || ALLOWED_ORIGINS.includes('*')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

// Body parsing with 10MB limit for job descriptions
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Healthcheck endpoint for Render / Docker probes
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/kits', kitRoutes);

// Centralized error handler
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server listening on port ${PORT}`, { port: PORT });
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error.message });
    process.exit(1);
  }
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;
