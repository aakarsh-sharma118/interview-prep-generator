/**
 * Navigation Bar Component
 * Displays brand logo, navigation links, user profile, theme toggle, and mobile menu.
 * Author: Aakarsh Sharma
 */

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Sparkles,
  User as UserIcon,
  LogOut,
  PlusCircle,
  LayoutDashboard,
  Home as HomeIcon,
  Menu,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../hooks/useAuthStore.js';
import { ThemeToggle } from './ThemeToggle.jsx';
import { RoutePaths } from '../../utils/appConstants.js';
import { PageStrings } from '../../utils/pageStrings.js';

export const Navbar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleLogout = async () => {
    closeMobileMenu();
    await logout();
    router.push(RoutePaths.HOME);
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-theme-border bg-theme-surface/85 backdrop-blur-xl transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* ── Brand Logo & Identity ────────────────────────────────────────── */}
        <Link href={RoutePaths.HOME} prefetch={true} className="flex items-center space-x-2.5 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-indigo to-brand-emerald p-0.5 shadow-lg shadow-brand-indigo/20">
            <div className="w-full h-full bg-theme-surface rounded-[10px] flex items-center justify-center transition-colors">
              <Sparkles className="w-4 h-4 text-brand-emerald group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-display font-bold text-sm text-theme-text-primary tracking-tight">
              {PageStrings.BRAND_NAME}
            </span>
            <span className="text-[10px] font-mono text-theme-text-muted">by {PageStrings.AUTHOR_NAME}</span>
          </div>
        </Link>

        {/* ── Desktop Navigation ───────────────────────────────────────────── */}
        <nav className="hidden md:flex items-center space-x-3">
          <Link
            href={RoutePaths.HOME}
            prefetch={true}
            className={`text-xs font-mono px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              pathname === RoutePaths.HOME
                ? 'bg-brand-indigo/10 text-brand-indigo font-semibold'
                : 'text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-elevated'
            }`}
          >
            <HomeIcon className="w-3.5 h-3.5" />
            <span>{PageStrings.NAV_HOME}</span>
          </Link>

          {isAuthenticated ? (
            <>
              <Link
                href={RoutePaths.KITS}
                prefetch={true}
                className={`text-xs font-mono px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                  pathname === RoutePaths.KITS
                    ? 'bg-brand-indigo/10 text-brand-indigo font-semibold'
                    : 'text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-elevated'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>{PageStrings.NAV_DASHBOARD}</span>
              </Link>

              <Link
                href={RoutePaths.HOME}
                prefetch={true}
                className="btn btn-sm btn-primary rounded-xl text-xs font-medium flex items-center gap-1.5"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{PageStrings.NAV_NEW_KIT}</span>
              </Link>

              {/* Theme Toggle Button */}
              <ThemeToggle />

              {/* User Avatar & Logout */}
              <div className="flex items-center space-x-2 pl-2 border-l border-theme-border">
                <div className="w-7 h-7 rounded-full bg-theme-elevated border border-theme-border flex items-center justify-center text-xs font-mono text-brand-emerald">
                  {user?.name ? user.name[0].toUpperCase() : <UserIcon className="w-3.5 h-3.5" />}
                </div>
                <button
                  type="button"
                  aria-label={PageStrings.NAV_LOGOUT}
                  onClick={handleLogout}
                  title={PageStrings.NAV_LOGOUT}
                  className="p-1.5 rounded-lg text-theme-text-muted hover:text-rose-500 hover:bg-theme-elevated transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              <ThemeToggle />
              <Link
                href={RoutePaths.LOGIN}
                prefetch={true}
                className="btn btn-sm btn-ghost text-xs font-mono text-theme-text-secondary hover:text-theme-text-primary"
              >
                {PageStrings.NAV_LOGIN}
              </Link>
              <Link
                href={RoutePaths.REGISTER}
                prefetch={true}
                className="btn btn-sm btn-primary rounded-xl text-xs font-medium"
              >
                {PageStrings.NAV_REGISTER}
              </Link>
            </div>
          )}
        </nav>

        {/* ── Mobile Controls (Theme Toggle + Hamburger) ───────────────────── */}
        <div className="flex items-center space-x-2 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            className="p-2 rounded-xl border border-theme-border bg-theme-surface text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-elevated transition-colors"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── Mobile Navigation Dropdown Sheet ──────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-theme-border bg-theme-surface px-4 py-4 space-y-3 shadow-xl">
          {isAuthenticated ? (
            <>
              <div className="flex items-center space-x-3 pb-3 border-b border-theme-border">
                <div className="w-8 h-8 rounded-full bg-theme-elevated border border-theme-border flex items-center justify-center text-xs font-mono text-brand-emerald">
                  {user?.name ? user.name[0].toUpperCase() : <UserIcon className="w-4 h-4" />}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-theme-text-primary">{user?.name || 'User'}</span>
                  <span className="text-[10px] font-mono text-theme-text-muted">{user?.email}</span>
                </div>
              </div>

              <div className="flex flex-col space-y-1">
                <Link
                  href={RoutePaths.HOME}
                  prefetch={true}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-elevated transition-colors"
                >
                  <HomeIcon className="w-4 h-4 text-brand-indigo" />
                  <span>{PageStrings.NAV_HOME}</span>
                </Link>

                <Link
                  href={RoutePaths.KITS}
                  prefetch={true}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono text-theme-text-secondary hover:text-theme-text-primary hover:bg-theme-elevated transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-brand-indigo" />
                  <span>{PageStrings.NAV_DASHBOARD}</span>
                </Link>

                <Link
                  href={RoutePaths.HOME}
                  prefetch={true}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-brand-indigo hover:bg-brand-indigo/10 transition-colors"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{PageStrings.NAV_NEW_KIT}</span>
                </Link>
              </div>

              <div className="pt-2 border-t border-theme-border">
                <button
                  type="button"
                  aria-label={PageStrings.NAV_LOGOUT}
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono text-rose-500 hover:bg-rose-500/10 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{PageStrings.NAV_LOGOUT}</span>
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col space-y-2 pt-1">
              <Link
                href={RoutePaths.HOME}
                prefetch={true}
                onClick={closeMobileMenu}
                className="w-full btn btn-sm btn-ghost text-xs font-mono text-theme-text-secondary justify-start px-3"
              >
                <HomeIcon className="w-4 h-4 mr-2 text-brand-indigo" />
                <span>{PageStrings.NAV_HOME}</span>
              </Link>
              <Link
                href={RoutePaths.LOGIN}
                prefetch={true}
                onClick={closeMobileMenu}
                className="w-full btn btn-sm btn-ghost text-xs font-mono text-theme-text-primary justify-center"
              >
                {PageStrings.NAV_LOGIN}
              </Link>
              <Link
                href={RoutePaths.REGISTER}
                prefetch={true}
                onClick={closeMobileMenu}
                className="w-full btn btn-sm btn-primary rounded-xl text-xs font-medium justify-center"
              >
                {PageStrings.NAV_REGISTER}
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
