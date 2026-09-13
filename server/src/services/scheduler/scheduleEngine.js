/**
 * Deterministic Study Schedule Engine
 * Distributes interview topics across the available study days:
 * - Creates exactly the number of days requested.
 * - Schedules higher-priority and harder topics first.
 * - Leaves behavioural and review sessions closer to interview day.
 * - Calculates duration using integer minute blocks.
 * Author: Aakarsh Sharma
 */

import { MINUTES_PER_DIFFICULTY, MIN_DAILY_MINUTES } from '../../constants/appConstants.js';

/**
 * Derives a human-readable daily focus title based on the assigned questions.
 *
 * @param {Array<Object>} dayQuestions - Questions assigned to a given day.
 * @param {number} dayNumber - 1-indexed day number.
 * @param {number} totalDays - Total available preparation days.
 * @returns {string} Focus title string.
 */
const deriveDayFocus = (dayQuestions, dayNumber, totalDays) => {
  // If final day in multi-day schedule, prioritize interview readiness
  if (totalDays > 1 && dayNumber === totalDays) {
    return 'Final Review & Company Alignment';
  }

  // Count occurrences of question categories
  const categoryCounts = {};
  dayQuestions.forEach((question) => {
    const category = question.category || 'technical';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  // Find dominant category
  let dominantCategory = 'technical';
  let maxCount = 0;
  Object.entries(categoryCounts).forEach(([category, count]) => {
    if (count > maxCount) {
      maxCount = count;
      dominantCategory = category;
    }
  });

  // Map category to thematic focus descriptor
  switch (dominantCategory) {
    case 'system-design':
      return 'System Design & Scalable Architecture';
    case 'behavioural':
      return 'Leadership, STAR Stories & Culture';
    case 'company-fit':
      return 'Company Culture, Vision & Role Expectations';
    case 'technical':
    default:
      if (dayNumber === 1) {
        return 'Core Technical Fundamentals & Hard Requirements';
      }
      return 'Applied Technical Deep-Dive & Coding Patterns';
  }
};

/**
 * Calculates the total integer duration in minutes for a list of questions.
 *
 * @param {Array<Object>} questions - List of questions.
 * @returns {number} Integer duration in minutes.
 */
const calculateDayMinutes = (questions) => {
  // Sum individual question minutes according to their difficulty rating
  const totalMinutes = questions.reduce((accumulator, question) => {
    const difficulty = question.difficulty || 2;
    const minutes = MINUTES_PER_DIFFICULTY[difficulty] || 25;
    return accumulator + minutes;
  }, 0);

  // Return at least the minimum daily threshold as an integer
  return Math.max(Math.round(totalMinutes), MIN_DAILY_MINUTES);
};

/**
 * Allocates preparation material across exactly the number of available days.
 * Pure arithmetic implementation for balanced study distribution.
 *
 * @param {Array<Object>} questions - Complete bank of questions.
 * @param {Array<Object>} requirements - Extracted JD requirements.
 * @param {number} daysAvailable - Requested preparation time in days.
 * @returns {{ days_available: number, days: Array<{ day: number, focus: string, question_ids: string[], minutes: number }> }}
 */
export const allocateStudySchedule = (questions = [], requirements = [], daysAvailable = 5) => {
  // ── 1. Input Sanitization & Invariant Normalization ──────────────────────
  const normalizedDays = Math.max(1, Math.floor(Number(daysAvailable) || 1));
  const safeQuestions = Array.isArray(questions) ? [...questions] : [];
  const safeRequirements = Array.isArray(requirements) ? [...requirements] : [];

  // If no questions exist, create empty template spanning exact requested days
  if (safeQuestions.length === 0) {
    const emptyDays = [];
    for (let dayIndex = 1; dayIndex <= normalizedDays; dayIndex++) {
      emptyDays.push({
        day: dayIndex,
        focus: dayIndex === 1 ? 'Initial Requirement Study' : `Study Day ${dayIndex}`,
        question_ids: [],
        minutes: MIN_DAILY_MINUTES,
      });
    }
    return { days_available: normalizedDays, days: emptyDays };
  }

  // ── 2. Requirement Priority Indexing ─────────────────────────────────────
  // Build a set of must-have requirement IDs
  const mustHaveReqIds = new Set(
    safeRequirements
      .filter((requirement) => requirement.priority === 'must')
      .map((requirement) => requirement.id)
  );

  // ── 3. Question Prioritization Scoring ────────────────────────────────────
  // Calculate scheduling weight:
  // - High priority: covers must-have requirement (+20 points)
  // - High difficulty: difficulty 3 (+10), difficulty 2 (+5), difficulty 1 (+2)
  // - Category timing: system-design (+8), technical (+5), behavioural (+2), company-fit (+1)
  const scoredQuestions = safeQuestions.map((question) => {
    let score = 0;
    const linkedReqs = Array.isArray(question.requirement_ids) ? question.requirement_ids : [];
    const coversMustHave = linkedReqs.some((reqId) => mustHaveReqIds.has(reqId));
    if (coversMustHave) {
      score += 20;
    }

    const difficulty = question.difficulty || 2;
    score += difficulty * 5;

    if (question.category === 'system-design') {
      score += 8;
    } else if (question.category === 'technical') {
      score += 5;
    } else if (question.category === 'behavioural') {
      score += 2;
    } else {
      score += 1;
    }

    return { question, score };
  });

  // Sort descending: highest score (hardest / must-have / architecture) first
  scoredQuestions.sort((a, b) => b.score - a.score);
  const prioritizedQuestions = scoredQuestions.map((item) => item.question);

  // ── 4. Bucket Allocation Across Days ──────────────────────────────────────
  // Initialize schedule days array with exactly normalizedDays elements
  const scheduleDays = [];
  for (let index = 0; index < normalizedDays; index++) {
    scheduleDays.push({
      day: index + 1,
      focus: '',
      questions: [],
    });
  }

  // ── Scenario A: Single Day Crash Course (daysAvailable === 1) ─────────────
  if (normalizedDays === 1) {
    scheduleDays[0].questions = prioritizedQuestions;
    scheduleDays[0].focus = 'Intensive Comprehensive Sprint (High-Priority Focus)';
  }
  // ── Scenario B: Days <= Question Count ────────────────────────────────────
  else if (normalizedDays <= prioritizedQuestions.length) {
    // Round-robin or block distribute ordered questions across days
    const baseItemsPerDay = Math.floor(prioritizedQuestions.length / normalizedDays);
    let extraItems = prioritizedQuestions.length % normalizedDays;
    let questionCursor = 0;

    for (let dayIndex = 0; dayIndex < normalizedDays; dayIndex++) {
      const takeCount = baseItemsPerDay + (extraItems > 0 ? 1 : 0);
      if (extraItems > 0) {
        extraItems--;
      }
      const daySlice = prioritizedQuestions.slice(questionCursor, questionCursor + takeCount);
      scheduleDays[dayIndex].questions = daySlice;
      questionCursor += takeCount;
    }
  }
  // ── Scenario C: Extended Schedule (e.g. 14 to 60 days) ─────────────────────
  else {
    // Allocate primary questions across the first batch of days
    prioritizedQuestions.forEach((question, index) => {
      scheduleDays[index].questions = [question];
    });

    // For remaining days, allocate spaced repetition review and consolidation
    for (let dayIndex = prioritizedQuestions.length; dayIndex < normalizedDays; dayIndex++) {
      // Pick questions for spaced review from previous days
      const reviewIndex = (dayIndex - prioritizedQuestions.length) % prioritizedQuestions.length;
      const reviewQuestion = prioritizedQuestions[reviewIndex];
      scheduleDays[dayIndex].questions = [reviewQuestion];
      scheduleDays[dayIndex].focus = `Spaced Repetition Review & Mock Practice (Session ${dayIndex + 1})`;
    }
  }

  // ── 5. Assemble and Finalize Invariants ───────────────────────────────────
  const finalizedDays = scheduleDays.map((scheduleDay) => {
    const dayQuestions = scheduleDay.questions;
    // Derive focus title if not already customized
    const focus = scheduleDay.focus || deriveDayFocus(dayQuestions, scheduleDay.day, normalizedDays);
    // Question IDs array
    const questionIds = dayQuestions.map((question) => question.id);
    // Calculated integer duration
    const minutes = calculateDayMinutes(dayQuestions);

    return {
      day: scheduleDay.day,
      focus,
      question_ids: questionIds,
      minutes,
    };
  });

  return {
    days_available: normalizedDays,
    days: finalizedDays,
  };
};
