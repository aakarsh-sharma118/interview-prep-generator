/**
 * Root Application Layout
 * Provides navigation, client auth session hydration, light/dark theme context,
 * font optimization, and comprehensive SEO structured metadata.
 * Author: Aakarsh Sharma
 */

import React from 'react';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';
import { Navbar } from '../src/components/common/Navbar.jsx';
import { ClientAuthInitializer } from '../src/components/common/ClientAuthInitializer.jsx';
import { ThemeProvider } from '../src/context/ThemeContext.jsx';
import { PageStrings } from '../src/utils/pageStrings.js';

// ── Google Font Optimization (Zero Layout Shift) ────────────────────────────
const fontSans = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const fontDisplay = Outfit({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

// ── Comprehensive SEO Metadata ──────────────────────────────────────────────
export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://prepkit.dev'),
  title: {
    default: `${PageStrings.BRAND_NAME} | Intelligent Interview Preparation`,
    template: `%s | ${PageStrings.BRAND_NAME}`,
  },
  description: PageStrings.HERO_SUBTITLE,
  keywords: [
    'interview preparation',
    'technical interview',
    'coding questions',
    'system design interview',
    'behavioral questions',
    'study schedule',
    'job description analyzer',
    'interview flashcards',
  ],
  authors: [{ name: PageStrings.AUTHOR_NAME, url: 'https://github.com/aakarsh-sharma118' }],
  creator: PageStrings.AUTHOR_NAME,
  openGraph: {
    title: `${PageStrings.BRAND_NAME} | Intelligent Interview Preparation`,
    description: PageStrings.HERO_SUBTITLE,
    url: '/',
    siteName: PageStrings.BRAND_NAME,
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: PageStrings.BRAND_NAME,
    description: PageStrings.HERO_SUBTITLE,
    creator: '@aakarsh_sharma',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// Anti-FOUC inline script: sets initial theme class before DOM renders
const themeInitScript = `
  (function() {
    try {
      var saved = localStorage.getItem('prepkit_theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      var theme = saved || (prefersDark ? 'dark' : 'light');
      document.documentElement.classList.remove('dark', 'light');
      document.documentElement.classList.add(theme);
      document.documentElement.setAttribute('data-theme', theme);
    } catch(e) {}
  })();
`;

// JSON-LD Structured Data
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'AI Interview Prep Kit',
  url: 'https://prepkit.dev',
  description: PageStrings.HERO_SUBTITLE,
  applicationCategory: 'EducationalApplication',
  operatingSystem: 'All',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  author: {
    '@type': 'Person',
    name: 'Aakarsh Sharma',
    url: 'https://github.com/aakarsh-sharma118',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${fontSans.variable} ${fontDisplay.variable} dark`}>
      <head>
        <link rel="dns-prefetch" href="http://localhost:5000" />
        <link rel="preconnect" href="http://localhost:5000" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-theme-base font-sans antialiased text-theme-text-primary selection:bg-brand-indigo/30 selection:text-brand-indigo flex flex-col subtle-grid relative transition-colors duration-200">
        <ThemeProvider>
          {/* Ambient Lighting Gradient */}
          <div className="pointer-events-none fixed inset-0 z-0 flex justify-center overflow-hidden">
            <div className="h-[28rem] w-[56rem] -translate-y-1/2 rounded-full bg-blue-500/[0.04] dark:bg-blue-500/[0.08] blur-[130px]" />
          </div>

          {/* Client-side Auth Hydration */}
          <ClientAuthInitializer />

          {/* Navigation Bar */}
          <Navbar />

          {/* Main Viewport Container */}
          <main className="relative z-10 flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
            {children}
          </main>

          {/* Minimalist Semantic Footer */}
          <footer className="border-t border-theme-border py-6 px-4 text-center text-xs font-mono text-theme-text-muted">
            <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
              <p>
                {PageStrings.BRAND_NAME} • Developed by{' '}
                <a
                  href="https://github.com/aakarsh-sharma118"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-indigo transition-colors underline decoration-dotted"
                >
                  {PageStrings.AUTHOR_NAME}
                </a>
              </p>
              <div className="flex items-center space-x-4 text-[11px]">
                <span>Deterministic Scheduling</span>
                <span>•</span>
                <span>Requirement Verification</span>
              </div>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
