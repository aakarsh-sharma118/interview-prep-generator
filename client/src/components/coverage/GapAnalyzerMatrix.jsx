/**
 * Requirement Coverage Matrix Component
 * Displays mapped coverage between job requirements and generated prep questions.
 * Supports responsive tables and theme tokens.
 * Author: Aakarsh Sharma
 */

'use client';

import React, { useMemo } from 'react';
import { ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';
import { PageStrings } from '../../utils/pageStrings.js';

/**
 * GapAnalyzerMatrix - Dynamic arithmetic coverage inspector.
 *
 * @param {Object} props
 * @param {Array<Object>} props.requirements - Role requirements (r1..rn).
 * @param {Array<Object>} props.questions - Prep questions (q1..qn).
 * @param {Object} [props.coverage] - Coverage summary metadata.
 */
export const GapAnalyzerMatrix = ({ requirements = [], questions = [], coverage = {} }) => {
  // ── Derived State: Compute Referrals Arithmetically ───────────────────────
  const { coverageMap, mustGaps, totalCovered, isFullyCovered } = useMemo(() => {
    const map = {};
    requirements.forEach((req) => {
      map[req.id] = [];
    });

    questions.forEach((q) => {
      const linked = Array.isArray(q.requirement_ids) ? q.requirement_ids : [];
      linked.forEach((reqId) => {
        if (map[reqId] !== undefined) {
          map[reqId].push(q.id);
        }
      });
    });

    const gaps = requirements.filter((r) => r.priority === 'must' && (map[r.id] || []).length === 0);
    const coveredCount = requirements.filter((r) => (map[r.id] || []).length > 0).length;

    return {
      coverageMap: map,
      mustGaps: gaps,
      totalCovered: coveredCount,
      isFullyCovered: gaps.length === 0,
    };
  }, [requirements, questions]);

  return (
    <div className="w-full rounded-3xl bg-theme-surface/90 border border-theme-border p-5 sm:p-6 backdrop-blur-md shadow-card-light dark:shadow-card-dark transition-colors">
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-theme-border">
        <div>
          <h3 className="text-sm sm:text-base font-semibold text-theme-text-primary flex items-center gap-2">
            <ShieldCheck className={`w-5 h-5 ${isFullyCovered ? 'text-brand-emerald' : 'text-brand-amber'}`} />
            <span>{PageStrings.SECTION_GAP_ANALYZER_TITLE}</span>
          </h3>
          <p className="text-xs text-theme-text-muted mt-0.5">{PageStrings.GAP_ANALYZER_SUBTITLE}</p>
        </div>

        {/* ── Metric Badges ──────────────────────────────────────────────── */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-mono font-medium border ${
              isFullyCovered
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30'
            }`}
          >
            {isFullyCovered ? PageStrings.STATUS_VERIFIED : `${mustGaps.length} ${PageStrings.LABEL_UNCOVERED_GAPS}`}
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-mono bg-theme-elevated text-theme-text-secondary border border-theme-border flex items-center gap-1">
            <RefreshCw className="w-3 h-3 text-brand-indigo" />
            <span>Passes: {coverage?.passes || 1}</span>
          </span>
        </div>
      </div>

      {/* ── Requirements to Questions Mapping Matrix ─────────────────────── */}
      <div className="overflow-x-auto -mx-2 px-2">
        <table className="w-full text-left text-xs font-mono border-collapse min-w-[560px]">
          <thead>
            <tr className="border-b border-theme-border text-theme-text-muted text-[11px]">
              <th className="pb-2.5 font-semibold">Requirement ID</th>
              <th className="pb-2.5 font-semibold">Requirement Specification</th>
              <th className="pb-2.5 font-semibold">Priority</th>
              <th className="pb-2.5 font-semibold text-right">Targeted Question(s)</th>
              <th className="pb-2.5 font-semibold text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-theme-border text-theme-text-secondary">
            {requirements.map((req) => {
              const matchedQuestions = coverageMap[req.id] || [];
              const isCovered = matchedQuestions.length > 0;
              const isMust = req.priority === 'must';

              return (
                <tr key={req.id} className="hover:bg-theme-elevated/50 transition-colors">
                  <td className="py-3 pr-3 font-bold text-brand-indigo">{req.id}</td>
                  <td className="py-3 pr-3 font-sans text-xs text-theme-text-primary max-w-xs">{req.text}</td>
                  <td className="py-3 pr-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                        isMust
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30'
                          : 'bg-theme-elevated text-theme-text-muted border border-theme-border'
                      }`}
                    >
                      {req.priority}
                    </span>
                  </td>
                  <td className="py-3 pr-3 text-right">
                    {isCovered ? (
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {matchedQuestions.map((qId) => (
                          <span
                            key={qId}
                            className="px-1.5 py-0.5 rounded bg-brand-emerald/10 text-brand-emerald text-[11px] font-bold border border-brand-emerald/30"
                          >
                            {qId}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-theme-text-muted italic">No direct question</span>
                    )}
                  </td>
                  <td className="py-3 text-center">
                    {isCovered ? (
                      <span className="inline-flex items-center text-brand-emerald gap-1 text-[11px] font-medium">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center text-amber-500 gap-1 text-[11px] font-medium">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Gap
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Arithmetic Verification Note ─────────────────────────────────── */}
      <div className="mt-4 pt-3 border-t border-theme-border flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-theme-text-muted font-mono gap-1">
        <span>
          Arithmetic Invariant: Total Requirements ({requirements.length}) | Covered ({totalCovered})
        </span>
        <span>Deterministic Verification (Passes: {coverage?.passes || 1})</span>
      </div>
    </div>
  );
};

export default GapAnalyzerMatrix;
