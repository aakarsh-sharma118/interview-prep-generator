/**
 * Coverage Checker Tests
 * Validates detection of uncovered requirements and ratio calculation.
 * Author: Aakarsh Sharma
 */

import { describe, it, expect } from 'vitest';
import { checkCoverageGaps } from '../src/services/coverage/coverageChecker.js';

describe('Deterministic Coverage Gap Checker', () => {
  const mockRequirements = [
    { id: 'r1', text: 'React and Redux experience', kind: 'technical', priority: 'must' },
    { id: 'r2', text: 'GraphQL API development', kind: 'technical', priority: 'must' },
    { id: 'r3', text: 'Kubernetes cluster deployment', kind: 'technical', priority: 'nice' },
    { id: 'r4', text: 'Mentorship of junior team members', kind: 'behavioural', priority: 'nice' },
  ];

  it('detects 100% full coverage when all requirements have questions', () => {
    const fullyCoveringQuestions = [
      { id: 'q1', requirement_ids: ['r1'] },
      { id: 'q2', requirement_ids: ['r2'] },
      { id: 'q3', requirement_ids: ['r3'] },
      { id: 'q4', requirement_ids: ['r4'] },
    ];

    const result = checkCoverageGaps(mockRequirements, fullyCoveringQuestions);
    expect(result.uncovered_requirement_ids).toEqual([]);
    expect(result.uncovered_must_ids).toEqual([]);
    expect(result.uncovered_nice_ids).toEqual([]);
    expect(result.is_complete).toBe(true);
    expect(result.coverage_ratio).toBe(1.0);
  });

  it('identifies uncovered must-have and nice-to-have gaps correctly', () => {
    // Only r1 is covered. r2 (must), r3 (nice), r4 (nice) are missing.
    const partialQuestions = [
      { id: 'q1', requirement_ids: ['r1'] },
    ];

    const result = checkCoverageGaps(mockRequirements, partialQuestions);
    expect(result.uncovered_requirement_ids).toEqual(['r2', 'r3', 'r4']);
    expect(result.uncovered_must_ids).toEqual(['r2']);
    expect(result.uncovered_nice_ids).toEqual(['r3', 'r4']);
    expect(result.is_complete).toBe(false);
    expect(result.coverage_ratio).toBe(0.25);
  });

  it('handles multi-requirement linking per question', () => {
    // Single question covers both r1 and r2
    const multiCoverQuestion = [
      { id: 'q1', requirement_ids: ['r1', 'r2'] },
      { id: 'q2', requirement_ids: ['r3'] },
    ];

    const result = checkCoverageGaps(mockRequirements, multiCoverQuestion);
    expect(result.uncovered_must_ids).toEqual([]); // Both must-haves covered
    expect(result.uncovered_nice_ids).toEqual(['r4']);
    expect(result.is_complete).toBe(true); // Must-haves are satisfied
    expect(result.coverage_matrix['r1']).toEqual(['q1']);
    expect(result.coverage_matrix['r2']).toEqual(['q1']);
  });

  it('handles empty inputs gracefully without crashing', () => {
    const emptyResult = checkCoverageGaps([], []);
    expect(emptyResult.uncovered_requirement_ids).toEqual([]);
    expect(emptyResult.coverage_ratio).toBe(1.0);
    expect(emptyResult.is_complete).toBe(true);
  });
});
