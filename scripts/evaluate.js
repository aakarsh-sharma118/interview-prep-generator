/**
 * Batch Evaluation Runner
 * Runs the interview kit pipeline across test cases and outputs structured results.
 *
 * Usage:
 *   npm run evaluate -- --input <cases.json> --output <kits.json> [--concurrency 2]
 *
 * Author: Aakarsh Sharma
 */

import fs from 'fs';
import path from 'path';
import { runKitGenerationPipeline } from '../server/src/services/pipelineCoordinator.js';
import { logger } from '../server/src/utils/logger.js';

/**
 * Parses command-line arguments formatted as --flag value.
 *
 * @param {string[]} args - Process arguments array.
 * @returns {Record<string, string>} Parsed arguments map.
 */
const parseCommandLineArguments = (args) => {
  const parsedArgs = {};
  for (let index = 0; index < args.length; index++) {
    const currentArg = args[index];
    if (currentArg.startsWith('--')) {
      const key = currentArg.slice(2);
      const nextArg = args[index + 1];
      if (nextArg && !nextArg.startsWith('--')) {
        parsedArgs[key] = nextArg;
        index++;
      } else {
        parsedArgs[key] = 'true';
      }
    }
  }
  return parsedArgs;
};

// ── Main Execution Flow ─────────────────────────────────────────────────────
const main = async () => {
  const rawArguments = process.argv.slice(2);
  const args = parseCommandLineArguments(rawArguments);

  const inputPath = args.input || args.i;
  const outputPath = args.output || args.o;

  if (!inputPath || !outputPath) {
    logger.error('Missing mandatory CLI arguments: --input and --output are required.');
    logger.info('Usage: npm run evaluate -- --input <cases.json> --output <kits.json>');
    process.exit(1);
  }

  const resolvedInputPath = path.resolve(process.cwd(), inputPath);
  const resolvedOutputPath = path.resolve(process.cwd(), outputPath);

  logger.info('Starting batch evaluation run', {
    inputPath: resolvedInputPath,
    outputPath: resolvedOutputPath,
  });

  // 1. Read and Parse Input Cases File
  if (!fs.existsSync(resolvedInputPath)) {
    logger.error('Input cases file not found', { path: resolvedInputPath });
    process.exit(1);
  }

  let testCases = [];
  try {
    const fileContent = fs.readFileSync(resolvedInputPath, 'utf-8');
    testCases = JSON.parse(fileContent);
    if (!Array.isArray(testCases)) {
      throw new Error('Input cases file must contain a top-level JSON array.');
    }
  } catch (error) {
    logger.error('Failed to parse input cases JSON', { error: error.message });
    process.exit(1);
  }

  logger.info(`Loaded ${testCases.length} case(s) for batch processing`);

  // 2. Process Cases Sequentially with Error Isolation
  const generatedKits = [];

  for (let caseIndex = 0; caseIndex < testCases.length; caseIndex++) {
    const caseItem = testCases[caseIndex];
    const caseId = caseItem.id || `case-${String(caseIndex + 1).padStart(2, '0')}`;
    const jdText = caseItem.jd || '';
    const companyUrl = caseItem.company_url || '';
    const days = parseInt(caseItem.days || '5', 10);

    logger.info(`Processing case [${caseIndex + 1}/${testCases.length}]: ID=${caseId}`, {
      companyUrl,
      days,
      jdChars: jdText.length,
    });

    try {
      const pipelineResult = await runKitGenerationPipeline({
        jdText,
        companyUrl,
        daysAvailable: days,
        onProgress: ({ step, percent }) => {
          logger.debug(`[${caseId}] Pipeline Step: ${step} (${percent}%)`);
        },
      });

      if (pipelineResult.success && pipelineResult.kit) {
        logger.info(`Successfully generated kit for case ${caseId}`);
        generatedKits.push({
          id: caseId,
          status: 'ok',
          kit: pipelineResult.kit,
          error: null,
        });
      } else {
        logger.warn(`Pipeline produced failure record for case ${caseId}`, { error: pipelineResult.error });
        generatedKits.push({
          id: caseId,
          status: 'failed',
          kit: null,
          error: pipelineResult.error || {
            code: 'GENERATION_FAILED',
            message: 'Unable to produce valid preparation kit.',
          },
        });
      }
    } catch (caseError) {
      logger.error(`Unexpected exception processing case ${caseId}`, { error: caseError.message });
      generatedKits.push({
        id: caseId,
        status: 'failed',
        kit: null,
        error: {
          code: 'UNHANDLED_EXCEPTION',
          message: caseError.message || 'An unhandled exception occurred.',
        },
      });
    }
  }

  // 3. Write Output Results
  const outputPayload = {
    version: '1.0',
    generated_at: new Date().toISOString(),
    kits: generatedKits,
  };

  // Ensure output directory exists
  const outputDir = path.dirname(resolvedOutputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(resolvedOutputPath, JSON.stringify(outputPayload, null, 2), 'utf-8');

  logger.info('Batch evaluation completed successfully', {
    totalCases: testCases.length,
    successfulKits: generatedKits.filter((k) => k.status === 'ok').length,
    failedKits: generatedKits.filter((k) => k.status === 'failed').length,
    outputPath: resolvedOutputPath,
  });
};

// Execute runner
main().catch((error) => {
  logger.error('Fatal batch evaluation runner failure', { error: error.message });
  process.exit(1);
});
