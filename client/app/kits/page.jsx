/**
 * Kits Dashboard
 * Displays saved preparation kits and provides batch role upload workflow.
 * Supports light/dark themes and responsive card grid.
 * Author: Aakarsh Sharma
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  ShieldCheck,
  Plus,
  Upload,
  ArrowRight,
  FileText,
  Loader2,
  Trash2,
} from 'lucide-react';
import { useKitStore } from '../../src/hooks/useKitStore.js';
import { useAuthStore } from '../../src/hooks/useAuthStore.js';
import { apiClient } from '../../src/api/apiClient.js';
import { ApiUrls } from '../../src/api/apiUrls.js';
import { RoutePaths } from '../../src/utils/appConstants.js';
import { PageStrings } from '../../src/utils/pageStrings.js';

export default function KitsDashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuthStore();
  const { kitsList, fetchKitsList, deleteKit, isLoading } = useKitStore();

  const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
  const [batchFileText, setBatchFileText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [batchError, setBatchError] = useState(null);
  const [kitToDelete, setKitToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (!kitToDelete) return;
    setIsDeleting(true);
    await deleteKit(kitToDelete._id);
    setIsDeleting(false);
    setKitToDelete(null);
  };

  useEffect(() => {
    router.prefetch(RoutePaths.HOME);
    if (!authLoading && !isAuthenticated) {
      router.push(RoutePaths.LOGIN);
    } else if (isAuthenticated) {
      fetchKitsList();
    }
  }, [authLoading, isAuthenticated, router, fetchKitsList]);

  // ── Multi-Role File Upload Handler ────────────────────────────────────────
  const handleBatchSubmit = async () => {
    try {
      const parsedCases = JSON.parse(batchFileText);
      if (!Array.isArray(parsedCases)) {
        throw new Error('File must contain an array of case objects.');
      }

      setIsUploading(true);
      setBatchError(null);

      const response = await apiClient.post(ApiUrls.KITS_BATCH_UPLOAD, { cases: parsedCases });
      if (response.success) {
        setIsBatchModalOpen(false);
        setBatchFileText('');
        fetchKitsList();
      }
    } catch (err) {
      setBatchError(err.message || 'Invalid JSON cases file.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBatchFileText(event.target?.result || '');
      };
      reader.readAsText(file);
    }
  };

  if (authLoading || (isLoading && kitsList.length === 0)) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-4 font-mono text-xs text-theme-text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-brand-emerald" />
        <p>Loading your preparation kits...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2 sm:py-4">
      {/* ── Official Breadcrumb Navigation ───────────────────────────────── */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs font-mono text-theme-text-muted">
        <Link href={RoutePaths.HOME} prefetch={true} className="hover:text-brand-indigo transition-colors">
          Home
        </Link>
        <span>/</span>
        <span className="text-theme-text-primary font-medium">
          {PageStrings.NAV_DASHBOARD}
        </span>
      </nav>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-theme-border pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-theme-text-primary">
            {PageStrings.NAV_DASHBOARD}
          </h1>
          <p className="text-xs font-mono text-theme-text-muted mt-1">
            {kitsList.length} Active Interview Preparation Kits • Tailored to Target Positions
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => setIsBatchModalOpen(true)}
            className="btn btn-sm btn-ghost border border-theme-border rounded-xl text-xs font-mono text-theme-text-secondary hover:text-theme-text-primary flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-brand-indigo" />
            <span>{PageStrings.BTN_UPLOAD_BATCH}</span>
          </button>

          <Link
            href={RoutePaths.HOME}
            prefetch={true}
            className="btn btn-sm btn-primary rounded-xl text-xs font-medium flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{PageStrings.NAV_NEW_KIT}</span>
          </Link>
        </div>
      </div>

      {/* ── Kit Cards Grid ───────────────────────────────────────────────── */}
      {kitsList.length === 0 ? (
        <div className="max-w-md mx-auto my-16 p-8 rounded-3xl bg-theme-surface border border-theme-border text-center space-y-4 shadow-card-light dark:shadow-card-dark">
          <FileText className="w-10 h-10 text-theme-text-muted mx-auto" />
          <h2 className="text-base font-bold text-theme-text-primary">{PageStrings.EMPTY_KITS_TITLE}</h2>
          <p className="text-xs text-theme-text-secondary font-sans leading-relaxed">{PageStrings.EMPTY_KITS_DESC}</p>
          <Link href={RoutePaths.HOME} prefetch={true} className="btn btn-sm btn-primary rounded-xl text-xs font-medium">
            Generate First Kit
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {kitsList.map((kit) => (
            <Link
              key={kit._id}
              href={RoutePaths.KIT_DETAIL(kit._id)}
              prefetch={true}
              className="group rounded-3xl bg-theme-surface/90 hover:bg-theme-elevated border border-theme-border hover:border-brand-indigo/40 p-6 backdrop-blur-xl transition-all shadow-card-light dark:shadow-card-dark flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono text-theme-text-muted">
                  <span className="truncate max-w-[150px] font-medium text-brand-indigo">{kit.source.company || 'Direct Posting'}</span>
                  <div className="flex items-center space-x-1.5">
                    <span className="text-brand-emerald flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Verified
                    </span>
                    <button
                      type="button"
                      title="Delete Kit"
                      aria-label={`Delete ${kit.role.title}`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setKitToDelete(kit);
                      }}
                      className="p-1 rounded-lg text-theme-text-muted hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h2 className="text-lg font-display font-bold text-theme-text-primary group-hover:text-brand-indigo transition-colors leading-snug">
                  {kit.role.title}
                </h2>
                <div className="flex items-center gap-2 text-[11px] font-mono text-theme-text-muted">
                  <span>{kit.questions?.length || 0} Questions</span>
                  <span>•</span>
                  <span>{kit.flashcards?.length || 0} Flashcards</span>
                </div>
              </div>

              <div className="pt-3 border-t border-theme-border flex items-center justify-between text-xs font-mono text-theme-text-muted">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{kit.schedule?.days_available || 5} Days Pacing</span>
                </span>
                <span className="group-hover:translate-x-1 transition-transform text-brand-indigo font-medium flex items-center gap-1">
                  <span>Open Studio</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* ── Multi-Role Batch Upload Modal ─────────────────────────────────── */}
      {isBatchModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-theme-surface border border-theme-border rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-theme-text-primary font-display">Batch Upload Multiple Roles</h3>
            <p className="text-xs text-theme-text-secondary">
              Upload or paste a JSON array of description-and-company pairs to prepare for multiple positions at once.
            </p>

            <div className="space-y-2">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="file-input file-input-bordered file-input-sm w-full bg-theme-elevated border-theme-border text-xs font-mono rounded-xl text-theme-text-primary"
              />
            </div>

            <textarea
              value={batchFileText}
              onChange={(e) => setBatchFileText(e.target.value)}
              rows={6}
              placeholder={`[\n  {\n    "jd": "Job description text...",\n    "company_url": "https://example.com",\n    "days": 5\n  }\n]`}
              className="w-full bg-theme-elevated border border-theme-border rounded-xl p-3 text-xs text-theme-text-primary font-mono resize-none focus:outline-none focus:border-brand-indigo"
            />

            {batchError && <p className="text-xs text-rose-500 font-mono">{batchError}</p>}

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsBatchModalOpen(false)}
                className="btn btn-sm btn-ghost text-theme-text-secondary text-xs"
                disabled={isUploading}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleBatchSubmit}
                disabled={isUploading || !batchFileText.trim()}
                className="btn btn-sm btn-primary rounded-xl text-xs font-medium flex items-center gap-1.5"
              >
                {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Process Batch</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete Confirmation Modal ────────────────────────────────────── */}
      {kitToDelete && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-theme-surface border border-theme-border rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center space-x-3 text-rose-500">
              <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-theme-text-primary font-display">Delete Preparation Kit?</h3>
                <p className="text-xs text-theme-text-muted font-mono">This action cannot be undone.</p>
              </div>
            </div>
            <p className="text-xs text-theme-text-secondary leading-relaxed font-sans">
              Are you sure you want to permanently delete the preparation kit for <strong className="text-theme-text-primary">{kitToDelete.role.title}</strong> at <strong className="text-theme-text-primary">{kitToDelete.source.company || 'Target Company'}</strong>?
            </p>
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-theme-border">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setKitToDelete(null)}
                className="btn btn-sm btn-ghost border border-theme-border text-xs font-mono text-theme-text-secondary hover:text-theme-text-primary"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="btn btn-sm btn-outline border-rose-500/40 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl text-xs font-medium flex items-center gap-1.5"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>{isDeleting ? 'Deleting...' : 'Delete Kit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
