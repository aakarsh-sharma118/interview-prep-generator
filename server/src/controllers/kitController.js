/**
 * Interview Kit Controller
 * Handles kit generation, listing, updating, section regeneration, and deletions.
 * Author: Aakarsh Sharma
 */

import { HTTP_STATUS } from '../constants/appConstants.js';
import { Kit } from '../models/Kit.js';
import { runKitGenerationPipeline } from '../services/pipelineCoordinator.js';
import { allocateStudySchedule } from '../services/scheduler/scheduleEngine.js';
import { checkCoverageGaps } from '../services/coverage/coverageChecker.js';
import { generateQuestionsForCategory, synthesizeCompanyBrief } from '../services/llm/llmService.js';
import { crawlCompanySite } from '../services/crawler/crawlerService.js';
import { logger } from '../utils/logger.js';

/**
 * Generates and saves a new interview preparation kit.
 *
 * @param {import('express').Request} req - Request.
 * @param {import('express').Response} res - Response.
 */
export const createKit = async (req, res) => {
  try {
    const { jdText, companyUrl, daysAvailable } = req.body;

    if (!jdText || jdText.trim().length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Job description text is required.' },
      });
    }

    logger.info('User initiated kit generation', { userId: req.user._id, companyUrl });

    // Run master pipeline
    const pipelineResult = await runKitGenerationPipeline({
      jdText,
      companyUrl,
      daysAvailable: parseInt(daysAvailable || '5', 10),
    });

    if (!pipelineResult.success || !pipelineResult.kit) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: pipelineResult.error || {
          code: 'GENERATION_FAILED',
          message: 'Failed to generate preparation kit.',
        },
      });
    }

    // Persist kit to database associated with authenticated user
    const savedKit = await Kit.create({
      userId: req.user._id,
      ...pipelineResult.kit,
    });

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: savedKit,
    });
  } catch (error) {
    logger.error('Error creating preparation kit', { error: error.message });
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: error.message || 'Internal server error.' },
    });
  }
};

/**
 * Retrieves all kits owned by the authenticated user.
 *
 * @param {import('express').Request} req - Request.
 * @param {import('express').Response} res - Response.
 */
export const listKits = async (req, res) => {
  try {
    const kits = await Kit.find({ userId: req.user._id })
      .select('source role schedule.days_available coverage createdAt')
      .sort({ createdAt: -1 });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: kits,
    });
  } catch (error) {
    logger.error('Error listing kits', { error: error.message });
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to retrieve kits.' },
    });
  }
};

/**
 * Retrieves a single preparation kit by ID with user ownership verification.
 *
 * @param {import('express').Request} req - Request.
 * @param {import('express').Response} res - Response.
 */
export const getKitById = async (req, res) => {
  try {
    const kit = await Kit.findOne({ _id: req.params.id, userId: req.user._id });
    if (!kit) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Preparation kit not found or access denied.' },
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: kit,
    });
  } catch (error) {
    logger.error('Error fetching kit by ID', { error: error.message });
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to fetch preparation kit.' },
    });
  }
};

/**
 * Updates kit contents (inline edits, reordering, additions/deletions).
 *
 * @param {import('express').Request} req - Request.
 * @param {import('express').Response} res - Response.
 */
export const updateKit = async (req, res) => {
  try {
    const kitId = req.params.id;
    const updates = req.body;

    const existingKit = await Kit.findOne({ _id: kitId, userId: req.user._id });
    if (!existingKit) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Preparation kit not found.' },
      });
    }

    // Apply updates
    if (updates.questions) existingKit.questions = updates.questions;
    if (updates.flashcards) existingKit.flashcards = updates.flashcards;
    if (updates.company_brief) existingKit.company_brief = updates.company_brief;
    if (updates.role) existingKit.role = updates.role;
    if (updates.schedule) existingKit.schedule = updates.schedule;

    // Recalculate deterministic coverage
    const coverage = checkCoverageGaps(existingKit.role.requirements, existingKit.questions);
    existingKit.coverage = {
      uncovered_requirement_ids: coverage.uncovered_requirement_ids,
      passes: existingKit.coverage?.passes || 1,
    };

    await existingKit.save();

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: existingKit,
    });
  } catch (error) {
    logger.error('Error updating kit', { error: error.message });
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to update preparation kit.' },
    });
  }
};

/**
 * Regenerates a single section (brief, category, or schedule) while strictly PRESERVING
 * user-edited and pinned items.
 *
 * @param {import('express').Request} req - Request.
 * @param {import('express').Response} res - Response.
 */
export const regenerateSection = async (req, res) => {
  try {
    const kitId = req.params.id;
    const { section, categoryName } = req.body;

    const kit = await Kit.findOne({ _id: kitId, userId: req.user._id });
    if (!kit) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Preparation kit not found.' },
      });
    }

    // ── Case 1: Regenerate Company Brief ─────────────────────────────────────
    if (section === 'company_brief') {
      logger.info('Regenerating company brief section', { kitId });
      const crawl = await crawlCompanySite(kit.source.company_url);
      const newBrief = await synthesizeCompanyBrief(kit.source.company_url, crawl.pages);
      kit.company_brief = newBrief;
    }
    // ── Case 2: Regenerate Preparation Schedule ──────────────────────────────
    else if (section === 'schedule') {
      logger.info('Regenerating preparation schedule section', { kitId });
      const newSchedule = allocateStudySchedule(
        kit.questions,
        kit.role.requirements,
        kit.schedule.days_available
      );
      kit.schedule = newSchedule;
    }
    // ── Case 3: Regenerate Question Category (Hardest State Problem) ─────────
    else if (section === 'category' && categoryName) {
      logger.info('Regenerating question category while preserving user edits', {
        kitId,
        category: categoryName,
      });

      // 1. Partition questions in this category: preserved vs untouched generated
      const preservedQuestions = kit.questions.filter((q) => {
        // Keep question if in different category OR edited/manual OR pinned
        return (
          q.category !== categoryName ||
          q.origin === 'edited' ||
          q.origin === 'manual' ||
          q.isPinned === true
        );
      });

      // 2. Identify requirements targeted by this category
      const relevantReqs = kit.role.requirements.filter((req) => {
        if (categoryName === 'technical') return req.kind === 'technical';
        if (categoryName === 'behavioural') return req.kind === 'behavioural';
        if (categoryName === 'company-fit') return req.kind === 'domain';
        return true;
      });

      const companyContext = `${kit.company_brief.summary} ${kit.company_brief.what_they_do}`;
      const nextOffset = kit.questions.length + 1;

      // 3. Generate fresh questions for the category
      const freshQuestions = await generateQuestionsForCategory(
        relevantReqs.length > 0 ? relevantReqs : kit.role.requirements,
        companyContext,
        categoryName,
        nextOffset
      );

      // 4. Merge preserved questions with freshly generated ones
      kit.questions = [...preservedQuestions, ...freshQuestions];

      // 5. Recompute coverage and harmonize schedule
      const coverage = checkCoverageGaps(kit.role.requirements, kit.questions);
      kit.coverage = {
        uncovered_requirement_ids: coverage.uncovered_requirement_ids,
        passes: (kit.coverage?.passes || 1) + 1,
      };

      kit.schedule = allocateStudySchedule(
        kit.questions,
        kit.role.requirements,
        kit.schedule.days_available
      );
    } else {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: { code: 'INVALID_SECTION', message: 'Unsupported section for regeneration.' },
      });
    }

    await kit.save();

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: kit,
    });
  } catch (error) {
    logger.error('Error regenerating section', { error: error.message });
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to regenerate section.' },
    });
  }
};

/**
 * Deletes a preparation kit.
 *
 * @param {import('express').Request} req - Request.
 * @param {import('express').Response} res - Response.
 */
export const deleteKit = async (req, res) => {
  try {
    const kit = await Kit.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!kit) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Preparation kit not found.' },
      });
    }

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: 'Preparation kit deleted successfully.',
    });
  } catch (error) {
    logger.error('Error deleting kit', { error: error.message });
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Failed to delete kit.' },
    });
  }
};

/**
 * Handles batch role file upload.
 * Takes an array of { jd, company_url, days } and generates kits in sequence.
 *
 * @param {import('express').Request} req - Request.
 * @param {import('express').Response} res - Response.
 */
export const batchUploadKits = async (req, res) => {
  try {
    const { cases } = req.body;
    if (!Array.isArray(cases) || cases.length === 0) {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        error: { code: 'INVALID_INPUT', message: 'Cases array is required.' },
      });
    }

    const createdKits = [];
    for (const caseItem of cases) {
      const result = await runKitGenerationPipeline({
        jdText: caseItem.jd || caseItem.jdText,
        companyUrl: caseItem.company_url || caseItem.companyUrl,
        daysAvailable: caseItem.days || caseItem.daysAvailable || 5,
      });

      if (result.success && result.kit) {
        const saved = await Kit.create({
          userId: req.user._id,
          ...result.kit,
        });
        createdKits.push(saved);
      }
    }

    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      data: createdKits,
    });
  } catch (error) {
    logger.error('Error in batch upload', { error: error.message });
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: { code: 'SERVER_ERROR', message: 'Batch upload failed.' },
    });
  }
};
