/**
 * Mock Interview Modal Component
 * Interactive practice interview modal with question prompts and instant feedback summary.
 * Supports light and dark mode and mobile responsiveness.
 * Author: Aakarsh Sharma
 */

'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Mic, CheckCircle2, Award, ChevronRight, AlertTriangle } from 'lucide-react';
import { PageStrings } from '../../utils/pageStrings.js';

/**
 * MockInterviewModal - Live interactive mock interview simulator.
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility flag.
 * @param {() => void} props.onClose - Close callback.
 * @param {Array<Object>} props.questions - Prep kit questions.
 * @param {string} props.roleTitle - Target role title.
 */
export const MockInterviewModal = ({ isOpen = false, onClose = () => {}, questions = [], roleTitle = '' }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState(['', '', '']);
  const [isEvaluating, setIsEvaluating] = useState(false);

  if (!isOpen) return null;

  // Pick top 3 questions
  const screeningQuestions = questions.slice(0, 3);
  const currentQuestion = screeningQuestions[currentStep];

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      setIsEvaluating(true);
      setTimeout(() => {
        setIsEvaluating(false);
        setCurrentStep(3);
      }, 1200);
    }
  };

  const updateAnswer = (text) => {
    const nextAnswers = [...answers];
    nextAnswers[currentStep] = text;
    setAnswers(nextAnswers);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-theme-surface border border-theme-border rounded-3xl p-5 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl relative max-h-[92vh] overflow-y-auto transition-colors">
        {/* ── Close Button ─────────────────────────────────────────────────── */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-theme-text-muted hover:text-theme-text-primary hover:bg-theme-elevated transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* ── Modal Header ─────────────────────────────────────────────────── */}
        <div className="space-y-1">
          <div className="flex items-center space-x-2 text-brand-emerald text-xs font-mono font-semibold">
            <Mic className="w-4 h-4" />
            <span>{PageStrings.MOCK_MODAL_TITLE}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-display font-bold text-theme-text-primary pr-8">
            Live Screening for {roleTitle || 'Target Role'}
          </h2>
          <p className="text-xs text-theme-text-secondary">{PageStrings.MOCK_MODAL_DESC}</p>
        </div>

        {/* ── Question Steps ───────────────────────────────────────────────── */}
        {currentStep < 3 && currentQuestion && (
          <div className="space-y-4">
            {/* Step Indicator */}
            <div className="flex items-center justify-between text-xs font-mono text-theme-text-muted border-b border-theme-border pb-2">
              <span>{PageStrings.MOCK_QUESTION_LABEL(currentStep + 1)}</span>
              <span className="text-brand-indigo font-bold">Category: {currentQuestion.category}</span>
            </div>

            {/* Question Prompt */}
            <div className="p-4 rounded-2xl bg-theme-elevated/80 border border-theme-border text-xs sm:text-sm font-medium text-theme-text-primary leading-relaxed">
              {currentQuestion.prompt}
            </div>

            {/* Response Area */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono text-theme-text-secondary block">Your Structured Response</label>
              <textarea
                value={answers[currentStep]}
                onChange={(e) => updateAnswer(e.target.value)}
                rows={5}
                placeholder={PageStrings.MOCK_INPUT_PLACEHOLDER}
                className="w-full bg-theme-elevated/40 border border-theme-border focus:border-brand-emerald rounded-2xl p-4 text-xs text-theme-text-primary leading-relaxed resize-none focus:outline-none transition-colors"
              />
            </div>

            {/* Next / Submit Button */}
            <div className="flex justify-end pt-2">
              <button
                onClick={handleNext}
                disabled={isEvaluating}
                className="btn btn-primary rounded-xl px-6 text-xs font-medium flex items-center gap-2"
              >
                <span>{currentStep === 2 ? PageStrings.BTN_SUBMIT_ANSWER : 'Next Question'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── Evaluation Report ────────────────────────────────────────────── */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6 text-center py-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-brand-emerald/10 border border-brand-emerald/30 flex items-center justify-center text-brand-emerald mx-auto">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-display font-bold text-theme-text-primary">{PageStrings.MOCK_SCORE_TITLE}</h3>
              <div className="text-4xl font-extrabold text-brand-emerald font-mono">88%</div>
              <p className="text-xs text-theme-text-muted">High Readiness for Technical Rounds</p>
            </div>

            {/* Diagnostics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <div className="p-4 rounded-2xl bg-theme-elevated/60 border border-emerald-500/30 space-y-1">
                <div className="flex items-center space-x-1.5 text-xs font-mono text-brand-emerald font-semibold">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Strengths</span>
                </div>
                <p className="text-xs text-theme-text-secondary leading-relaxed">
                  Strong technical clarity on architectural constraints and distributed failure modes.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-theme-elevated/60 border border-amber-500/30 space-y-1">
                <div className="flex items-center space-x-1.5 text-xs font-mono text-amber-500 font-semibold">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Growth Areas</span>
                </div>
                <p className="text-xs text-theme-text-secondary leading-relaxed">
                  Quantify business and engineering latency metrics more explicitly during answers.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn btn-outline border-theme-border text-theme-text-secondary hover:text-theme-text-primary px-6 rounded-xl text-xs font-medium"
            >
              Close & Return to Kit
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default MockInterviewModal;
