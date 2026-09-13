/**
 * LLM Generation Service
 * Handles multi-pass generation for company briefs, role requirements, questions,
 * and flashcards. Works with Gemini, Groq, OpenAI, or an offline mock generator.
 * Author: Aakarsh Sharma
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY, GEMINI_MODEL, GROQ_API_KEY, OPENAI_API_KEY, LLM_PROVIDER } from '../../config/env.js';
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
      const modelCandidates = [
        GEMINI_MODEL,
        'gemini-3.6-flash',
        'gemini-3.5-flash',
        'gemini-3.1-flash-lite',
        'gemini-flash-latest',
      ].filter((m, i, arr) => m && arr.indexOf(m) === i);

      let lastError = null;
      for (const modelName of modelCandidates) {
        try {
          const model = genAI.getGenerativeModel({
            model: modelName,
            generationConfig: { responseMimeType: 'application/json' },
            systemInstruction,
          });

          const result = await model.generateContent(userPrompt);
          const response = await result.response;
          return response.text();
        } catch (err) {
          lastError = err;
          logger.warn(`Gemini generation on model ${modelName} encountered an issue, testing next candidate`, {
            error: err.message,
          });
        }
      }

      logger.error('All Gemini model candidates failed, gracefully falling back to deterministic offline engine', {
        error: lastError?.message,
      });
      return generateOfflineMockResponse(systemInstruction, userPrompt);
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
const cleanRequirementText = (text) => {
  if (!text) return 'Core engineering responsibilities';
  return text
    .replace(/^[-*•\d.)\s]+/, '')
    .replace(/^(must have|should have|experience with|proficient in|strong knowledge of|proven track record in|deep experience with|solid understanding of)\s+/i, '')
    .trim();
};

const synthesizeTailoredInterviewQuestion = (req, category, questionId, index) => {
  const text = req?.text || '';
  const lower = text.toLowerCase();
  const cleaned = cleanRequirementText(text);

  let prompt = '';
  let answer_outline = '';
  let difficulty = index % 2 === 0 ? 3 : 2;

  if (category === 'behavioural') {
    difficulty = 2;
    if (lower.includes('mentor') || lower.includes('junior') || lower.includes('coach') || lower.includes('teach')) {
      prompt = `Describe a situation where you mentored a teammate or junior engineer to overcome a technical obstacle or meet a demanding project milestone. How did you structure your guidance?`;
      answer_outline = `1. Situation & Task: The engineering context, teammate's challenge, and project timeline.\n2. Action: Pairing sessions, actionable constructive PR feedback, and setting clear incremental goals.\n3. Result: Measurable improvement in teammate autonomy, code quality, and on-time delivery.`;
    } else if (lower.includes('collaborat') || lower.includes('cross-functional') || lower.includes('product designer') || lower.includes('stakeholder') || lower.includes('partner')) {
      prompt = `Tell us about a time when you had to align conflicting technical and business priorities with product designers or stakeholders. How did you navigate the trade-offs?`;
      answer_outline = `1. Empathy & Communication: Understanding business drivers and design goals.\n2. Pragmatic compromise: Scoping phased technical releases or MVP milestones.\n3. Outcome: Delivery of high-value user features without accumulating crippling technical debt.`;
    } else if (lower.includes('lead') || lower.includes('sprint') || lower.includes('ownership') || lower.includes('priorit')) {
      prompt = `Walk through an initiative where you took ownership of an ambiguous technical roadmap. How did you break down the scope and rally the team to execution?`;
      answer_outline = `1. RFC / Design Doc process: Clarifying constraints, architectural options, and risks.\n2. Task breakdown: Milestones, risk de-risking spikes, and delegation.\n3. Retrospective: Key learnings and establishing reusable engineering playbooks.`;
    } else {
      prompt = `Behavioral & Leadership: Can you describe a real-world scenario where you demonstrated "${cleaned}"? What were the key decisions and what was the impact?`;
      answer_outline = `1. STAR Framework: Context, Challenge, Actions taken, and Quantified Results.\n2. Decision rationale: Evaluating trade-offs and communicating with clarity.\n3. Growth takeaway: Reflection on what went well and what you would refine next time.`;
    }
  } else if (category === 'system-design') {
    difficulty = 3;
    if (lower.includes('api') || lower.includes('rest') || lower.includes('graphql') || lower.includes('idempotenc') || lower.includes('payment')) {
      prompt = `Design a fault-tolerant, high-throughput API gateway and processing pipeline that enforces strict idempotency, rate limiting, and zero data loss during upstream outages.`;
      answer_outline = `1. Idempotency layer: Client idempotency tokens, Redis atomic locks (SETNX), and response replay buffers.\n2. Rate limiting & traffic shaping: Leaky-bucket or token-bucket algorithms at the edge.\n3. Resiliency: Circuit breakers, exponential backoff with jitter, and dead-letter queue (DLQ) retry topologies.`;
    } else if (lower.includes('cache') || lower.includes('redis') || lower.includes('memcached')) {
      prompt = `Architect a multi-tiered distributed caching infrastructure for a high-traffic read/write application. How do you handle cache invalidation, cold starts, and cache stampedes?`;
      answer_outline = `1. Topology: Cache-Aside vs Write-Through vs Write-Behind trade-offs.\n2. Stampede prevention: Probabilistic early expiration (XFetch) or mutex locking.\n3. Consistency: Event-driven invalidation via CDC (Change Data Capture) or Kafka topics.`;
    } else if (lower.includes('database') || lower.includes('postgres') || lower.includes('sql') || lower.includes('nosql')) {
      prompt = `Design a distributed persistence layer supporting millions of concurrent transactions with predictable P99 latency. How do you approach sharding, replication lag, and partition tolerance?`;
      answer_outline = `1. Data modeling: Relational vs document trade-offs, composite keys, and indexing strategy.\n2. Scaling: Read replicas, horizontal sharding by tenant/user ID, and connection pool sizing.\n3. Consistency vs Availability: Balancing ACID requirements with BASE read performance under network partitions.`;
    } else {
      prompt = `System Design & Distributed Scalability: Design an end-to-end architecture capable of scaling "${cleaned}" to handle 100x traffic spikes with high availability.`;
      answer_outline = `1. Architecture overview: CDN, Load Balancer, Stateless microservices, and Async event queues.\n2. Data storage: Partitioning strategy, caching layers, and database replica topology.\n3. Failure domains: Graceful degradation, circuit breakers, and comprehensive SLO/SLA observability.`;
    }
  } else if (category === 'company-fit') {
    prompt = `Strategic Domain Alignment: Based on your background in "${cleaned}", how will you accelerate our product velocity and solve core user pain points in this role?`;
    answer_outline = `1. Direct relevance: Connecting previous engineering successes to the target company's business challenges.\n2. User empathy: Understanding the end-user journey and commercial impact of technical quality.\n3. Execution mindset: How you ramp up quickly and contribute to engineering excellence from day 30.`;
    difficulty = 2;
  } else {
    // Technical category
    if (lower.includes('react') || lower.includes('frontend') || lower.includes('javascript') || lower.includes('typescript') || lower.includes('web')) {
      prompt = `Modern Web Architecture: How do you build maintainable, responsive web applications with React and TypeScript? Discuss render optimization, state isolation, and Core Web Vitals profiling.`;
      answer_outline = `1. Render lifecycle: Minimizing re-renders using React.memo, useMemo, and fine-grained state structures.\n2. Server state vs client state: Managing caching layers (React Query/Zustand) and optimistic UI updates.\n3. Web vitals: Reducing LCP/CLS via code-splitting, dynamic imports, and asset optimization.`;
      difficulty = lower.includes('senior') || lower.includes('staff') ? 3 : 2;
    } else if (lower.includes('node') || lower.includes('express') || lower.includes('backend') || lower.includes('server')) {
      prompt = `Production Backend Engineering: Walk through how you diagnose event loop lag, memory leaks, and unhandled promise rejections in high-traffic Node.js services.`;
      answer_outline = `1. Node.js runtime: Understanding event loop phases (timers, I/O polling, microtasks/macrotasks).\n2. Memory diagnostics: Generating heap snapshots, analyzing V8 garbage collection overhead, and stream backpressure.\n3. Reliability: Graceful shutdown signals (SIGTERM), unhandledRejection handlers, and healthcheck probes.`;
      difficulty = 3;
    } else if (lower.includes('python') || lower.includes('django') || lower.includes('fastapi')) {
      prompt = `Python Service Architecture: How do you optimize high-throughput Python web services, manage async concurrency with asyncio/FastAPI, and avoid GIL contention?`;
      answer_outline = `1. Concurrency: Asyncio event loop vs multi-process worker pools (Gunicorn/Uvicorn).\n2. Memory & performance: Profiling CPU bottlenecks, generator streaming, and typing validation.\n3. Architecture: Layered architecture, dependency injection, and comprehensive automated test suites.`;
      difficulty = 2;
    } else if (lower.includes('data') || lower.includes('ml') || lower.includes('machine learning') || lower.includes('pytorch') || lower.includes('ai')) {
      prompt = `Data & ML Engineering: How do you architect reproducible data transformations and deploy ML inference models with low-latency SLAs and drift monitoring?`;
      answer_outline = `1. Feature engineering: Pipeline reproducibility, schema validation, and vectorized operations.\n2. Serving architecture: Batching, model quantization, and containerized microservices.\n3. Observability: Tracking inference latency, prediction drift, and automated retraining triggers.`;
      difficulty = 3;
    } else if (lower.includes('cloud') || lower.includes('aws') || lower.includes('kubernetes') || lower.includes('docker') || lower.includes('ci/cd') || lower.includes('devops')) {
      prompt = `Cloud Infrastructure & Delivery: How do you architect immutable container deployment pipelines with zero-downtime rollouts, automated rollbacks, and secrets management?`;
      answer_outline = `1. Container design: Multi-stage Docker builds, minimal base images, and vulnerability scanning.\n2. Orchestration: Kubernetes deployments, rolling update vs blue-green strategies, and pod anti-affinity.\n3. Observability: Infrastructure as Code (Terraform), centralized logs, and automated Prometheus alerts.`;
      difficulty = 3;
    } else if (lower.includes('database') || lower.includes('sql') || lower.includes('postgres') || lower.includes('mongo')) {
      prompt = `Database Architecture & Optimization: Given an indexing and query latency bottleneck for "${cleaned}", how do you diagnose query execution plans and optimize table schemas?`;
      answer_outline = `1. Analysis: Reading EXPLAIN ANALYZE, identifying sequential scans, and index bloat.\n2. Optimization: Partial indexes, composite indexes following leftmost prefix rule, and query restructuring.\n3. Scalability: Table partitioning, vacuum tuning, and connection pooling.`;
      difficulty = 3;
    } else {
      prompt = `Technical Deep Dive: How do you apply and validate "${cleaned}" in high-scale production systems? Detail architectural patterns, failure cases, and test strategies.`;
      answer_outline = `1. Core technical foundations and real-world architectural design patterns.\n2. Handling edge cases, error recovery, and security implications.\n3. Testing strategy: Unit, integration, and performance benchmarking.`;
      difficulty = index % 2 === 0 ? 3 : 2;
    }
  }

  return {
    id: questionId,
    requirement_ids: [req.id],
    category,
    prompt,
    answer_outline,
    difficulty,
    origin: 'generated',
    isPinned: false,
  };
};

const fallbackExtractRequirements = (jdText) => {
  const lines = jdText.split('\n').map((l) => l.trim()).filter(Boolean);
  let title = 'Software Engineer';
  for (const line of lines) {
    const match = line.match(/(?:role|job title|title|position|opening)\s*[:-]\s*(.+)/i);
    if (match && match[1].trim()) {
      title = match[1].trim().replace(/^[-*•\s]+/, '');
      break;
    }
  }
  if (title === 'Software Engineer' && lines.length > 0) {
    for (let i = 0; i < Math.min(3, lines.length); i++) {
      const l = lines[i].replace(/^#+\s*/, '').trim();
      if (!l.toLowerCase().startsWith('company') && !l.toLowerCase().startsWith('location') && !l.toLowerCase().startsWith('about') && l.length > 3 && l.length < 60) {
        title = l.replace(/^role\s*[:-]?\s*/i, '').trim();
        break;
      }
    }
  }

  const requirements = [];
  lines.slice(1).forEach((line, index) => {
    if (line.length > 15 && requirements.length < 8) {
      const isMust = !line.toLowerCase().includes('bonus') && !line.toLowerCase().includes('preferred');
      const isBehavioural = line.toLowerCase().includes('lead') || line.toLowerCase().includes('mentor') || line.toLowerCase().includes('communicat');
      requirements.push({
        id: `r${index + 1}`,
        text: cleanRequirementText(line),
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
    seniority: title.toLowerCase().includes('senior') ? 'Senior' : (title.toLowerCase().includes('lead') ? 'Lead' : 'Mid'),
    responsibilities: ['Architect and deliver core features', 'Collaborate across cross-functional engineering teams'],
    requirements,
  };
};

const fallbackGenerateQuestions = (requirements, category, startIndex) => {
  return requirements.map((req, idx) =>
    synthesizeTailoredInterviewQuestion(req, category, `q${startIndex + idx}`, idx)
  );
};

const generateOfflineMockResponse = (systemInstruction, userPrompt) => {
  if (systemInstruction.includes('job description parser')) {
    const jdMatch = userPrompt.match(/<<<UNTRUSTED_CONTENT>>>([\s\S]*?)<<<END_UNTRUSTED_CONTENT>>>/);
    const jdContent = jdMatch ? jdMatch[1].trim() : userPrompt;
    const lines = jdContent.split('\n').map((l) => l.trim()).filter(Boolean);

    // Extract exact job title from JD
    let title = 'Software Engineer';
    for (const line of lines) {
      const match = line.match(/(?:role|job title|title|position|opening)\s*[:-]\s*(.+)/i);
      if (match && match[1].trim()) {
        title = match[1].trim().replace(/^[-*•\s]+/, '');
        break;
      }
    }
    if (title === 'Software Engineer' && lines.length > 0) {
      for (let i = 0; i < Math.min(3, lines.length); i++) {
        const l = lines[i].replace(/^#+\s*/, '').trim();
        if (!l.toLowerCase().startsWith('company') && !l.toLowerCase().startsWith('location') && !l.toLowerCase().startsWith('about') && l.length > 3 && l.length < 60) {
          title = l.replace(/^role\s*[:-]?\s*/i, '').trim();
          break;
        }
      }
    }

    const lowerTitle = title.toLowerCase();
    const lowerJd = jdContent.toLowerCase();
    let seniority = 'Mid';
    if (lowerTitle.includes('staff') || lowerJd.includes('staff engineer')) seniority = 'Staff';
    else if (lowerTitle.includes('principal') || lowerJd.includes('principal engineer')) seniority = 'Principal';
    else if (lowerTitle.includes('lead') || lowerTitle.includes('manager') || lowerTitle.includes('head')) seniority = 'Lead';
    else if (lowerTitle.includes('senior') || lowerTitle.includes('sr.') || lowerJd.includes('5+ years') || lowerJd.includes('7+ years')) seniority = 'Senior';
    else if (lowerTitle.includes('junior') || lowerTitle.includes('jr.') || lowerTitle.includes('associate') || lowerTitle.includes('intern')) seniority = 'Junior';

    const requirements = [];
    const responsibilities = [];

    // Scan lines for requirements, skills, and duties
    lines.forEach((line) => {
      const lower = line.toLowerCase();
      const isBullet = /^[-*•\d.)\s]+/.test(line);

      if (lower.startsWith('role:') || lower.startsWith('company:') || lower.startsWith('location:') || lower.startsWith('about')) {
        return;
      }

      if (lower.includes('must') || lower.includes('require') || lower.includes('experience') || lower.includes('know') || lower.includes('bonus') || lower.includes('plus') || lower.includes('years') || isBullet) {
        const isMust = !lower.includes('bonus') && !lower.includes('plus') && !lower.includes('nice') && !lower.includes('preferred');
        const isBehavioural = lower.includes('mentor') || lower.includes('lead') || lower.includes('collaborat') || lower.includes('communicat') || lower.includes('team');
        const isDomain = lower.includes('fintech') || lower.includes('payment') || lower.includes('security') || lower.includes('compliance') || lower.includes('e-commerce') || lower.includes('health');

        const cleanText = line.replace(/^[-*•\d.)\s]+/, '').trim();
        if (cleanText.length > 10 && requirements.length < 10) {
          requirements.push({
            id: `r${requirements.length + 1}`,
            text: cleanText,
            kind: isBehavioural ? 'behavioural' : isDomain ? 'domain' : 'technical',
            priority: isMust ? 'must' : 'nice',
          });
        }
      }

      if (lower.includes('design and build') || lower.includes('collaborate') || lower.includes('maintain') || lower.includes('deliver') || lower.includes('architect') || lower.includes('lead')) {
        if (responsibilities.length < 4) {
          responsibilities.push(line.replace(/^[-*•\d.)\s]+/, '').trim());
        }
      }
    });

    if (requirements.length === 0) {
      requirements.push({
        id: 'r1',
        text: 'Core software engineering principles, system implementation, and testing',
        kind: 'technical',
        priority: 'must',
      });
    }

    if (responsibilities.length === 0) {
      responsibilities.push(
        `Design and deliver core architecture and features for ${title}`,
        'Collaborate with cross-functional engineering, product, and design teams'
      );
    }

    return JSON.stringify({
      title,
      seniority,
      responsibilities,
      requirements,
    });
  }

  if (systemInstruction.includes('research analyst synthesizing company intelligence')) {
    // Extract company name if present in prompt
    let compName = 'the company';
    const compMatch = userPrompt.match(/company(?:Url)?[:\s]+(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+)/i);
    if (compMatch && compMatch[1]) {
      compName = compMatch[1].charAt(0).toUpperCase() + compMatch[1].slice(1);
    }

    return JSON.stringify({
      summary: `${compName} is a high-growth technology platform delivering modern infrastructure and mission-critical services.`,
      what_they_do: `${compName} builds scalable software platforms, APIs, and cloud services for enterprise and global consumers.`,
      sources: ['https://example.com/about'],
    });
  }

  if (systemInstruction.includes('Target Category:')) {
    const catMatch = systemInstruction.match(/Target Category: "([^"]+)"/);
    const category = catMatch ? catMatch[1] : 'technical';

    const startMatch = userPrompt.match(/Start question IDs with offset q(\d+)/);
    const startIndex = startMatch ? parseInt(startMatch[1], 10) : 1;

    // Parse the actual requirements array passed in userPrompt
    let reqs = [];
    try {
      const jsonStart = userPrompt.indexOf('[');
      const jsonEnd = userPrompt.lastIndexOf(']');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        reqs = JSON.parse(userPrompt.slice(jsonStart, jsonEnd + 1));
      }
    } catch {
      const reqMatches = [...userPrompt.matchAll(/"id":\s*"([^"]+)"/g)].map((m) => m[1]);
      reqs = reqMatches.map((id) => ({ id, text: 'core engineering requirements' }));
    }

    if (!Array.isArray(reqs) || reqs.length === 0) {
      reqs = [{ id: 'r1', text: 'Core engineering standards and system execution' }];
    }

    const questions = reqs.map((req, index) =>
      synthesizeTailoredInterviewQuestion(req, category, `q${startIndex + index}`, index)
    );

    return JSON.stringify({ questions });
  }

  // Flashcards mock response: generate tailored cards directly referencing requirement text
  let reqs = [];
  try {
    const jsonStart = userPrompt.indexOf('[');
    const jsonEnd = userPrompt.lastIndexOf(']');
    if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
      reqs = JSON.parse(userPrompt.slice(jsonStart, jsonEnd + 1));
    }
  } catch {
    const reqMatches = [...userPrompt.matchAll(/"id":\s*"(r\d+)"/g)].map((m) => m[1]);
    reqs = reqMatches.map((id) => ({ id, text: 'Core architectural invariants' }));
  }

  if (!Array.isArray(reqs) || reqs.length === 0) {
    reqs = [{ id: 'r1', text: 'Core architectural invariants' }];
  }

  const flashcards = reqs.map((req, index) => {
    const cleaned = cleanRequirementText(req.text || req.id);
    return {
      id: `f${index + 1}`,
      front: `Core Concept: How do you implement and validate ${cleaned}?`,
      back: `Key Talking Points:\n• Architectural trade-offs & design choices\n• Failure recovery and fault tolerance\n• Observability and production metrics`,
      requirement_ids: [req.id || `r${index + 1}`],
    };
  });

  return JSON.stringify({ flashcards });
};
