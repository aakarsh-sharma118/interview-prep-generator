/**
 * Live Execution Console
 * Animated console displaying crawler steps, link scores, and pipeline status logs.
 * Author: Aakarsh Sharma
 */

'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Globe, Search, CheckCircle2, Loader2, Sparkles } from 'lucide-react';
import { PageStrings } from '../../utils/pageStrings.js';

/**
 * LiveExecutionConsole - Real-time animated crawler and pipeline status console.
 *
 * @param {Object} props
 * @param {boolean} props.isGenerating - Whether pipeline is actively executing.
 * @param {number} props.progress - Current progress percentage (0-100).
 * @param {string} [props.currentStep] - Active execution phase identifier.
 * @param {Array<{ timestamp: string, step: string, message: string }>} [props.logs=[]] - Streamed logs.
 * @param {string} [props.companyUrl=''] - Target company URL.
 */
export const LiveExecutionConsole = ({
  isGenerating = false,
  progress = 0,
  currentStep = null,
  logs = [],
  companyUrl = '',
}) => {
  // ── Render Helpers ────────────────────────────────────────────────────────
  const displayLogs = logs.length > 0
    ? logs
    : [
        {
          timestamp: '00:00:00',
          step: 'READY',
          message: PageStrings.CONSOLE_IDLE_MSG,
        },
      ];

  return (
    <div className="w-full rounded-3xl bg-theme-surface/90 border border-theme-border backdrop-blur-xl shadow-card-light dark:shadow-card-dark p-5 sm:p-6 overflow-hidden flex flex-col h-full min-h-[420px] transition-colors">
      {/* ── Console Header ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between border-b border-theme-border pb-3 mb-4">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-brand-emerald" />
          <span className="text-xs font-mono font-semibold tracking-wider text-theme-text-primary">
            {PageStrings.CONSOLE_TITLE}
          </span>
        </div>
        {companyUrl && (
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-theme-elevated border border-theme-border text-[11px] text-theme-text-secondary font-mono">
            <Globe className="w-3 h-3 text-brand-indigo" />
            <span className="truncate max-w-[140px] sm:max-w-[200px]">{companyUrl.replace(/^https?:\/\//, '')}</span>
          </div>
        )}
      </div>

      {/* ── Pipeline Progress Indicator ──────────────────────────────────── */}
      {isGenerating && (
        <div className="mb-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-theme-text-secondary">
            <span className="flex items-center space-x-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-indigo" />
              <span className="font-semibold">{currentStep || 'PROCESSING'}</span>
            </span>
            <span className="text-brand-emerald font-bold">{progress}%</span>
          </div>
          <div className="w-full h-1.5 bg-theme-elevated rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-brand-indigo via-brand-emerald to-brand-emerald"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.4 }}
            />
          </div>
        </div>
      )}

      {/* ── Visual Crawler Route Highlight ───────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2 mb-4 p-2.5 rounded-2xl bg-theme-elevated border border-theme-border text-[11px] font-mono">
        <div className="flex items-center space-x-1.5 text-theme-text-secondary truncate">
          <Globe className="w-3 h-3 text-brand-indigo flex-shrink-0" />
          <span className="truncate">/ (Home)</span>
        </div>
        <div className="flex items-center space-x-1.5 text-brand-emerald truncate">
          <Search className="w-3 h-3 text-brand-emerald flex-shrink-0" />
          <span className="truncate">/careers</span>
        </div>
        <div className="flex items-center space-x-1.5 text-brand-amber truncate">
          <Sparkles className="w-3 h-3 text-brand-amber flex-shrink-0" />
          <span className="truncate">/handbook</span>
        </div>
      </div>

      {/* ── Monospace Terminal Stream ────────────────────────────────────── */}
      <div className="flex-1 bg-slate-950 dark:bg-black/60 rounded-2xl p-4 border border-slate-900/60 overflow-y-auto space-y-2 font-mono text-xs max-h-[260px] scrollbar-thin scrollbar-thumb-slate-800 shadow-inner">
        <AnimatePresence initial={false}>
          {displayLogs.map((log, index) => (
            <motion.div
              key={`${log.timestamp}-${index}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex items-start space-x-2 text-slate-300"
            >
              <span className="text-slate-600 text-[10px] select-none pt-0.5 flex-shrink-0">{log.timestamp}</span>
              <span className="text-brand-emerald font-bold text-[10px] flex-shrink-0">[{log.step}]</span>
              <span className="text-slate-200 flex-1 leading-relaxed break-words">{log.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* ── Footer Verification Checkmark ────────────────────────────────── */}
      <div className="mt-4 pt-3 border-t border-theme-border flex items-center justify-between text-[11px] font-mono text-theme-text-muted">
        <span className="flex items-center space-x-1 text-theme-text-secondary">
          <CheckCircle2 className="w-3.5 h-3.5 text-brand-emerald" />
          <span>SSRF Shield Active</span>
        </span>
        <span>robots.txt Compliance Verified</span>
      </div>
    </div>
  );
};

export default LiveExecutionConsole;
