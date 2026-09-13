/**
 * User Login Page
 * Authenticates user credentials with email and password.
 * Supports light/dark themes and mobile-first responsive styling.
 * Author: Aakarsh Sharma
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../src/hooks/useAuthStore.js';
import { RoutePaths } from '../../src/utils/appConstants.js';
import { PageStrings } from '../../src/utils/pageStrings.js';

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading, error } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setValidationError('Please enter both email and password.');
      return;
    }

    setValidationError(null);
    const result = await login(email.trim(), password.trim());
    if (result.success) {
      router.push(RoutePaths.HOME);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 sm:my-14 p-6 sm:p-8 rounded-3xl bg-theme-surface/90 border border-theme-border shadow-card-light dark:shadow-card-dark backdrop-blur-xl space-y-6 transition-colors">
      <div className="space-y-2 text-center">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-indigo/10 border border-brand-indigo/30 flex items-center justify-center text-brand-indigo">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-display font-bold text-theme-text-primary">{PageStrings.LOGIN_TITLE}</h1>
        <p className="text-xs text-theme-text-secondary font-sans">{PageStrings.LOGIN_SUBTITLE}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
        <div className="space-y-1.5">
          <label className="text-theme-text-secondary block">{PageStrings.LABEL_EMAIL}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex@example.com"
            className="w-full bg-theme-elevated/70 border border-theme-border focus:border-brand-indigo rounded-xl p-3 text-theme-text-primary focus:outline-none transition-colors"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-theme-text-secondary block">{PageStrings.LABEL_PASSWORD}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            className="w-full bg-theme-elevated/70 border border-theme-border focus:border-brand-indigo rounded-xl p-3 text-theme-text-primary focus:outline-none transition-colors"
            disabled={isLoading}
          />
        </div>

        {(validationError || error) && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-300 flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{validationError || error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full btn btn-primary rounded-xl text-xs font-medium py-3 flex items-center justify-center space-x-2 shadow-sm"
        >
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{PageStrings.BTN_LOGIN_SUBMIT}</span>}
          {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
        </button>

        <div className="relative my-2">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-theme-border" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-mono">
            <span className="bg-theme-surface px-2 text-theme-text-muted">Or Quick Test</span>
          </div>
        </div>

        <button
          type="button"
          onClick={async () => {
            const res = await useAuthStore.getState().demoLogin();
            if (res?.success) router.push(RoutePaths.HOME);
          }}
          disabled={isLoading}
          className="w-full btn btn-ghost border border-theme-border hover:border-theme-border/80 rounded-xl text-xs text-theme-text-secondary hover:text-theme-text-primary font-mono py-2.5"
        >
          Instant Demo Login (1-Click)
        </button>
      </form>

      <div className="text-center text-xs text-theme-text-secondary pt-2 border-t border-theme-border">
        <span>{PageStrings.NO_ACCOUNT_PROMPT} </span>
        <Link href={RoutePaths.REGISTER} className="text-brand-emerald hover:underline font-semibold">
          {PageStrings.NAV_REGISTER}
        </Link>
      </div>
    </div>
  );
}
