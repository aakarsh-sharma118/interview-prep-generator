/**
 * Master Interview Prep Kit Pipeline Coordinator
 * Coordinates website crawling, requirements extraction, LLM question generation,
 * coverage verification, and schedule construction.
 * Used by both the Express API and the batch evaluation CLI script.
 * Author: Aakarsh Sharma
 */

import { MAX_COVERAGE_PASSES } from '../constants/appConstants.js';
import { logger } from '../utils/logger.js';
import { validateKit } from '../validators/kitSchema.js';
import { crawlCompanySite } from './crawler/crawlerService.js';
import { searchPublicInterviewDiscussion } from './crawler/interviewSearchService.js';
import { checkCoverageGaps } from './coverage/coverageChecker.js';
import {
  extractRequirements,
  synthesizeCompanyBrief,
  generateQuestionsForCategory,
  generateFlashcards,
  generateMissingQuestions,
} from './llm/llmService.js';
import { allocateStudySchedule } from './scheduler/scheduleEngine.js';

/**
 * Executes the complete interview preparation kit generation pipeline.
 *
 * @param {Object} params - Input parameters.
 * @param {string} params.jdText - Job description text.
 * @param {string} params.companyUrl - Company website URL.
 * @param {number} [params.daysAvailable=5] - Available study days before interview.
 * @param {(progress: { step: string, message: string, percent: number }) => void} [params.onProgress] - Optional progress callback.
 * @returns {Promise<{ success: boolean, kit?: Object, error?: { code: string, message: string } }>}
 */
export const runKitGenerationPipeline = async ({
  jdText,
  companyUrl,
  daysAvailable = 5,
  onProgress = () => {},
}) => {
  const startTime = new Date().toISOString();
  const safeJd = (jdText || '').trim();
  const safeDays = Math.max(1, parseInt(daysAvailable || '5', 10));

  logger.info('Starting preparation kit generation pipeline', {
    jdLength: safeJd.length,
    companyUrl,
    days: safeDays,
  });

  try {
    // ── Step 1: Deterministic Requirement Extraction ────────────────────────
    onProgress({ step: 'EXTRACTION', message: 'Extracting role and requirements from job description...', percent: 15 });
    const role = await extractRequirements(safeJd);
    logger.info('Requirements extracted', {
      title: role.title,
      seniority: role.seniority,
      requirementsCount: role.requirements.length,
    });

    // ── Step 2: Intelligent Crawler & Research ──────────────────────────────
    onProgress({ step: 'CRAWLER', message: `Crawling company domain (${companyUrl})...`, percent: 30 });
    const crawlResult = await crawlCompanySite(companyUrl);
    logger.info('Crawl complete', {
      success: crawlResult.success,
      pagesUsedCount: crawlResult.pages_used.length,
    });

    // ── Step 3: Public Interview Discussion Search ──────────────────────────
    onProgress({ step: 'SEARCH', message: 'Retrieving verified public interview discussions...', percent: 45 });
    const interviewSearch = await searchPublicInterviewDiscussion(role.title, companyUrl);

    // ── Step 4: Company Brief Synthesis ─────────────────────────────────────
    onProgress({ step: 'SYNTHESIS', message: 'Synthesizing verified company intelligence brief...', percent: 55 });
    const companyBrief = await synthesizeCompanyBrief(companyUrl, crawlResult.pages, interviewSearch.summary);

    // ── Step 5: Categorized Question Bank Generation ────────────────────────
    onProgress({ step: 'QUESTIONS', message: 'Generating categorized technical & behavioral questions...', percent: 65 });
    const technicalReqs = role.requirements.filter((r) => r.kind === 'technical');
    const behaviouralReqs = role.requirements.filter((r) => r.kind === 'behavioural');
    const domainReqs = role.requirements.filter((r) => r.kind === 'domain');
    const systemDesignReqs = role.requirements.filter((r) => r.text.toLowerCase().includes('design') || r.text.toLowerCase().includes('system') || r.text.toLowerCase().includes('architect'));

    const companyContext = `${companyBrief.summary} ${companyBrief.what_they_do}`;

    // Generate questions for all categories in parallel
    const [technicalQuestions, behaviouralQuestions, domainQuestions, systemDesignQuestions] = await Promise.all([
      generateQuestionsForCategory(technicalReqs, companyContext, 'technical', 1),
      generateQuestionsForCategory(behaviouralReqs, companyContext, 'behavioural', 1),
      generateQuestionsForCategory(domainReqs, companyContext, 'company-fit', 1),
      systemDesignReqs.length > 0
        ? generateQuestionsForCategory(systemDesignReqs, companyContext, 'system-design', 1)
        : Promise.resolve([]),
    ]);

    const rawQuestions = [...technicalQuestions, ...behaviouralQuestions, ...domainQuestions, ...systemDesignQuestions];
    let questions = rawQuestions.map((q, idx) => ({ ...q, id: `q${idx + 1}` }));

    // Ensure questions are not completely empty
    if (questions.length === 0) {
      questions = [
        {
          id: 'q1',
          requirement_ids: role.requirements[0] ? [role.requirements[0].id] : ['r1'],
          category: 'technical',
          prompt: 'Walk us through your primary technical architectural achievements.',
          answer_outline: 'Explain system architecture, technical constraints, and business outcomes.',
          difficulty: 2,
          origin: 'generated',
          isPinned: false,
        },
      ];
    }

    // ── Step 6: Requirement Coverage Check & Second Pass ────────────────────
    onProgress({ step: 'COVERAGE_CHECK', message: 'Running deterministic coverage check loop...', percent: 75 });
    let coverage = checkCoverageGaps(role.requirements, questions);
    let passes = 1;

    while (coverage.uncovered_must_ids.length > 0 && passes < MAX_COVERAGE_PASSES) {
      logger.info('Uncovered must-have requirements detected. Triggering second pass generation', {
        passNumber: passes + 1,
        uncoveredMustIds: coverage.uncovered_must_ids,
      });

      const missingReqs = role.requirements.filter((req) => coverage.uncovered_must_ids.includes(req.id));
      const nextIdOffset = questions.length + 1;
      const additionalQuestions = await generateMissingQuestions(missingReqs, companyContext, nextIdOffset);

      if (additionalQuestions.length > 0) {
        questions = [...questions, ...additionalQuestions];
      }

      passes++;
      // Re-run arithmetic coverage check
      coverage = checkCoverageGaps(role.requirements, questions);
    }

    // ── Step 7: Flashcard Generation ────────────────────────────────────────
    onProgress({ step: 'FLASHCARDS', message: 'Generating spaced-repetition flashcards...', percent: 85 });
    const flashcards = await generateFlashcards(role.requirements, questions);

    // ── Step 8: Deterministic Study Schedule Allocation ──────────────────────
    onProgress({ step: 'SCHEDULE', message: 'Calculating deterministic daily study schedule...', percent: 95 });
    const schedule = allocateStudySchedule(questions, role.requirements, safeDays);

    // ── Step 9: Assemble Final Kit & Schema Validation ──────────────────────
    const pagesUsed = crawlResult.pages_used.length > 0 ? crawlResult.pages_used : [companyUrl || 'https://example.com'];

    let companyName = 'Target Company';
    if (companyUrl) {
      try {
        const rawHost = new URL(companyUrl.startsWith('http') ? companyUrl : `https://${companyUrl}`).hostname.replace('www.', '').split('.')[0];
        if (rawHost) companyName = rawHost.charAt(0).toUpperCase() + rawHost.slice(1);
      } catch {
        companyName = 'Target Company';
      }
    } else {
      const match = safeJd.match(/(?:company|organization)\s*[:-]\s*([A-Za-z0-9\s&.-]{2,30})/i);
      if (match && match[1].trim()) {
        companyName = match[1].trim();
      }
    }

    const rawKit = {
      source: {
        company: companyName,
        company_url: companyUrl || '',
        role: role.title,
        location: 'Not specified',
        jd_chars: safeJd.length,
        researched_at: startTime,
        pages_used: pagesUsed,
      },
      company_brief: {
        summary: companyBrief.summary,
        what_they_do: companyBrief.what_they_do,
        sources: companyBrief.sources.length > 0 ? companyBrief.sources : pagesUsed,
      },
      role: {
        title: role.title,
        seniority: role.seniority,
        responsibilities: role.responsibilities,
        requirements: role.requirements,
      },
      questions,
      flashcards,
      schedule,
      coverage: {
        uncovered_requirement_ids: coverage.uncovered_requirement_ids,
        passes,
      },
    };

    // Strict validation against schema specification
    const validation = validateKit(rawKit);
    if (!validation.success) {
      logger.error('Generated kit failed schema validation', { errors: validation.errors });
      return {
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: `Kit validation failed: ${validation.errors.map((e) => e.message).join('; ')}`,
        },
      };
    }

    onProgress({ step: 'COMPLETE', message: 'Preparation kit generated successfully.', percent: 100 });
    return {
      success: true,
      kit: validation.data,
      error: null,
    };
  } catch (error) {
    logger.error('Pipeline execution encountered unexpected failure', { error: error.message, stack: error.stack });
    return {
      success: false,
      kit: null,
      error: {
        code: 'PIPELINE_ERROR',
        message: error.message || 'An unexpected error occurred during prep kit generation.',
      },
    };
  }
};
