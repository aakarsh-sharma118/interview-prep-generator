/**
 * Schedule Engine Tests
 * Tests schedule day counts, integer minutes, and priority distribution.
 * Author: Aakarsh Sharma
 */

import { describe, it, expect } from 'vitest';
import { allocateStudySchedule } from '../src/services/scheduler/scheduleEngine.js';

describe('Deterministic Study Schedule Engine', () => {
  // Mock requirements with distinct priorities
  const mockRequirements = [
    { id: 'r1', text: '5+ years Node.js and TypeScript', kind: 'technical', priority: 'must' },
    { id: 'r2', text: 'Distributed system design & microservices', kind: 'technical', priority: 'must' },
    { id: 'r3', text: 'Experience mentoring junior engineers', kind: 'behavioural', priority: 'nice' },
  ];

  // Mock questions with varying difficulty and category
  const mockQuestions = [
    { id: 'q1', requirement_ids: ['r1'], category: 'technical', prompt: 'Node event loop?', difficulty: 2 },
    { id: 'q2', requirement_ids: ['r2'], category: 'system-design', prompt: 'Design scalable rate limiter', difficulty: 3 },
    { id: 'q3', requirement_ids: ['r3'], category: 'behavioural', prompt: 'Describe resolving conflict', difficulty: 1 },
    { id: 'q4', requirement_ids: ['r1'], category: 'technical', prompt: 'Explain memory leaks in Node', difficulty: 3 },
    { id: 'q5', requirement_ids: ['r2'], category: 'system-design', prompt: 'Design distributed cache', difficulty: 3 },
  ];

  it('allocates exactly the requested number of days', () => {
    // Test 3 days
    const schedule3 = allocateStudySchedule(mockQuestions, mockRequirements, 3);
    expect(schedule3.days_available).toBe(3);
    expect(schedule3.days).toHaveLength(3);

    // Test 5 days
    const schedule5 = allocateStudySchedule(mockQuestions, mockRequirements, 5);
    expect(schedule5.days_available).toBe(5);
    expect(schedule5.days).toHaveLength(5);
  });

  it('ensures every duration is an integer number of minutes', () => {
    const schedule = allocateStudySchedule(mockQuestions, mockRequirements, 4);
    schedule.days.forEach((day) => {
      // Must be an integer number
      expect(Number.isInteger(day.minutes)).toBe(true);
      expect(day.minutes).toBeGreaterThanOrEqual(30);
    });
  });

  it('schedules harder and higher-priority material earlier (Day 1)', () => {
    const schedule = allocateStudySchedule(mockQuestions, mockRequirements, 5);
    // Day 1 should feature high difficulty / must-have questions
    const day1QuestionIds = schedule.days[0].question_ids;
    // q2 or q5 (difficulty 3, must-have, system-design) should be on day 1
    const hasTopPriority = day1QuestionIds.some((id) => id === 'q2' || id === 'q5' || id === 'q4');
    expect(hasTopPriority).toBe(true);
  });

  it('handles edge case: 1-day crash course schedule', () => {
    const schedule1 = allocateStudySchedule(mockQuestions, mockRequirements, 1);
    expect(schedule1.days_available).toBe(1);
    expect(schedule1.days).toHaveLength(1);
    expect(schedule1.days[0].day).toBe(1);
    expect(schedule1.days[0].question_ids.length).toBeGreaterThanOrEqual(5);
    expect(Number.isInteger(schedule1.days[0].minutes)).toBe(true);
  });

  it('handles edge case: 60-day extended schedule with spaced repetition', () => {
    const schedule60 = allocateStudySchedule(mockQuestions, mockRequirements, 60);
    expect(schedule60.days_available).toBe(60);
    expect(schedule60.days).toHaveLength(60);

    // Verify all 60 days have valid non-empty question IDs and integer minutes
    schedule60.days.forEach((day, index) => {
      expect(day.day).toBe(index + 1);
      expect(day.question_ids.length).toBeGreaterThan(0);
      expect(Number.isInteger(day.minutes)).toBe(true);
    });
  });

  it('gracefully handles empty questions bank', () => {
    const emptySchedule = allocateStudySchedule([], mockRequirements, 3);
    expect(emptySchedule.days_available).toBe(3);
    expect(emptySchedule.days).toHaveLength(3);
    emptySchedule.days.forEach((day) => {
      expect(Number.isInteger(day.minutes)).toBe(true);
      expect(day.question_ids).toEqual([]);
    });
  });
});
