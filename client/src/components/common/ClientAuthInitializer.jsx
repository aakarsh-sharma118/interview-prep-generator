/**
 * Client Auth Initializer
 * Hydrates authentication state from localStorage on application mount.
 * Author: Aakarsh Sharma
 */

'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../../hooks/useAuthStore.js';

export const ClientAuthInitializer = () => {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return null;
};

export default ClientAuthInitializer;
