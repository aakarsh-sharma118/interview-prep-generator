/**
 * Tailwind CSS & DaisyUI Configuration
 * Author: Aakarsh Sharma
 */
import daisyui from 'daisyui';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        theme: {
          base: 'var(--bg-base)',
          surface: 'var(--bg-surface)',
          elevated: 'var(--bg-surface-elevated)',
          border: 'var(--border-subtle)',
          'text-primary': 'var(--text-primary)',
          'text-secondary': 'var(--text-secondary)',
          'text-muted': 'var(--text-muted)',
        },
        background: 'var(--bg-base)',
        surface: {
          50: 'var(--bg-surface)',
          100: 'var(--bg-surface-elevated)',
          200: 'var(--bg-surface-card)',
          border: 'var(--border-subtle)',
        },
        brand: {
          emerald: '#10B981',
          indigo: '#3B82F6',
          violet: '#8B5CF6',
          amber: '#F59E0B',
          rose: '#EF4444',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Outfit', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'glow-sm': '0 0 16px -2px rgba(59, 130, 246, 0.15)',
        'glow-md': '0 0 28px -4px rgba(59, 130, 246, 0.20)',
        'card-light': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'card-dark': '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
      },
    },
  },
  plugins: [daisyui],
  daisyui: {
    themes: [
      {
        dark: {
          primary: '#3B82F6',
          secondary: '#10B981',
          accent: '#8B5CF6',
          neutral: '#151C28',
          'base-100': '#0B0F17',
          'base-200': '#151C28',
          'base-300': '#1B2433',
          info: '#38BDF8',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
        },
        light: {
          primary: '#2563EB',
          secondary: '#059669',
          accent: '#7C3AED',
          neutral: '#E2E8F0',
          'base-100': '#FFFFFF',
          'base-200': '#F8FAFC',
          'base-300': '#F1F5F9',
          info: '#0284C7',
          success: '#059669',
          warning: '#D97706',
          error: '#DC2626',
        },
      },
    ],
    darkTheme: 'dark',
    base: true,
    styled: true,
    utils: true,
  },
};
