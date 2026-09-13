/**
 * Frontend API Client
 * Configured Axios instance that attaches JWT auth tokens and handles API errors.
 * Author: Aakarsh Sharma
 */

import axios from 'axios';
import { envConfig, STORAGE_KEYS } from '../utils/appConstants.js';
import { logger } from '../utils/logger.js';

// Construct configured Axios instance
export const apiClient = axios.create({
  baseURL: envConfig.API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Automatically sends and receives httpOnly cookies across CORS
  timeout: 120000, // 120 seconds for deep crawler & multi-pass LLM pipeline
});

// ── Request Interceptor ─────────────────────────────────────────────────────
apiClient.interceptors.request.use(
  (config) => {
    // Read JWT authentication token from localStorage if available in browser
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    logger.error('Request interceptor rejected', error);
    return Promise.reject(error);
  }
);

// ── Response Interceptor ────────────────────────────────────────────────────
apiClient.interceptors.response.use(
  (response) => {
    // Return parsed JSON data
    return response.data;
  },
  (error) => {
    const errorResponse = error.response?.data?.error || {
      code: 'NETWORK_ERROR',
      message: error.message || 'Unable to communicate with the server.',
    };
    logger.warn('API call failed', errorResponse);
    return Promise.reject(errorResponse);
  }
);
