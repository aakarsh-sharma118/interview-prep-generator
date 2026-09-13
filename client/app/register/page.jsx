/**
 * User Registration Page
 * Allows new users to create an account and receive a JWT token.
 * Supports light/dark themes and responsive mobile layout.
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

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setValidationError('Please complete all required fields.');
      return;
    }
    if (password.length < 6) {
      setValidationError('Password must be at least 6 characters long.');
      return;
    }

    setValidationError(null);
    const result = await register(name.trim(), email.trim(), password.trim());
    if (result.success) {
      router.push(RoutePaths.HOME);
    }
  };

  return (
    <div className="max-w-md mx-auto my-8 sm:my-14 p-6 sm:p-8 rounded-3xl bg-theme-surface/90 border border-theme-border shadow-card-light dark:shadow-card-dark backdrop-blur-xl space-y-6 transition-colors">
      <div className="space-y-2 text-center">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-brand-emerald/10 border border-brand-emerald/30 flex items-center justify-center text-brand-emerald">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-display font-bold text-theme-text-primary">{PageStrings.REGISTER_TITLE}</h1>
        <p className="text-xs text-theme-text-secondary font-sans">{PageStrings.REGISTER_SUBTITLE}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs font-mono">
        <div className="space-y-1.5">
          <label className="text-theme-text-secondary block">{PageStrings.LABEL_NAME}</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Aakarsh Sharma"
            className="w-full bg-theme-elevated/70 border border-theme-border focus:border-brand-emerald rounded-xl p-3 text-theme-text-primary focus:outline-none transition-colors"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-theme-text-secondary block">{PageStrings.LABEL_EMAIL}</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="alex@example.com"
            className="w-full bg-theme-elevated/70 border border-theme-border focus:border-brand-emerald rounded-xl p-3 text-theme-text-primary focus:outline-none transition-colors"
            disabled={isLoading}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-theme-text-secondary block">{PageStrings.LABEL_PASSWORD}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="•••••••• (Min 6 characters)"
            className="w-full bg-theme-elevated/70 border border-theme-border focus:border-brand-emerald rounded-xl p-3 text-theme-text-primary focus:outline-none transition-colors"
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
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>{PageStrings.BTN_REGISTER_SUBMIT}</span>}
          {!isLoading && <ArrowRight className="w-3.5 h-3.5" />}
        </button>
      </form>

      <div className="text-center text-xs text-theme-text-secondary pt-2 border-t border-theme-border">
        <span>{PageStrings.HAVE_ACCOUNT_PROMPT} </span>
        <Link href={RoutePaths.LOGIN} className="text-brand-indigo hover:underline font-semibold">
          {PageStrings.NAV_LOGIN}
        </Link>
      </div>
    </div>
  );
}
