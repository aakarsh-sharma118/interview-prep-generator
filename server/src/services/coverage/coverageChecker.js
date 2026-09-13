/**
 * Requirement Coverage Checker
 * Maps questions to requirements, finds uncovered gaps, and computes coverage percentage.
 * Author: Aakarsh Sharma
 */

/**
 * Checks requirement coverage against a set of generated questions.
 * Evaluates referential links to identify uncovered gaps.
 *
 * @param {Array<{ id: string, text: string, kind: string, priority: string }>} requirements - Extracted requirements.
 * @param {Array<{ id: string, requirement_ids: string[] }>} questions - Generated question bank.
 * @returns {{
 *   uncovered_requirement_ids: string[],
 *   uncovered_must_ids: string[],
 *   uncovered_nice_ids: string[],
 *   covered_requirement_ids: string[],
 *   coverage_ratio: number,
 *   is_complete: boolean,
 *   coverage_matrix: Record<string, string[]>
 * }} Detailed coverage analysis object.
 */
export const checkCoverageGaps = (requirements = [], questions = []) => {
  // ── Input Sanitization ───────────────────────────────────────────────────
  // Handle empty or uninitialized arrays gracefully
  const safeRequirements = Array.isArray(requirements) ? requirements : [];
  const safeQuestions = Array.isArray(questions) ? questions : [];

  // ── Referential Link Indexing ────────────────────────────────────────────
  // Create an index mapping requirement ID to an array of covering question IDs
  const coverageMatrix = {};
  safeRequirements.forEach((requirement) => {
    coverageMatrix[requirement.id] = [];
  });

  // Populate coverage matrix by iterating through all questions
  safeQuestions.forEach((question) => {
    // Check all requirement_ids linked to this question
    const linkedIds = Array.isArray(question.requirement_ids) ? question.requirement_ids : [];
    linkedIds.forEach((requirementId) => {
      // If the requirement exists in our requirements set, register the link
      if (coverageMatrix[requirementId] !== undefined) {
        coverageMatrix[requirementId].push(question.id);
      }
    });
  });

  // ── Gap Calculation (Arithmetic) ─────────────────────────────────────────
  const uncoveredRequirementIds = [];
  const uncoveredMustIds = [];
  const uncoveredNiceIds = [];
  const coveredRequirementIds = [];

  safeRequirements.forEach((requirement) => {
    const questionLinks = coverageMatrix[requirement.id] || [];
    // If no questions link to this requirement, it is an uncovered gap
    if (questionLinks.length === 0) {
      uncoveredRequirementIds.push(requirement.id);
      // Differentiate priority gaps
      if (requirement.priority === 'must') {
        uncoveredMustIds.push(requirement.id);
      } else {
        uncoveredNiceIds.push(requirement.id);
      }
    } else {
      coveredRequirementIds.push(requirement.id);
    }
  });

  // ── Ratio & Completeness Metrics ─────────────────────────────────────────
  const totalCount = safeRequirements.length;
  const coveredCount = coveredRequirementIds.length;
  // Compute coverage ratio from 0.0 to 1.0 (defaults to 1.0 if 0 requirements)
  const coverageRatio = totalCount === 0 ? 1.0 : Math.round((coveredCount / totalCount) * 100) / 100;
  // Complete if all must-have requirements have at least one question
  const isComplete = uncoveredMustIds.length === 0;

  return {
    uncovered_requirement_ids: uncoveredRequirementIds,
    uncovered_must_ids: uncoveredMustIds,
    uncovered_nice_ids: uncoveredNiceIds,
    covered_requirement_ids: coveredRequirementIds,
    coverage_ratio: coverageRatio,
    is_complete: isComplete,
    coverage_matrix: coverageMatrix,
  };
};
