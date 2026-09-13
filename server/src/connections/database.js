/**
 * Database Connection Manager
 * Author: Aakarsh Sharma
 *
 * Connects to MongoDB via Mongoose, falling back to an in-memory
 * database for clean local runs if no connection string is provided.
 */

import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { MONGODB_URI, NODE_ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';

let memoryServer = null;

/**
 * Initializes database connection with graceful fallback.
 *
 * @returns {Promise<mongoose.Connection>}
 */
export const connectDatabase = async () => {
  try {
    let connectionUri = MONGODB_URI;

    // If no URI specified or running in test mode, launch embedded in-memory server
    if (!connectionUri || NODE_ENV === 'test') {
      logger.info('No external MONGODB_URI provided. Initializing in-memory MongoDB instance...');
      memoryServer = await MongoMemoryServer.create();
      connectionUri = memoryServer.getUri();
      logger.info('In-memory MongoDB initialized successfully', { uri: connectionUri });
    }

    // Connect via Mongoose
    await mongoose.connect(connectionUri);
    logger.info('Database connected successfully', { host: mongoose.connection.host });

    return mongoose.connection;
  } catch (error) {
    logger.error('Failed to establish database connection', { error: error.message });
    throw error;
  }
};

/**
 * Disconnects and cleans up database connections.
 *
 * @returns {Promise<void>}
 */
export const disconnectDatabase = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
      memoryServer = null;
    }
    logger.info('Database disconnected cleanly');
  } catch (error) {
    logger.error('Error disconnecting database', { error: error.message });
  }
};
