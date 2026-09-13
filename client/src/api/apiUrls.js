/**
 * Centralized API URL Registry
 * Author: Aakarsh Sharma
 */

export const ApiUrls = {
  // Authentication
  AUTH_REGISTER: '/api/auth/register',
  AUTH_LOGIN: '/api/auth/login',
  AUTH_LOGOUT: '/api/auth/logout',
  AUTH_ME: '/api/auth/me',

  // Preparation Kits
  KITS_GENERATE: '/api/kits/generate',
  KITS_BATCH_UPLOAD: '/api/kits/batch-upload',
  KITS_LIST: '/api/kits',
  KIT_BY_ID: (id) => `/api/kits/${id}`,
  KIT_UPDATE: (id) => `/api/kits/${id}`,
  KIT_REGENERATE_SECTION: (id) => `/api/kits/${id}/regenerate-section`,
  KIT_DELETE: (id) => `/api/kits/${id}`,
};
