/**
 * Validation Tests
 * Verifies schema constraints for prep kits.
 * Author: Aakarsh Sharma
 */

import { describe, it, expect } from 'vitest';
import { validateKit } from '../src/validators/kitSchema.js';

describe('Kit Schema Validation', () => {
  const validKit = {
    source: {
      company: 'Acme Corp',
      company_url: 'https://acme.example.com',
      role: 'Staff Platform Engineer',
      location: 'Remote',
      jd_chars: 1450,
      researched_at: '2026-09-10T12:00:00.000Z',
      pages_used: ['https://acme.example.com/about', 'https://acme.example.com/careers'],
    },
    company_brief: {
      summary: 'Acme builds enterprise infrastructure tooling.',
      what_they_do: 'Cloud management platforms.',
      sources: ['https://acme.example.com/about'],
    },
    role: {
      title: 'Staff Platform Engineer',
      seniority: 'Staff',
      responsibilities: ['Build Kubernetes operators', 'Lead infrastructure migrations'],
      requirements: [
        { id: 'r1', text: '5+ years Kubernetes and Go', kind: 'technical', priority: 'must' },
        { id: 'r2', text: 'Proven experience mentoring engineers', kind: 'behavioural', priority: 'nice' },
      ],
    },
    questions: [
      {
        id: 'q1',
        requirement_ids: ['r1'],
        category: 'technical',
        prompt: 'Explain Kubernetes custom resource controllers in Go.',
        answer_outline: 'Define reconciler loop, informer cache, and error retries.',
        difficulty: 3,
      },
      {
        id: 'q2',
        requirement_ids: ['r2'],
        category: 'behavioural',
        prompt: 'Describe a situation where you mentored an engineer underperforming on deadlines.',
        answer_outline: 'STAR framework: identify root cause, set clear milestones, positive outcome.',
        difficulty: 2,
      },
    ],
    flashcards: [
      {
        id: 'f1',
        front: 'What is the role of an Informer in client-go?',
        back: 'Watches API server changes and maintains an in-memory cache to reduce API calls.',
        requirement_ids: ['r1'],
      },
    ],
    schedule: {
      days_available: 2,
      days: [
        {
          day: 1,
          focus: 'Core Kubernetes Architecture & Controllers',
          question_ids: ['q1'],
          minutes: 40,
        },
        {
          day: 2,
          focus: 'Behavioral Leadership & Mentorship Review',
          question_ids: ['q2'],
          minutes: 30,
        },
      ],
    },
    coverage: {
      uncovered_requirement_ids: [],
      passes: 2,
    },
  };

  it('validates a compliant kit successfully', () => {
    const result = validateKit(validKit);
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('rejects a kit with non-integer minutes in schedule', () => {
    const invalidKit = JSON.parse(JSON.stringify(validKit));
    invalidKit.schedule.days[0].minutes = 45.5; // Non-integer
    const result = validateKit(invalidKit);
    expect(result.success).toBe(false);
  });

  it('rejects a kit where schedule references non-existent question_id', () => {
    const invalidKit = JSON.parse(JSON.stringify(validKit));
    invalidKit.schedule.days[0].question_ids = ['q999']; // Does not exist in questions
    const result = validateKit(invalidKit);
    expect(result.success).toBe(false);
    expect(result.errors.some((err) => err.message.includes('unknown question_id'))).toBe(true);
  });

  it('rejects a kit where schedule.days length does not match days_available', () => {
    const invalidKit = JSON.parse(JSON.stringify(validKit));
    invalidKit.schedule.days_available = 5; // Mismatch with 2 days array
    const result = validateKit(invalidKit);
    expect(result.success).toBe(false);
    expect(result.errors.some((err) => err.message.includes('must equal days_available'))).toBe(true);
  });
});
