/**
 * Interactive Study Schedule & Timeline Visualizer
 * Visualizes daily study blocks, workload intensity distribution, topic tracks,
 * and completion progress for interview preparation kits.
 * Author: Aakarsh Sharma
 */

'use client';

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  CheckCircle2,
  Circle,
  BarChart3,
  TrendingUp,
  Award,
  Layers,
  Sparkles,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { DIFFICULTY_CONFIG, CATEGORY_META } from '../../utils/appConstants.js';

export const ScheduleTimelineVisualizer = ({ schedule = {}, questions = [], role = {} }) => {
  const days = useMemo(() => schedule?.days || [], [schedule?.days]);
  const daysAvailable = schedule?.days_available || days.length || 1;

  // ── Question Lookup Map ───────────────────────────────────────────────────
  const questionMap = useMemo(() => {
    const map = {};
    (questions || []).forEach((q) => {
      map[q.id] = q;
    });
    return map;
  }, [questions]);

  // ── Selected Day & Interactive Completion State ───────────────────────────
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [completedQuestions, setCompletedQuestions] = useState(() => new Set());

  const toggleQuestionComplete = (qId) => {
    setCompletedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) {
        next.delete(qId);
      } else {
        next.add(qId);
      }
      return next;
    });
  };

  // ── Aggregate Metrics ─────────────────────────────────────────────────────
  const totalMinutes = useMemo(() => {
    return days.reduce((sum, d) => sum + (d.minutes || 0), 0);
  }, [days]);

  const totalQuestionsScheduled = useMemo(() => {
    const uniqueIds = new Set();
    days.forEach((d) => (d.question_ids || []).forEach((id) => uniqueIds.add(id)));
    return uniqueIds.size;
  }, [days]);

  const maxDailyMinutes = useMemo(() => {
    return Math.max(...days.map((d) => d.minutes || 0), 40);
  }, [days]);

  const completionPercent = totalQuestionsScheduled > 0
    ? Math.round((completedQuestions.size / totalQuestionsScheduled) * 100)
    : 0;

  const activeDay = days[selectedDayIndex] || days[0];

  return (
    <div className="w-full space-y-6">
      {/* ── Top Visual Metrics Deck ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-theme-surface/90 border border-theme-border backdrop-blur-md shadow-card-light dark:shadow-card-dark transition-colors space-y-1">
          <div className="flex items-center justify-between text-theme-text-muted text-xs font-mono">
            <span>Total Study Time</span>
            <Clock className="w-4 h-4 text-brand-indigo" />
          </div>
          <div className="text-xl sm:text-2xl font-display font-bold text-theme-text-primary">
            {totalMinutes} <span className="text-xs font-sans text-theme-text-muted font-normal">mins</span>
          </div>
          <p className="text-[11px] text-theme-text-secondary font-mono">
            ~{(totalMinutes / 60).toFixed(1)} hrs total workload
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-theme-surface/90 border border-theme-border backdrop-blur-md shadow-card-light dark:shadow-card-dark transition-colors space-y-1">
          <div className="flex items-center justify-between text-theme-text-muted text-xs font-mono">
            <span>Schedule Pace</span>
            <Calendar className="w-4 h-4 text-brand-emerald" />
          </div>
          <div className="text-xl sm:text-2xl font-display font-bold text-theme-text-primary">
            {daysAvailable} <span className="text-xs font-sans text-theme-text-muted font-normal">Days</span>
          </div>
          <p className="text-[11px] text-theme-text-secondary font-mono">
            Avg {Math.round(totalMinutes / (daysAvailable || 1))} mins / day
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-theme-surface/90 border border-theme-border backdrop-blur-md shadow-card-light dark:shadow-card-dark transition-colors space-y-1">
          <div className="flex items-center justify-between text-theme-text-muted text-xs font-mono">
            <span>Questions Paced</span>
            <BookOpen className="w-4 h-4 text-brand-violet" />
          </div>
          <div className="text-xl sm:text-2xl font-display font-bold text-theme-text-primary">
            {totalQuestionsScheduled} <span className="text-xs font-sans text-theme-text-muted font-normal">Items</span>
          </div>
          <p className="text-[11px] text-theme-text-secondary font-mono">
            Linked to role requirements
          </p>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-theme-surface/90 border border-theme-border backdrop-blur-md shadow-card-light dark:shadow-card-dark transition-colors space-y-1">
          <div className="flex items-center justify-between text-theme-text-muted text-xs font-mono">
            <span>Completion</span>
            <Award className="w-4 h-4 text-brand-amber" />
          </div>
          <div className="text-xl sm:text-2xl font-display font-bold text-brand-emerald">
            {completionPercent}%
          </div>
          <div className="w-full h-1.5 bg-theme-elevated rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-brand-emerald transition-all duration-300"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* ── Visual Daily Load Distribution Chart ─────────────────────────── */}
      <div className="p-5 sm:p-6 rounded-3xl bg-theme-surface/90 border border-theme-border backdrop-blur-md shadow-card-light dark:shadow-card-dark transition-colors space-y-4">
        <div className="flex items-center justify-between border-b border-theme-border pb-3">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-4 h-4 text-brand-emerald" />
            <h3 className="text-sm font-semibold text-theme-text-primary">
              Workload Intensity Distribution
            </h3>
          </div>
          <span className="text-xs font-mono text-theme-text-muted">
            Click day to inspect focus & items
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-7 gap-2.5 pt-2">
          {days.map((dayItem, idx) => {
            const isSelected = idx === selectedDayIndex;
            const heightPercent = Math.max(25, Math.round(((dayItem.minutes || 0) / maxDailyMinutes) * 100));

            return (
              <button
                key={dayItem.day}
                type="button"
                aria-label={`Select Day ${dayItem.day}`}
                onClick={() => setSelectedDayIndex(idx)}
                className={`flex flex-col items-center justify-between p-3 rounded-2xl border transition-all text-left group ${
                  isSelected
                    ? 'border-brand-emerald bg-brand-emerald/10 shadow-glow-sm'
                    : 'border-theme-border bg-theme-elevated/60 hover:border-theme-border/80 hover:bg-theme-elevated'
                }`}
              >
                <span className="text-[11px] font-mono text-theme-text-muted">
                  Day {String(dayItem.day).padStart(2, '0')}
                </span>

                {/* Vertical Intensity Bar */}
                <div className="w-full h-14 my-2 flex items-end justify-center">
                  <div
                    className={`w-4 rounded-t-lg transition-all ${
                      isSelected
                        ? 'bg-brand-emerald'
                        : 'bg-brand-indigo/60 group-hover:bg-brand-indigo'
                    }`}
                    style={{ height: `${heightPercent}%` }}
                  />
                </div>

                <div className="text-center">
                  <span className="text-xs font-mono font-bold text-theme-text-primary block">
                    {dayItem.minutes}m
                  </span>
                  <span className="text-[10px] text-theme-text-secondary font-mono">
                    {(dayItem.question_ids || []).length} items
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Interactive Day Focus Inspector ──────────────────────────────── */}
      {activeDay && (
        <div className="p-5 sm:p-6 rounded-3xl bg-theme-surface/90 border border-theme-border backdrop-blur-md shadow-card-light dark:shadow-card-dark transition-colors space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-theme-border pb-3">
            <div className="flex items-center space-x-3">
              <span className="px-3 py-1 rounded-full bg-brand-emerald/15 text-brand-emerald font-mono font-bold text-xs">
                Day {activeDay.day} of {daysAvailable}
              </span>
              <h4 className="text-sm sm:text-base font-display font-semibold text-theme-text-primary">
                {activeDay.focus}
              </h4>
            </div>
            <div className="flex items-center space-x-2 text-xs font-mono text-theme-text-secondary self-start sm:self-auto">
              <Clock className="w-3.5 h-3.5 text-brand-indigo" />
              <span>{activeDay.minutes} minutes allocated</span>
            </div>
          </div>

          {/* Day's Question Items */}
          <div className="space-y-3 pt-1">
            {(activeDay.question_ids || []).map((qId) => {
              const q = questionMap[qId];
              if (!q) return null;
              const isDone = completedQuestions.has(qId);
              const diffConfig = DIFFICULTY_CONFIG[q.difficulty] || DIFFICULTY_CONFIG[2];

              return (
                <div
                  key={qId}
                  className={`p-4 rounded-2xl border transition-all ${
                    isDone
                      ? 'bg-brand-emerald/5 border-brand-emerald/30 opacity-80'
                      : 'bg-theme-elevated/70 border-theme-border hover:border-theme-border/90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start space-x-3 flex-1">
                      <button
                        type="button"
                        aria-label={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                        onClick={() => toggleQuestionComplete(qId)}
                        className="mt-0.5 text-theme-text-muted hover:text-brand-emerald transition-colors"
                        title={isDone ? 'Mark as incomplete' : 'Mark as complete'}
                      >
                        {isDone ? (
                          <CheckCircle2 className="w-5 h-5 text-brand-emerald fill-brand-emerald/20" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-theme-surface border border-theme-border text-theme-text-secondary uppercase">
                            {q.category}
                          </span>
                          <span
                            className="text-[10px] font-mono px-2 py-0.5 rounded-full border"
                            style={{
                              color: diffConfig.color,
                              borderColor: `${diffConfig.color}40`,
                              backgroundColor: `${diffConfig.color}15`,
                            }}
                          >
                            {diffConfig.label}
                          </span>
                        </div>

                        <p className={`text-xs sm:text-sm font-medium ${isDone ? 'line-through text-theme-text-muted' : 'text-theme-text-primary'}`}>
                          {q.prompt}
                        </p>

                        {q.answer_outline && (
                          <p className="text-xs font-mono text-theme-text-secondary line-clamp-2 pt-1 border-t border-theme-border/40">
                            {q.answer_outline}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
