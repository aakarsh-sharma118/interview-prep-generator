# AI Interview Prep Kit
> **Author:** Aakarsh Sharma  
> **Repository:** `https://github.com/aakarsh-sharma118/interview-prep-generator`  
> **License:** MIT  

---

## 1. Project Overview & Tech Stack

The **AI Interview Prep Kit** is a full-stack web application and automated research pipeline that transforms job descriptions and company URLs into structured interview preparation kits. The application crawls company domains, parses `robots.txt`, prioritizes relevant subpages (`/careers`, `/handbook`, `/engineering-blog`), looks up interview discussions, extracts role requirements, runs a deterministic coverage loop, and calculates a structured study schedule.

### Technology Stack

| Layer | Technology | Architectural Role |
| :--- | :--- | :--- |
| **Frontend** | **Next.js 14 (App Router) + React 18** | Fast route transitions and responsive layouts. |
| **Styling** | **Tailwind CSS + DaisyUI** | Modern bento grid aesthetic, custom glassmorphism, and responsive dark-mode palettes. |
| **Client State** | **Zustand 5** | Store managing inline edits, pinned question states, and generation progress. |
| **Animations** | **Framer Motion 11** | Interactive live console crawler visualizer, smooth section regeneration, and 3D flip flashcards. |
| **Backend** | **Node.js + Express** | Layered architecture separating retrieval, extraction, generation, scheduling, and persistence. |
| **Database** | **MongoDB + Mongoose** | Document-oriented persistence with an embedded in-memory MongoDB fallback (`mongodb-memory-server`) for zero-setup execution. |
| **Scraping** | **Cheerio + robots-parser + Native Fetch** | Semantic DOM parsing, robots.txt compliance, content-type/size limits (2MB max), and SSRF defenses. |
| **LLM Engine** | **Google Gemini & Groq LLaMA** | Rate-limited multi-pass generation pipeline with a deterministic offline mock engine for reliable testing. |

---

## 2. Setup Instructions

### Prerequisites
- **Node.js:** `v18.0.0` or higher
- **npm:** `v9.0.0` or higher

### Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/aakarsh-sharma118/interview-prep-generator.git
cd interview-prep-generator

# 2. Install dependencies across root, server, and client
npm install
cd server && npm install && cd ..
cd client && npm install && cd ..

# 3. Configure environment variables (optional — zero setup required)
cp .env.example .env

# 4. Start concurrent development servers
npm run dev
```

- **Frontend Application:** `http://localhost:3000`
- **Backend API Server:** `http://localhost:5000`
- **Health Check Endpoint:** `http://localhost:5000/health`

*(Note: If `MONGODB_URI` is omitted in `.env`, the server automatically starts an embedded in-memory MongoDB instance. No external database installation is required).*

---

## 3. Batch Evaluation CLI

The repository includes a batch evaluation CLI tool that runs the complete research, generation, coverage verification, and schedule allocation pipeline:

```bash
npm run evaluate -- --input <cases.json> --output <kits.json>
```

### Example:
```bash
npm run evaluate -- --input tests/fixtures/sample_cases.json --output tests/fixtures/sample_output.json
```

### Key Capabilities:
1. **Unified Pipeline:** Uses the exact same generation pipeline (`runKitGenerationPipeline()`) as the interactive web interface.
2. **Structured Output:** Produces formatted output containing version metadata, generation timestamp, and the array of generated preparation kits.
3. **Resilience:** If an individual case encounters an unreachable domain, it logs the issue, produces an honest kit based on stated requirements, and continues processing remaining cases.
4. **Local Host Testing:** Supports local test servers (e.g., `http://localhost:8099`) by resolving local addresses when `ALLOW_LOCAL_URLS=true`.

---

## 4. Architecture & Directory Structure

```
interview-prep-generator/
├── client/                     # Next.js 14 Frontend
│   ├── app/                    # App Router pages (/, /kits, /kits/[id], /kits/[id]/practice, /login, /register)
│   ├── src/
│   │   ├── api/                # apiClient and centralized apiUrls
│   │   ├── components/         # BentoGridBuilder, LiveExecutionConsole, FlashcardDeck, GapAnalyzerMatrix
│   │   ├── hooks/              # useKitStore, useAuthStore, usePracticeStore (Zustand)
│   │   ├── utils/              # pageStrings.js, appConstants.js, logger.js
│   │   └── __tests__/          # Frontend Vitest test suites
├── server/                     # Express Backend
│   ├── src/
│   │   ├── config/env.js       # Environment configuration
│   │   ├── connections/        # MongoDB connection with embedded fallback
│   │   ├── constants/          # Application constants, HTTP codes, difficulty configurations
│   │   ├── controllers/        # Request handlers (authController, kitController)
│   │   ├── middlewares/        # requireAuth (JWT verification), errorHandler
│   │   ├── models/             # Mongoose schemas (User.js, Kit.js)
│   │   ├── routes/             # Express route definitions (authRoutes, kitRoutes)
│   │   ├── services/           # Business logic layer
│   │   │   ├── crawler/        # crawlerService, ssrfValidator, interviewSearchService
│   │   │   ├── llm/            # llmService, rateLimiter
│   │   │   ├── scheduler/      # Pure arithmetic scheduleEngine
│   │   │   ├── coverage/       # Pure arithmetic coverageChecker
│   │   │   └── pipelineCoordinator.js # Master generation coordinator
│   │   └── validators/         # Zod schema validation
│   └── tests/                  # Backend Vitest test suite
├── scripts/
│   └── evaluate.js             # Batch evaluation CLI runner
├── nginx.conf                  # Nginx reverse proxy configuration
├── render.yaml                 # Render blueprint configuration
└── Dockerfile                  # Multi-stage Docker build
```

---

## 5. Web Retrieval & Link Scoring

Companies organize hiring information across different routes (`/careers`, `/jobs`, `/handbook`, `/engineering-blog`, `/values`). The crawler applies a dynamic heuristic approach:

1. **SSRF Filtering:** Outgoing URLs are validated via `ssrfValidator.js`. Private subnets (`10.0.0.0/8`, `192.168.0.0/16`, `172.16.0.0/12`) and loopbacks are blocked in production environments, with local testing permitted when configured.
2. **Robots.txt Checking:** Fetches and parses `robots.txt` before crawling subpages.
3. **Semantic Link Scoring:** Extracts internal links and scores them using relevance keywords (`interview: +40`, `hiring: +35`, `careers: +30`, `handbook: +30`, `engineering: +20`).
4. **Content Sanitization:** Cleans HTML using Cheerio, stripping boilerplate `<script>`, `<style>`, `<nav>`, and `<footer>` tags while retaining core content.
5. **Rate & Size Limits:** Limits payload sizes to 2MB with request timeouts and polite inter-request pacing.

---

## 6. Multi-Step Pipeline Sequencing

The preparation kit is assembled through deliberate steps:

1. **Extraction:** Parses job description into title, seniority, and structured requirements (`r1..rn`).
2. **Site Crawler:** Crawls homepage, ranks links, and fetches hiring and about pages.
3. **Public Discussions:** Searches for publicly accessible interview process notes or reports.
4. **Brief Synthesis:** Summarizes company mission, products, and engineering focus, citing sources.
5. **Question Bank:** Generates targeted questions linked to requirements across technical, behavioural, and system-design categories.
6. **Coverage Loop:** Deterministic check that calculates requirement coverage and generates targeted questions for any missing must-have requirements.
7. **Flashcards:** Creates concept-checking flashcards linked to requirement IDs.
8. **Schedule Allocation:** Pure math allocation across the exact requested number of study days.
9. **Validation:** Validates output schemas with Zod before database persistence.

---

## 7. Coverage Loop & Verification

Verifying that generated questions address the extracted role requirements is performed deterministically:

$$\text{Coverage Ratio} = \frac{\text{Covered Requirements}}{\text{Total Requirements}}$$

1. **Referential Check:** `checkCoverageGaps(requirements, questions)` checks question links (`requirement_ids: ["r1", "r2"]`).
2. **Targeted Follow-up:** If must-have requirements remain unaddressed, targeted generation runs specifically for the missing IDs (up to 3 passes maximum).
3. **Safety Limit:** The loop terminates once all must-haves are covered or the pass limit is reached.

---

## 8. Preserving User Edits During Section Regeneration

When a user regenerates a specific section (e.g. technical questions):
1. **Partitioning:** Questions in that category are partitioned into preserved items (edited, manually added, or pinned) and replaceable items (untouched generated items).
2. **Regeneration:** New questions are generated only for the unpreserved requirements.
3. **Merging:** New questions are merged alongside preserved items, keeping IDs and custom edits intact.
4. **Smooth Transitions:** The UI applies smooth absolute-fade animations without layout shifts.

---

## 9. Deterministic Study Schedule Engine

The study schedule is calculated via integer arithmetic:
1. **Exact Days:** The number of days in the schedule strictly matches `days_available`.
2. **Integer Minute Blocks:** Sessions use defined time blocks (15, 25, 40 minutes).
3. **Priority Distribution:** Harder and must-have requirements are scheduled earlier in the timeline, with behavioral questions and review sessions placed closer to interview day.
4. **Edge Cases:** Correctly handles 1-day crash courses and extended 30-day schedules.

---

## 10. Automated Testing

The project uses Vitest across both frontend and backend, with Husky pre-commit hooks configured to ensure code quality prior to every commit:

```bash
# Run full test suite (backend + frontend)
npm test

# Run backend tests only
npm run test:server

# Run frontend tests only
npm run test:client

# Git hooks (Husky)
npm run prepare
```

All 31 tests pass across unit and integration suites (18 backend + 13 frontend):
- Schedule engine day invariance and time distribution
- Coverage checker gap detection and ratio calculation
- Schema validation
- User authentication, JWT tokens, and protected routes
- Spaced-repetition flashcard state management
- Zustand auth store session lifecycle and demo login handling
- Pre-commit verification via Husky (`npm test`)

---

## 11. Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for full deployment instructions:
- **Render:** Zero-configuration setup via [`render.yaml`](./render.yaml).
- **Nginx:** Production reverse proxy configuration in [`nginx.conf`](./nginx.conf) with JWT Authorization header forwarding.
- **Docker:** Multi-stage container build in [`Dockerfile`](./Dockerfile).