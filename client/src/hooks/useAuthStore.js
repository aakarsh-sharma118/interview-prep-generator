/**
 * Authentication Store (Zustand)
 * Manages user session state, JWT token storage, and login/logout handlers.
 * Author: Aakarsh Sharma
 */

import { create } from 'zustand';
import { apiClient } from '../api/apiClient.js';
import { ApiUrls } from '../api/apiUrls.js';
import { STORAGE_KEYS } from '../utils/appConstants.js';
import { logger } from '../utils/logger.js';

// Safe storage helper supporting SSR and test environments
const safeStorage = {
  getItem: (key) => (typeof window !== 'undefined' && window.localStorage ? localStorage.getItem(key) : null),
  setItem: (key, val) => {
    if (typeof window !== 'undefined' && window.localStorage) localStorage.setItem(key, val);
  },
  removeItem: (key) => {
    if (typeof window !== 'undefined' && window.localStorage) localStorage.removeItem(key);
  },
};

export const useAuthStore = create((set, get) => ({
  // ── State ─────────────────────────────────────────────────────────────────
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  // ── Actions ───────────────────────────────────────────────────────────────
  /**
   * Initializes auth session from localStorage on application mount.
   */
  initializeAuth: async () => {
    if (typeof window === 'undefined') return;

    try {
      // 1. First attempt to restore session via httpOnly cookie
      try {
        const profile = await apiClient.get(ApiUrls.AUTH_ME);
        if (profile.success && profile.data.user) {
          set({
            user: profile.data.user,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      } catch {
        // httpOnly cookie invalid or absent, check local state
      }

      // 2. Check fallback stored session
      const storedToken = safeStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const storedUser = safeStorage.getItem(STORAGE_KEYS.USER_DATA);

      if (storedToken && storedUser) {
        set({
          token: storedToken,
          user: JSON.parse(storedUser),
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      logger.error('Error initializing auth session', error);
      set({ isLoading: false });
    }
  },

  /**
   * Logs in with email and password.
   *
   * @param {string} email - User email.
   * @param {string} password - User password.
   */
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post(ApiUrls.AUTH_LOGIN, { email, password });
      if (response.success && response.data) {
        const { token, user } = response.data;
        safeStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        safeStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
        set({ token, user, isAuthenticated: true, isLoading: false });
        return { success: true };
      }
    } catch (err) {
      set({ isLoading: false, error: err.message || 'Login failed' });
      return { success: false, error: err.message };
    }
  },

  /**
   * Registers a new user.
   *
   * @param {string} name - Display name.
   * @param {string} email - User email.
   * @param {string} password - User password.
   */
  register: async (name, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const response = await apiClient.post(ApiUrls.AUTH_REGISTER, { name, email, password });
      if (response.success && response.data) {
        const { token, user } = response.data;
        safeStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
        safeStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
        set({ token, user, isAuthenticated: true, isLoading: false });
        return { success: true };
      }
    } catch (err) {
      set({ isLoading: false, error: err.message || 'Registration failed' });
      return { success: false, error: err.message };
    }
  },

  /**
   * Signs out current user, clears httpOnly cookie, and clears session credentials.
   */
  logout: async () => {
    try {
      await apiClient.post(ApiUrls.AUTH_LOGOUT);
    } catch {
      // Ignore network errors during logout
    }
    safeStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    safeStorage.removeItem(STORAGE_KEYS.USER_DATA);
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  /**
   * One-click demo sign-in for quick testing.
   */
  demoLogin: async () => {
    const demoEmail = 'demo@interviewprep.dev';
    const demoPassword = 'TestPassword123!';
    const loginRes = await get().login(demoEmail, demoPassword);
    if (loginRes?.success) return loginRes;

    return get().register('Demo User', demoEmail, demoPassword);
  },
}));
