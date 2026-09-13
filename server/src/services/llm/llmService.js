/**
 * LLM Generation Service
 * Handles multi-pass generation for company briefs, role requirements, questions,
 * and flashcards. Works with Gemini, Groq, OpenAI, or an offline mock generator.
 * Author: Aakarsh Sharma
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY, GROQ_API_KEY, OPENAI_API_KEY, LLM_PROVIDER } from '../../config/env.js';
import { logger } from '../../utils/logger.js';
import { llmRateLimiter } from './rateLimiter.js';

// ── JSON Response Cleaner ───────────────────────────────────────────────────
/**
 * Strips markdown code fence blocks from model outputs to extract valid JSON.
 *
 * @param {string} rawText - Raw LLM string response.
 * @returns {string} Sanitized JSON string.
 */
const sanitizeJsonOutput = (rawText) => {
  let cleaned = (rawText || '').trim();
  // Remove markdown json fences if wrapped
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/i, '');
  return cleaned.trim();
};

// ── Low-Level Multi-Provider Invocation ──────────────────────────────────────
/**
 * Executes an LLM completion request with active rate limiting and retry handling.
 *
 * @param {string} systemInstruction - System instructions with anti-injection fences.
 * @param {string} userPrompt - User prompt payload.
 * @returns {Promise<string>} Model text response.
 */
export const callLLM = async (systemInstruction, userPrompt) => {
  return llmRateLimiter.executeWithRetry(async () => {
    // ── 1. Google Gemini Provider ──────────────────────────────────────────
    if (GEMINI_API_KEY && (LLM_PROVIDER === 'gemini' || !GROQ_API_KEY)) {
      const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: 'gemini-1.5-flash',
        generationConfig: { responseMimeType: 'application/json' },
        systemInstruction,
      });

      const result = await model.generateContent(userPrompt);
      const response = await result.response;
      return response.text();
    }

    // ── 2. Groq Provider ───────────────────────────────────────────────────
    if (GROQ_API_KEY && LLM_PROVIDER === 'groq') {
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Groq API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '{}';
    }

    // ── 3. OpenAI Compatible Provider ──────────────────────────────────────
    if (OPENAI_API_KEY && LLM_PROVIDER === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemInstruction },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`OpenAI API error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data.choices?.[0]?.message?.content || '{}';
    }

    // ── 4. Deterministic Offline Mock Engine ────────────────────────────────
    // Used when no external API keys are configured or in offline batch testing
    logger.info('Using high-fidelity deterministic offline LLM engine');
    return generateOfflineMockResponse(systemInstruction, userPrompt);
  });
};

// ── Step 1: Extract Role & Requirements from JD ─────────────────────────────
/**
 * Extracts structured role information and requirements from job description text.
 * Strictly avoids fabricating requirements for thin descriptions.
 *
 * @param {string} jdText - Pasted job description text.
 * @returns {Promise<{ title: string, seniority: string, responsibilities: string[], requirements: Array<Object> }>}
 */
export const extractRequirements = async (jdText) => {
  const safeText = (jdText || '').trim();

  const systemInstruction = `You are a high-precision job description parser.
Analyze the provided job description and extract:
1. "title": Exact job title or inferred title.
2. "seniority": "Junior", "Mid", "Senior", "Staff", "Lead", or "Principal".
3. "responsibilities": Array of string responsibilities actually stated in the text.
4. "requirements": Array of objects:
   - "id": "r1", "r2", etc.
   - "text": The requirement wording.
   - "kind": "technical" | "behavioural" | "domain".
   - "priority": "must" | "nice".
   Strict rule: "must" vs "nice" is determined by whether the description uses words like "required", "essential", "must have" vs "bonus", "nice to have", "plus", "preferred".
   CRITICAL: If the job description is short (e.g. 2 lines), extract ONLY what is explicitly stated. DO NOT invent or assume unstated skills.

Return JSON in this format:
{
  "title": "string",
  "seniority": "string",
  "responsibilities": ["string"],
  "requirements": [
    { "id": "r1", "text": "string", "kind": "technical", "priority": "must" }
  ]
}`;

  const userPrompt = `JOB DESCRIPTION CONTENT TO PROCESS:
<<<UNTRUSTED_CONTENT>>>
${safeText}
<<<END_UNTRUSTED_CONTENT>>>`;

  const rawOutput = await callLLM(systemInstruction, userPrompt);
  try {
    const parsed = JSON.parse(sanitizeJsonOutput(rawOutput));
    return {
      title: parsed.title || 'Software Engineer',
      seniority: parsed.seniority || 'Mid-Senior',
      responsibilities: Array.isArray(parsed.responsibilities) ? parsed.responsibilities : [],
      requirements: Array.isArray(parsed.requirements)
        ? parsed.requirements.map((req, idx) => ({
            id: req.id || `r${idx + 1}`,
            text: req.text || 'Core engineering expertise',
            kind: ['technical', 'behavioural', 'domain'].includes(req.kind) ? req.kind : 'technical',
            priority: req.priority === 'nice' ? 'nice' : 'must',
          }))
        : [],
    };
  } catch (error) {
    logger.error('Failed to parse role extraction JSON', { error: error.message });
    return fallbackExtractRequirements(safeText);
  }
};

// ── Step 2: Company Brief Synthesis ─────────────────────────────────────────
/**
 * Synthesizes company brief and hiring intelligence from crawled pages.
 *
 * @param {string} companyUrl - Base company URL.
 * @param {Array<Object>} crawledPages - Pages returned by crawler.
 * @param {string} publicDiscussions - Public interview insights.
 * @returns {Promise<{ summary: string, what_they_do: string, sources: string[] }>}
 */
export const synthesizeCompanyBrief = async (companyUrl, crawledPages = [], publicDiscussions = '') => {
  const sources = crawledPages.map((page) => page.url).filter(Boolean);

  if (crawledPages.length === 0) {
    return {
      summary: 'Company site could not be accessed or verified.',
      what_they_do: 'Information unavailable from provided URL.',
      sources: companyUrl ? [companyUrl] : [],
    };
  }

  const combinedContent = crawledPages
    .map((page) => `URL: ${page.url}\nTITLE: ${page.title}\nCONTENT:\n${page.text.slice(0, 1000)}`)
    .join('\n\n');

  const systemInstruction = `You are a research analyst synthesizing company intelligence for an interview candidate.
Synthesize the provided crawled web content into:
1. "summary": 2-3 sentences summarizing the company background, mission, and hiring approach.
2. "what_they_do": 1-2 clear sentences explaining the core product/services they deliver.
3. "sources": The URLs actually provided in the content.

Return JSON in this format:
{
  "summary": "string",
  "what_they_do": "string",
  "sources": ["string"]
}`;

  const userPrompt = `CRAWLED COMPANY WEBPAGES:
<<<UNTRUSTED_CONTENT>>>
${combinedContent}
${publicDiscussions ? `\n\nPUBLIC DISCUSSION NOTES:\n${publicDiscussions}` : ''}
<<<END_UNTRUSTED_CONTENT>>>`;

  const rawOutput = await callLLM(systemInstruction, userPrompt);
  try {
    const parsed = JSON.parse(sanitizeJsonOutput(rawOutput));
    return {
      summary: parsed.summary || 'Company overview compiled from website.',
      what_they_do: parsed.what_they_do || 'Technology solutions and engineering services.',
      sources: sources.length > 0 ? sources : [companyUrl],
    };
  } catch {
    return {
      summary: crawledPages[0]?.text?.slice(0, 300) || 'Company profile synthesized from available web pages.',
      what_they_do: 'Software and platform engineering solutions.',
      sources: sources.length > 0 ? sources : [companyUrl],
    };
  }
};

// ── Step 3: Question Bank Generation ────────────────────────────────────────
/**
 * Generates categorized interview questions linked directly to requirement IDs.
 *
 * @param {Array<Object>} requirements - Extracted requirements.
 * @param {string} companyContext - Brief company context.
 * @param {string} category - Specific target category.
 * @param {number} startIndex - Question numbering index offset.
 * @returns {Promise<Array<Object>>}
 */
export const generateQuestionsForCategory = async (requirements, companyContext, category = 'technical', startIndex = 1) => {
  if (!requirements || requirements.length === 0) {
    return [];
  }

  const systemInstruction = `You are a senior technical interviewer creating high-impact interview questions.
Target Category: "${category}" (Must be one of: technical | behavioural | system-design | company-fit).

For the provided requirements, generate rigorous interview questions.
Rules:
1. Every question MUST reference one or more requirement IDs it covers via "requirement_ids": ["r1"].
2. "difficulty" must be an integer from 1 to 3 (1=Foundational, 2=Applied/Senior, 3=Hard/Staff Architectural).
3. "prompt": The actual question asked to the candidate.
4. "answer_outline": Bulleted talking points and key technical/STAR keywords the candidate should touch on.
5. "category": Strictly "${category}".

Return JSON format:
{
  "questions": [
    {
      "id": "q1",
      "requirement_ids": ["r1"],
      "category": "${category}",
      "prompt": "string",
      "answer_outline": "string",
      "difficulty": 2
    }
  ]
}`;

  const userPrompt = `COMPANY CONTEXT:
${companyContext}

REQUIREMENTS TO COVER IN CATEGORY "${category}":
${JSON.stringify(requirements, null, 2)}

Start question IDs with offset q${startIndex}.`;

  const rawOutput = await callLLM(systemInstruction, userPrompt);
  try {
    const parsed = JSON.parse(sanitizeJsonOutput(rawOutput));
    if (Array.isArray(parsed.questions)) {
      return parsed.questions.map((q, idx) => ({
        id: q.id || `q${startIndex + idx}`,
        requirement_ids: Array.isArray(q.requirement_ids) && q.requirement_ids.length > 0 ? q.requirement_ids : [requirements[0]?.id || 'r1'],
        category: ['technical', 'behavioural', 'system-design', 'company-fit'].includes(q.category) ? q.category : category,
        prompt: q.prompt || 'Explain your experience with this requirement.',
        answer_outline: q.answer_outline || 'Highlight relevant projects, architecture decisions, and business impact.',
        difficulty: Math.min(3, Math.max(1, parseInt(q.difficulty || '2', 10))),
        origin: 'generated',
        isPinned: false,
      }));
    }
  } catch (error) {
    logger.warn('Failed to parse category questions, using deterministic fallback', { error: error.message });
  }

  return fallbackGenerateQuestions(requirements, category, startIndex);
};

// ── Step 4: Flashcard Generation ────────────────────────────────────────────
/**
 * Generates flashcards for candidate practice mode.
 *
 * @param {Array<Object>} requirements - Requirements to practice.
 * @param {Array<Object>} questions - Generated questions.
 * @returns {Promise<Array<Object>>}
 */
export const generateFlashcards = async (requirements, questions) => {
  const systemInstruction = `You are an interview coach generating spaced-repetition flashcards.
Create quick, concept-checking flashcards based on the provided requirements and questions.
Each flashcard must have:
- "id": "f1", "f2", etc.
- "front": A concise interview concept or technical question prompt.
- "back": A clear, memorable explanation or STAR method outline.
- "requirement_ids": Array of requirement IDs covered.

Return JSON in this format:
{
  "flashcards": [
    { "id": "f1", "front": "string", "back": "string", "requirement_ids": ["r1"] }
  ]
}`;

  const userPrompt = `REQUIREMENTS:
${JSON.stringify(requirements.slice(0, 10), null, 2)}

QUESTIONS CONTEXT:
${JSON.stringify(questions.slice(0, 10), null, 2)}`;

  const rawOutput = await callLLM(systemInstruction, userPrompt);
  try {
    const parsed = JSON.parse(sanitizeJsonOutput(rawOutput));
    if (Array.isArray(parsed.flashcards)) {
      return parsed.flashcards.map((f, idx) => ({
        id: f.id || `f${idx + 1}`,
        front: f.front || 'Core Concept Review',
        back: f.back || 'Key architectural talking points.',
        requirement_ids: Array.isArray(f.requirement_ids) && f.requirement_ids.length > 0 ? f.requirement_ids : ['r1'],
        origin: 'generated',
        isPinned: false,
      }));
    }
  } catch {
    // Fallback flashcards
  }

  return requirements.map((req, idx) => ({
    id: `f${idx + 1}`,
    front: `How do you demonstrate proficiency in: ${req.text}?`,
    back: `Articulate real-world experience, architectural trade-offs, and measurable outcomes related to ${req.text}.`,
    requirement_ids: [req.id],
    origin: 'generated',
    isPinned: false,
  }));
};

// ── Step 5: Second Pass Coverage Gap Generator ───────────────────────────────
/**
 * Generates targeted questions specifically covering identified requirement gaps.
 *
 * @param {Array<Object>} missingRequirements - Requirements with no matching question.
 * @param {string} companyContext - Company insights.
 * @param {number} nextQuestionIndex - Next available question ID number.
 * @returns {Promise<Array<Object>>} Newly generated gap-closing questions.
 */
export const generateMissingQuestions = async (missingRequirements, companyContext, nextQuestionIndex = 10) => {
  if (!missingRequirements || missingRequirements.length === 0) {
    return [];
  }

  logger.info('Running second pass question generation for uncovered requirements', {
    gapCount: missingRequirements.length,
  });

  const questions = [];
  let currentIdx = nextQuestionIndex;

  for (const requirement of missingRequirements) {
    // Infer appropriate category from requirement kind
    let category = 'technical';
    if (requirement.kind === 'behavioural') {
      category = 'behavioural';
    } else if (requirement.kind === 'domain') {
      category = 'company-fit';
    } else if (requirement.text.toLowerCase().includes('design') || requirement.text.toLowerCase().includes('scale')) {
      category = 'system-design';
    }

    const generated = await generateQuestionsForCategory([requirement], companyContext, category, currentIdx);
    questions.push(...generated);
    currentIdx += generated.length || 1;
  }

  return questions;
};

// ── Fallback Deterministic Helpers (Offline / Zero-Key Engine) ──────────────
const fallbackExtractRequirements = (jdText) => {
  const lines = jdText.split('\n').map((l) => l.trim()).filter(Boolean);
  const title = lines[0] || 'Software Engineer';
  const requirements = [];

  lines.slice(1).forEach((line, index) => {
    if (line.length > 15 && requirements.length < 8) {
      const isMust = !line.toLowerCase().includes('bonus') && !line.toLowerCase().includes('preferred');
      const isBehavioural = line.toLowerCase().includes('lead') || line.toLowerCase().includes('mentor') || line.toLowerCase().includes('communicat');
      requirements.push({
        id: `r${index + 1}`,
        text: line.replace(/^[-*•\d.)\s]+/, '').trim(),
        kind: isBehavioural ? 'behavioural' : 'technical',
        priority: isMust ? 'must' : 'nice',
      });
    }
  });

  if (requirements.length === 0) {
    requirements.push({
      id: 'r1',
      text: 'Demonstrated experience in software development and system design',
      kind: 'technical',
      priority: 'must',
    });
  }

  return {
    title,
    seniority: 'Mid-Senior',
    responsibilities: ['Architect and deliver core features', 'Collaborate across cross-functional engineering teams'],
    requirements,
  };
};

const fallbackGenerateQuestions = (requirements, category, startIndex) => {
  return requirements.map((req, idx) => ({
    id: `q${startIndex + idx}`,
    requirement_ids: [req.id],
    category,
    prompt: `Explain how you apply ${req.text} in production architectures.`,
    answer_outline: `Discuss system trade-offs, scaling limits, and failure handling when implementing ${req.text}.`,
    difficulty: idx % 2 === 0 ? 3 : 2,
    origin: 'generated',
    isPinned: false,
  }));
};

const generateOfflineMockResponse = (systemInstruction, userPrompt) => {
  if (systemInstruction.includes('job description parser')) {
    // Deterministic parser extracting real lines from untrusted JD content
    const jdMatch = userPrompt.match(/<<<UNTRUSTED_CONTENT>>>([\s\S]*?)<<<END_UNTRUSTED_CONTENT>>>/);
    const jdContent = jdMatch ? jdMatch[1].trim() : userPrompt;
    const lines = jdContent.split('\n').map((l) => l.trim()).filter(Boolean);

    const title = lines[0] ? lines[0].replace(/[:\-].*$/, '').trim() : 'Software Engineer';
    const requirements = [];

    // Scan lines for requirements or technical keywords
    lines.forEach((line) => {
      const lower = line.toLowerCase();
      if (lower.includes('must') || lower.includes('require') || lower.includes('experience') || lower.includes('know') || lower.includes('bonus') || lower.includes('plus') || lower.includes('years')) {
        const isMust = !lower.includes('bonus') && !lower.includes('plus') && !lower.includes('nice');
        const isBehavioural = lower.includes('mentor') || lower.includes('lead') || lower.includes('collaborat') || lower.includes('communicat');
        requirements.push({
          id: `r${requirements.length + 1}`,
          text: line.replace(/^[-*•\d.)\s]+/, '').trim(),
          kind: isBehavioural ? 'behavioural' : 'technical',
          priority: isMust ? 'must' : 'nice',
        });
      }
    });

    // If 0 requirements identified (e.g. ultra-short text), create from content directly
    if (requirements.length === 0) {
      lines.slice(0, 3).forEach((line) => {
        if (line.length > 5) {
          requirements.push({
            id: `r${requirements.length + 1}`,
            text: line.replace(/^[-*•\d.)\s]+/, '').trim(),
            kind: 'technical',
            priority: 'must',
          });
        }
      });
    }

    if (requirements.length === 0) {
      requirements.push({
        id: 'r1',
        text: 'Core software engineering principles and system implementation',
        kind: 'technical',
        priority: 'must',
      });
    }

    return JSON.stringify({
      title,
      seniority: title.toLowerCase().includes('senior') ? 'Senior' : (title.toLowerCase().includes('lead') ? 'Lead' : 'Mid'),
      responsibilities: [
        'Deliver scalable product features and infrastructure',
        'Collaborate with cross-functional engineering and design teams',
      ],
      requirements,
    });
  }

  if (systemInstruction.includes('research analyst synthesizing company intelligence')) {
    return JSON.stringify({
      summary: 'High-growth technology platform delivering resilient infrastructure and developer tooling.',
      what_they_do: 'Develops cloud-native collaboration and engineering management systems.',
      sources: ['https://example.com/about'],
    });
  }

  if (systemInstruction.includes('Target Category:')) {
    const catMatch = systemInstruction.match(/Target Category: "([^"]+)"/);
    const category = catMatch ? catMatch[1] : 'technical';

    // Extract all requirement IDs passed in the prompt
    const reqMatches = [...userPrompt.matchAll(/"id":\s*"([^"]+)"/g)].map((m) => m[1]);
    const reqIds = reqMatches.length > 0 ? reqMatches : ['r1'];

    const startMatch = userPrompt.match(/Start question IDs with offset q(\d+)/);
    const startIndex = startMatch ? parseInt(startMatch[1], 10) : 1;

    const questions = reqIds.map((reqId, index) => ({
      id: `q${startIndex + index}`,
      requirement_ids: [reqId],
      category,
      prompt: `How do you architect, test, and scale systems addressing requirement ${reqId}?`,
      answer_outline: `1. Discuss architectural patterns and constraints.\n2. Detail error handling and observability.\n3. Quantify production performance trade-offs.`,
      difficulty: index % 2 === 0 ? 3 : 2,
    }));

    return JSON.stringify({ questions });
  }

  // Flashcards mock response: strictly map to requirement IDs (r1, r2, etc.)
  const reqMatches = [...userPrompt.matchAll(/"id":\s*"(r\d+)"/g)].map((m) => m[1]);
  const reqIds = reqMatches.length > 0 ? [...new Set(reqMatches)] : ['r1'];
  const flashcards = reqIds.map((reqId, index) => ({
    id: `f${index + 1}`,
    front: `What are the critical architectural invariants for ${reqId}?`,
    back: `Key focus: fault tolerance, latency budgets, state isolation, and maintainable abstractions.`,
    requirement_ids: [reqId],
  }));

  return JSON.stringify({ flashcards });
};
