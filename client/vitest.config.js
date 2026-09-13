/**
 * Vitest & Vite Configuration for Frontend Tests
 * Author: Aakarsh Sharma
 */

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}'],
  },
});
