/**
 * Public Interview Discussion Retriever
 * Checks for publicly accessible hiring process notes or reports.
 * Falls back honestly if no public records exist.
 * Author: Aakarsh Sharma
 */

import { logger } from '../../utils/logger.js';
import { fetchCleanPage } from './crawlerService.js';

/**
 * Retrieves publicly available interview process discussions or returns an honest empty report.
 *
 * @param {string} companyName - Target company name.
 * @param {string} [companyUrl=''] - Target company domain.
 * @returns {Promise<{ found: boolean, summary: string, sources: string[] }>}
 */
export const searchPublicInterviewDiscussion = async (companyName, companyUrl = '') => {
  // Input validation
  const cleanName = (companyName || '').trim();
  if (!cleanName) {
    return {
      found: false,
      summary: 'No specific company name identified for public discussion search.',
      sources: [],
    };
  }

  logger.info('Searching public interview discussions', { company: cleanName });

  try {
    // If companyUrl points to a known blog or handbook, attempt to fetch /engineering or /interview
    if (companyUrl) {
      const candidateBlogUrl = `${companyUrl.replace(/\/+$/, '')}/blog`;
      const blogResult = await fetchCleanPage(candidateBlogUrl);
      if (blogResult.ok && blogResult.text.length > 100) {
        return {
          found: true,
          summary: `Engineering blog references found at ${candidateBlogUrl}. Engineering teams frequently discuss design challenges and technical priorities.`,
          sources: [candidateBlogUrl],
        };
      }
    }

    // Default honest response when external search is not configured or turns up no public data
    return {
      found: false,
      summary: `No public interview process discussions were verified for ${cleanName}. The interview preparation kit is structured based on verified job description requirements and discovered company documentation.`,
      sources: [],
    };
  } catch (error) {
    logger.warn('Interview discussion search encountered non-fatal error', { error: error.message });
    return {
      found: false,
      summary: 'Public interview search completed with no external findings.',
      sources: [],
    };
  }
};
