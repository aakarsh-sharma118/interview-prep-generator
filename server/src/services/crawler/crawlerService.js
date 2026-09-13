/**
 * Web Crawler and Link Scorer
 * Crawls company homepages, checks robots.txt, scores internal links for relevance
 * (/careers, /handbook, /blog), and extracts readable text safely.
 * Author: Aakarsh Sharma
 */

import * as cheerio from 'cheerio';
import robotsParser from 'robots-parser';
import { URL } from 'url';
import { CRAWLER_TIMEOUT_MS, CRAWLER_MAX_PAGES } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { validateUrlSafety } from './ssrfValidator.js';

// ── Keyword Weight Matrices for Dynamic Link Scoring ────────────────────────
// High-priority patterns indicative of hiring methodology, process, or culture
const HIRING_KEYWORDS = [
  { term: 'interview', weight: 40 },
  { term: 'hiring', weight: 35 },
  { term: 'careers', weight: 30 },
  { term: 'career', weight: 28 },
  { term: 'jobs', weight: 25 },
  { term: 'handbook', weight: 30 },
  { term: 'engineering', weight: 20 },
  { term: 'join-us', weight: 20 },
  { term: 'work-with-us', weight: 20 },
  { term: 'about', weight: 15 },
  { term: 'values', weight: 18 },
  { term: 'culture', weight: 18 },
  { term: 'team', weight: 12 },
  { term: 'mission', weight: 10 },
];

// Low-priority / spam / unhelpful paths to penalize or ignore
const IGNORED_PATH_EXTENSIONS = /\.(pdf|zip|tar|gz|jpg|jpeg|png|gif|svg|ico|css|js|woff|woff2|ttf|eot)$/i;
const IGNORED_KEYWORDS = ['login', 'signin', 'signup', 'cart', 'checkout', 'privacy', 'terms', 'cookie', 'legal'];

// Maximum allowed payload size (2 Megabytes) to prevent memory exhaustion
const MAX_PAYLOAD_BYTES = 2 * 1024 * 1024;

// In-memory crawl cache with 15-minute TTL to reduce redundant network requests
const crawlCache = new Map();
const CRAWL_CACHE_TTL_MS = 15 * 60 * 1000;


/**
 * Fetches and parses robots.txt for a host to evaluate crawl allowance.
 *
 * @param {string} targetUrl - Target site URL.
 * @returns {Promise<Object|null>} Robots parser instance or null on failure.
 */
const fetchRobotsParser = async (targetUrl) => {
  try {
    const parsed = new URL(targetUrl);
    const robotsUrl = `${parsed.origin}/robots.txt`;

    // Abort controller with strict timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CRAWLER_TIMEOUT_MS);

    const response = await fetch(robotsUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'InterviewPrepBot/1.0' },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const robotsText = await response.text();
      return robotsParser(robotsUrl, robotsText);
    }
  } catch {
    // Non-fatal if robots.txt does not exist or times out
  }
  return null;
};

/**
 * Fetches and cleans a single HTML document from an external or local URL.
 *
 * @param {string} targetUrl - Target web page URL.
 * @returns {Promise<{ ok: boolean, html?: string, text?: string, title?: string, error?: string }>}
 */
export const fetchCleanPage = async (targetUrl) => {
  // 1. SSRF Safety Verification
  const safetyCheck = validateUrlSafety(targetUrl);
  if (!safetyCheck.isValid) {
    logger.warn('Crawl target blocked by SSRF filter', { url: targetUrl, reason: safetyCheck.reason });
    return { ok: false, error: safetyCheck.reason };
  }

  const normalizedUrl = safetyCheck.normalizedUrl;

  try {
    // 2. HTTP Fetch with Abort Timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CRAWLER_TIMEOUT_MS);

    const response = await fetch(normalizedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'InterviewPrepBot/1.0 (+https://theplatform.local/crawler)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      return { ok: false, error: `HTTP error status ${response.status}` };
    }

    // 3. Content Type & Size Boundaries
    const contentType = response.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('text/plain') && !contentType.includes('application/xhtml')) {
      return { ok: false, error: `Skipped non-HTML content type: ${contentType}` };
    }

    const rawHtml = await response.text();
    if (rawHtml.length > MAX_PAYLOAD_BYTES) {
      return { ok: false, error: 'Document exceeded maximum allowed size limit (2MB).' };
    }

    // 4. HTML Cleaning & Text Extraction via Cheerio
    const $ = cheerio.load(rawHtml);

    // Strip scripts, styles, forms, and boilerplate navigation/footer tags
    $('script, style, noscript, svg, iframe, form').remove();
    $('header, nav, footer, [role="navigation"], [role="banner"]').remove();

    // Extract title
    const title = $('title').text().trim() || $('h1').first().text().trim() || 'Untitled Page';

    // Extract cleaned paragraph and heading text
    const textContent = $('body')
      .text()
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 10000); // Limit text context to top 10,000 characters

    return {
      ok: true,
      html: rawHtml,
      text: textContent,
      title,
    };
  } catch (error) {
    logger.warn('Failed to fetch page', { url: targetUrl, error: error.message });
    return { ok: false, error: error.message };
  }
};

/**
 * Heuristically ranks candidate sub-links extracted from a webpage based on keywords.
 *
 * @param {Array<{ url: string, anchorText: string }>} candidateLinks - Extracted links.
 * @returns {Array<{ url: string, anchorText: string, score: number }>} Sorted ranked links.
 */
export const rankDiscoveredLinks = (candidateLinks) => {
  const scoredLinks = candidateLinks.map((link) => {
    let score = 0;
    const pathAndText = `${link.url} ${link.anchorText}`.toLowerCase();

    // Penalize ignored keywords
    for (const ignored of IGNORED_KEYWORDS) {
      if (pathAndText.includes(ignored)) {
        score -= 20;
      }
    }

    // Reward hiring and engineering keywords
    for (const keyword of HIRING_KEYWORDS) {
      if (pathAndText.includes(keyword.term)) {
        score += keyword.weight;
      }
    }

    return { ...link, score };
  });

  // Filter out negative or zero scores and sort descending
  return scoredLinks
    .filter((link) => link.score > 0)
    .sort((a, b) => b.score - a.score);
};

/**
 * Autonomous crawler that searches a company website for hiring process and company intelligence.
 * Follows relative links and ranks paths dynamically.
 *
 * @param {string} companyUrl - Base website address.
 * @returns {Promise<{
 *   success: boolean,
 *   pages_used: string[],
 *   pages: Array<{ url: string, title: string, text: string, type: string }>,
 *   company_summary: string,
 *   hiring_insights: string,
 *   error: string|null
 * }>}
 */
export const crawlCompanySite = async (companyUrl) => {
  // Validate safety
  const safetyCheck = validateUrlSafety(companyUrl);
  if (!safetyCheck.isValid) {
    return {
      success: false,
      pages_used: [],
      pages: [],
      company_summary: '',
      hiring_insights: '',
      error: safetyCheck.reason || 'Invalid company URL',
    };
  }

  const rootUrl = safetyCheck.normalizedUrl;
  const parsedRoot = new URL(rootUrl);

  // Return cached result if available within TTL window
  const cachedCrawl = crawlCache.get(rootUrl);
  if (cachedCrawl && Date.now() - cachedCrawl.timestamp < CRAWL_CACHE_TTL_MS) {
    logger.info('Returning cached crawl results', { url: rootUrl });
    return cachedCrawl.data;
  }

  // Initialize robots parser
  const robots = await fetchRobotsParser(rootUrl);

  // 1. Fetch Homepage
  logger.info('Crawling company homepage', { url: rootUrl });
  const homepageResult = await fetchCleanPage(rootUrl);

  if (!homepageResult.ok) {
    return {
      success: false,
      pages_used: [],
      pages: [],
      company_summary: 'Company site could not be retrieved.',
      hiring_insights: 'No hiring documentation discoverable.',
      error: homepageResult.error || 'Failed to reach homepage',
    };
  }

  const crawledPages = [
    {
      url: rootUrl,
      title: homepageResult.title,
      text: homepageResult.text,
      type: 'homepage',
    },
  ];
  const pagesUsed = [rootUrl];

  // 2. Discover and Extract Internal Links
  const $ = cheerio.load(homepageResult.html);
  const discoveredLinksMap = new Map();

  $('a[href]').each((_, element) => {
    const rawHref = $(element).attr('href');
    const anchorText = $(element).text().trim();

    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:') || rawHref.startsWith('mailto:')) {
      return;
    }

    if (IGNORED_PATH_EXTENSIONS.test(rawHref)) {
      return;
    }

    try {
      // Resolve relative links against base root URL (handles relative /careers and absolute links)
      const resolvedUrl = new URL(rawHref, rootUrl);

      // Only follow internal links on the same origin (same host & port)
      if (resolvedUrl.origin === parsedRoot.origin) {
        const cleanUrl = resolvedUrl.toString().split('#')[0].replace(/\/+$/, '');
        if (cleanUrl !== rootUrl.replace(/\/+$/, '') && !discoveredLinksMap.has(cleanUrl)) {
          discoveredLinksMap.set(cleanUrl, { url: cleanUrl, anchorText });
        }
      }
    } catch {
      // Skip invalid URLs
    }
  });

  // 3. Rank Links via Semantic Keywords
  const candidateList = Array.from(discoveredLinksMap.values());
  const rankedLinks = rankDiscoveredLinks(candidateList);

  // 4. Fetch Top Ranked Links in Parallel (Up to CRAWLER_MAX_PAGES - 1)
  const maxSubpages = Math.max(1, CRAWLER_MAX_PAGES - 1);
  const selectedLinks = rankedLinks.slice(0, maxSubpages);
  const allowedLinks = selectedLinks.filter((link) => !robots || robots.isAllowed(link.url, 'InterviewPrepBot'));

  const crawlResults = await Promise.allSettled(
    allowedLinks.map(async (link) => {
      logger.info('Crawling ranked subpage', { url: link.url, score: link.score });
      const subpageResult = await fetchCleanPage(link.url);
      return { link, subpageResult };
    })
  );

  for (const item of crawlResults) {
    if (item.status === 'fulfilled') {
      const { link, subpageResult } = item.value;
      if (subpageResult && subpageResult.ok && subpageResult.text && subpageResult.text.length > 50) {
        crawledPages.push({
          url: link.url,
          title: subpageResult.title,
          text: subpageResult.text,
          type: link.url.includes('career') || link.url.includes('job') ? 'hiring' : 'about',
        });
        pagesUsed.push(link.url);
      }
    }
  }

  const result = {
    success: true,
    pages_used: pagesUsed,
    pages: crawledPages,
    company_summary: crawledPages[0]?.text.slice(0, 1500) || '',
    hiring_insights: crawledPages.find((page) => page.type === 'hiring')?.text.slice(0, 1500) || '',
    error: null,
  };

  crawlCache.set(rootUrl, { timestamp: Date.now(), data: result });
  return result;
};
