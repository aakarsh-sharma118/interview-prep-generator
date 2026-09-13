/**
 * Bento Grid Builder Component
 * Displays prep kit sections (company brief, requirements, questions, schedule)
 * with inline editing and section regeneration in light and dark modes.
 * Author: Aakarsh Sharma
 */

'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Pin,
  PinOff,
  Trash2,
  Plus,
  RefreshCw,
  ExternalLink,
  Clock,
  Briefcase,
  Layers,
  Save,
  Sparkles,
  Calendar,
} from 'lucide-react';
import { useKitStore } from '../../hooks/useKitStore.js';
import { DIFFICULTY_CONFIG, QUESTION_CATEGORIES } from '../../utils/appConstants.js';
import { PageStrings } from '../../utils/pageStrings.js';

/**
 * BentoGridBuilder - Main interactive workspace for viewing and reshaping interview prep kits.
 */
export const BentoGridBuilder = () => {
  const {
    activeKit,
    updateQuestionInline,
    updateAnswerOutlineInline,
    togglePinQuestion,
    deleteQuestion,
    updateCompanyBriefInline,
    addQuestionManual,
    regenerateSection,
    saveActiveKit,
    isLoading,
    isDirty,
  } = useKitStore();

  // ── Local Component State ─────────────────────────────────────────────────
  const [regeneratingTarget, setRegeneratingTarget] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newQuestionCategory, setNewQuestionCategory] = useState('technical');
  const [newQuestionPrompt, setNewQuestionPrompt] = useState('');
  const [newQuestionOutline, setNewQuestionOutline] = useState('');
  const [newQuestionDifficulty, setNewQuestionDifficulty] = useState(2);

  if (!activeKit) {
    return (
      <div className="text-center py-20 text-theme-text-muted font-mono">
        <p>{PageStrings.EMPTY_KITS_DESC}</p>
      </div>
    );
  }

  const { source, company_brief, role, questions, schedule } = activeKit;

  // ── Single Section Regeneration Handler ───────────────────────────────────
  const handleRegenerate = async (section, categoryName = null) => {
    const targetKey = categoryName ? `cat-${categoryName}` : section;
    setRegeneratingTarget(targetKey);
    try {
      await regenerateSection(section, categoryName);
    } finally {
      setRegeneratingTarget(null);
    }
  };

  // ── Manual Question Submission ────────────────────────────────────────────
  const handleCreateManualQuestion = () => {
    if (!newQuestionPrompt.trim()) return;
    addQuestionManual({
      category: newQuestionCategory,
      prompt: newQuestionPrompt.trim(),
      answer_outline: newQuestionOutline.trim(),
      difficulty: newQuestionDifficulty,
      requirement_ids: role.requirements[0] ? [role.requirements[0].id] : ['r1'],
    });
    setNewQuestionPrompt('');
    setNewQuestionOutline('');
    setIsAddModalOpen(false);
  };

  return (
    <div className="w-full space-y-6">
      {/* ── Action Toolbar: Save & Status ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-theme-surface/90 border border-theme-border rounded-2xl p-4 backdrop-blur-md shadow-card-light dark:shadow-card-dark transition-colors">
        <div className="flex items-center space-x-3 flex-wrap gap-y-1">
          <div className="w-2.5 h-2.5 rounded-full bg-brand-emerald animate-pulse flex-shrink-0" />
          <span className="text-sm font-medium text-theme-text-primary">
            {role.title} <span className="text-theme-text-muted font-normal">at</span> {source.company}
          </span>
          {isDirty && (
            <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/30">
              Unsaved edits
            </span>
          )}
        </div>

        <div className="flex items-center space-x-3 self-end sm:self-auto">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="btn btn-sm btn-ghost border border-theme-border text-xs font-mono text-theme-text-secondary hover:text-theme-text-primary flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 text-brand-emerald" />
            <span>{PageStrings.BTN_ADD_QUESTION}</span>
          </button>
          <button
            type="button"
            onClick={saveActiveKit}
            disabled={!isDirty || isLoading}
            className="btn btn-sm btn-primary text-xs font-medium flex items-center gap-1.5 rounded-xl shadow-sm"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{PageStrings.BTN_SAVE_CHANGES}</span>
          </button>
        </div>
      </div>

      {/* ── Gapless Swiss Bento Grid ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* ── Card 1: Company Intelligence Brief (span 6) ─────────────────── */}
        <div className="relative lg:col-span-6 rounded-3xl bg-theme-surface/90 border border-theme-border p-5 sm:p-6 backdrop-blur-xl flex flex-col justify-between overflow-hidden shadow-card-light dark:shadow-card-dark transition-colors">
          {/* Absolute-Fade Regeneration Overlay */}
          <AnimatePresence>
            {regeneratingTarget === 'company_brief' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-theme-base/80 backdrop-blur-sm z-20 flex items-center justify-center space-x-2 text-brand-emerald font-mono text-xs"
              >
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Regenerating brief intelligence...</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-theme-border pb-3">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-4 h-4 text-brand-indigo" />
                <h3 className="text-xs font-semibold text-theme-text-primary tracking-wide uppercase font-mono">
                  {PageStrings.SECTION_BRIEF_TITLE}
                </h3>
              </div>
              <button
                type="button"
                aria-label={PageStrings.BTN_REGENERATE_TOOLTIP}
                onClick={() => handleRegenerate('company_brief')}
                title={PageStrings.BTN_REGENERATE_TOOLTIP}
                className="p-1.5 rounded-lg hover:bg-theme-elevated text-theme-text-muted hover:text-theme-text-primary transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Inline Editable Brief Fields */}
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-mono text-theme-text-muted block mb-1">Company Summary</label>
                <textarea
                  value={company_brief.summary || ''}
                  onChange={(e) => updateCompanyBriefInline({ summary: e.target.value })}
                  rows={3}
                  className="w-full bg-theme-elevated/70 border border-theme-border focus:border-brand-indigo rounded-xl p-3 text-xs text-theme-text-primary font-sans leading-relaxed resize-none focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-theme-text-muted block mb-1">What They Do</label>
                <textarea
                  value={company_brief.what_they_do || ''}
                  onChange={(e) => updateCompanyBriefInline({ what_they_do: e.target.value })}
                  rows={2}
                  className="w-full bg-theme-elevated/70 border border-theme-border focus:border-brand-indigo rounded-xl p-3 text-xs text-theme-text-primary font-sans leading-relaxed resize-none focus:outline-none transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Sources Cited */}
          <div className="mt-4 pt-3 border-t border-theme-border text-[11px] font-mono text-theme-text-muted flex items-center justify-between flex-wrap gap-2">
            <span>{PageStrings.SECTION_BRIEF_SOURCES}</span>
            <div className="flex items-center gap-2 flex-wrap">
              {(company_brief.sources || []).map((url, idx) => (
                <a
                  key={idx}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-brand-emerald flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span className="truncate max-w-[150px]">{url.replace(/^https?:\/\//, '')}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ── Card 2: Role Breakdown & Requirements Matrix (span 6) ─────────── */}
        <div className="lg:col-span-6 rounded-3xl bg-theme-surface/90 border border-theme-border p-5 sm:p-6 backdrop-blur-xl space-y-4 shadow-card-light dark:shadow-card-dark transition-colors">
          <div className="flex items-center justify-between border-b border-theme-border pb-3">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-brand-emerald" />
              <h3 className="text-xs font-semibold text-theme-text-primary tracking-wide uppercase font-mono">
                {PageStrings.SECTION_ROLE_TITLE}
              </h3>
            </div>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-theme-elevated text-brand-emerald border border-theme-border">
              {role.seniority || 'Senior'}
            </span>
          </div>

          {/* Requirements Badges */}
          <div className="space-y-2">
            <label className="text-[11px] font-mono text-theme-text-muted block">{PageStrings.SECTION_ROLE_REQUIREMENTS}</label>
            <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-theme-border">
              {role.requirements.map((req) => {
                const isMust = req.priority === 'must';
                return (
                  <div
                    key={req.id}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono border flex items-center space-x-2 ${
                      isMust
                        ? 'bg-rose-500/5 text-theme-text-primary border-rose-500/30'
                        : 'bg-theme-elevated/70 text-theme-text-secondary border-theme-border'
                    }`}
                  >
                    <span className="text-brand-indigo font-bold">{req.id}</span>
                    <span className="font-sans text-xs">{req.text}</span>
                    <span
                      className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-bold ${
                        isMust
                          ? 'bg-rose-500/20 text-rose-600 dark:text-rose-400'
                          : 'bg-theme-elevated text-theme-text-muted'
                      }`}
                    >
                      {req.priority}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Card 3: Categorized Question Bank (span 8) ──────────────────── */}
        <div className="lg:col-span-8 rounded-3xl bg-theme-surface/90 border border-theme-border p-5 sm:p-6 backdrop-blur-xl space-y-6 shadow-card-light dark:shadow-card-dark transition-colors">
          <div className="flex items-center justify-between border-b border-theme-border pb-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-brand-amber" />
              <h3 className="text-xs font-semibold text-theme-text-primary tracking-wide uppercase font-mono">
                {PageStrings.SECTION_QUESTIONS_TITLE} ({questions.length})
              </h3>
            </div>
          </div>

          {/* Group questions by category */}
          {QUESTION_CATEGORIES.map((category) => {
            const categoryQuestions = questions.filter((q) => q.category === category.id);
            if (categoryQuestions.length === 0) return null;

            return (
              <div key={category.id} className="relative space-y-3">
                {/* Category Header with Dedicated Section Regeneration */}
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs font-mono font-semibold text-theme-text-secondary uppercase tracking-wider">
                    {category.label} ({categoryQuestions.length})
                  </span>
                  <button
                    type="button"
                    aria-label="Regenerate this category of questions"
                    onClick={() => handleRegenerate('category', category.id)}
                    title={PageStrings.BTN_REGENERATE_TOOLTIP}
                    className="flex items-center gap-1 text-[11px] font-mono text-theme-text-muted hover:text-brand-emerald transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Regenerate Category</span>
                  </button>
                </div>

                {/* Absolute-Fade Overlay for this category */}
                <AnimatePresence>
                  {regeneratingTarget === `cat-${category.id}` && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="absolute inset-0 bg-theme-base/80 backdrop-blur-sm z-20 rounded-2xl flex items-center justify-center space-x-2 text-brand-emerald font-mono text-xs"
                    >
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Regenerating questions (preserving user edits)...</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Question Cards */}
                <div className="space-y-3">
                  {categoryQuestions.map((question) => {
                    const diffConfig = DIFFICULTY_CONFIG[question.difficulty] || DIFFICULTY_CONFIG[2];
                    const isPinned = question.isPinned;
                    const origin = question.origin || 'generated';

                    return (
                      <div
                        key={question.id}
                        className="rounded-2xl bg-theme-elevated/70 border border-theme-border p-4 space-y-3 hover:border-brand-indigo/30 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-mono">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-brand-indigo">{question.id}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${diffConfig.badgeClass}`}>
                              {diffConfig.label}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] ${
                                origin === 'edited'
                                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30'
                                  : origin === 'manual'
                                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/30'
                                  : 'bg-theme-surface text-theme-text-muted border border-theme-border'
                              }`}
                            >
                              {origin}
                            </span>
                          </div>

                          {/* Action Controls: Pin, Delete */}
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              aria-label={isPinned ? PageStrings.BTN_UNPIN : PageStrings.BTN_PIN}
                              onClick={() => togglePinQuestion(question.id)}
                              title={isPinned ? PageStrings.BTN_UNPIN : PageStrings.BTN_PIN}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isPinned
                                  ? 'bg-brand-emerald/20 text-brand-emerald'
                                  : 'text-theme-text-muted hover:text-theme-text-primary'
                              }`}
                            >
                              {isPinned ? <Pin className="w-3.5 h-3.5" /> : <PinOff className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              type="button"
                              aria-label={PageStrings.BTN_DELETE_QUESTION}
                              onClick={() => deleteQuestion(question.id)}
                              title={PageStrings.BTN_DELETE_QUESTION}
                              className="p-1.5 rounded-lg text-theme-text-muted hover:text-rose-500 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Inline Editable Prompt */}
                        <textarea
                          value={question.prompt}
                          onChange={(e) => updateQuestionInline(question.id, e.target.value)}
                          rows={2}
                          className="w-full bg-theme-surface border border-theme-border focus:border-brand-indigo rounded-xl p-3 text-xs text-theme-text-primary font-sans leading-relaxed resize-none focus:outline-none transition-colors"
                        />

                        {/* Inline Editable Answer Outline */}
                        <div>
                          <label className="text-[10px] font-mono text-theme-text-muted block mb-1">
                            Talking Points & Outline
                          </label>
                          <textarea
                            value={question.answer_outline || ''}
                            onChange={(e) => updateAnswerOutlineInline(question.id, e.target.value)}
                            rows={2}
                            className="w-full bg-theme-surface/70 border border-theme-border focus:border-brand-indigo rounded-xl p-2.5 text-[11px] text-theme-text-secondary font-sans resize-none focus:outline-none transition-colors"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Card 4: Deterministic Study Schedule (span 4) ───────────────── */}
        <div className="relative lg:col-span-4 rounded-3xl bg-theme-surface/90 border border-theme-border p-5 sm:p-6 backdrop-blur-xl flex flex-col justify-between space-y-4 shadow-card-light dark:shadow-card-dark transition-colors">
          {/* Absolute-Fade Regeneration Overlay */}
          <AnimatePresence>
            {regeneratingTarget === 'schedule' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-theme-base/80 backdrop-blur-sm z-20 rounded-3xl flex items-center justify-center space-x-2 text-brand-emerald font-mono text-xs"
              >
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Re-allocating arithmetic schedule...</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-theme-border pb-3">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-brand-emerald" />
                <h3 className="text-xs font-semibold text-theme-text-primary tracking-wide uppercase font-mono">
                  {PageStrings.SECTION_SCHEDULE_TITLE}
                </h3>
              </div>
              <button
                type="button"
                aria-label={PageStrings.BTN_REGENERATE_TOOLTIP}
                onClick={() => handleRegenerate('schedule')}
                title={PageStrings.BTN_REGENERATE_TOOLTIP}
                className="p-1.5 rounded-lg hover:bg-theme-elevated text-theme-text-muted hover:text-theme-text-primary transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="text-xs font-mono text-theme-text-secondary">
              Days Available:{' '}
              <strong className="text-theme-text-primary">{schedule.days_available} days</strong>
            </div>

            {/* Daily Distribution Timeline */}
            <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-theme-border">
              {schedule.days.map((day) => (
                <div
                  key={day.day}
                  className="rounded-2xl bg-theme-elevated/70 border border-theme-border p-3.5 space-y-2 text-xs transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-brand-emerald">Day {day.day}</span>
                    <span className="font-mono text-[11px] text-theme-text-muted flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{day.minutes} min</span>
                    </span>
                  </div>
                  <p className="text-theme-text-primary font-sans font-medium text-xs">{day.focus}</p>
                  <div className="flex items-center gap-1.5 flex-wrap pt-1 font-mono text-[10px]">
                    {day.question_ids.map((qId) => (
                      <span key={qId} className="px-1.5 py-0.5 rounded bg-theme-surface border border-theme-border text-theme-text-secondary">
                        {qId}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Add Question Manual Modal ─────────────────────────────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-theme-surface border border-theme-border rounded-3xl p-6 sm:p-8 max-w-lg w-full space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-theme-text-primary font-display">Add Custom Interview Question</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-theme-text-secondary font-mono mb-1">Category</label>
                <select
                  value={newQuestionCategory}
                  onChange={(e) => setNewQuestionCategory(e.target.value)}
                  className="select select-bordered select-sm w-full bg-theme-elevated border-theme-border text-theme-text-primary rounded-xl"
                >
                  {QUESTION_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-theme-text-secondary font-mono mb-1">Interview Question Prompt</label>
                <textarea
                  value={newQuestionPrompt}
                  onChange={(e) => setNewQuestionPrompt(e.target.value)}
                  rows={2}
                  placeholder="e.g. Walk us through a production incident you diagnosed..."
                  className="w-full bg-theme-elevated border border-theme-border rounded-xl p-3 text-theme-text-primary focus:outline-none focus:border-brand-indigo"
                />
              </div>

              <div>
                <label className="block text-theme-text-secondary font-mono mb-1">Answer Outline & Talking Points</label>
                <textarea
                  value={newQuestionOutline}
                  onChange={(e) => setNewQuestionOutline(e.target.value)}
                  rows={3}
                  placeholder="Key concepts, STAR framework, metrics..."
                  className="w-full bg-theme-elevated border border-theme-border rounded-xl p-3 text-theme-text-primary focus:outline-none focus:border-brand-indigo"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="btn btn-sm btn-ghost text-theme-text-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateManualQuestion}
                className="btn btn-sm btn-primary rounded-xl"
              >
                Add Question
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BentoGridBuilder;
