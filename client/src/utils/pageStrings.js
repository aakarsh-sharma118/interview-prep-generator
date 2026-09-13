/**
 * UI String Dictionary
 * Author: Aakarsh Sharma
 *
 * Centralizes button labels, headings, and messages used across the interface.
 */

export const PageStrings = {
  // Navigation & Brand
  BRAND_NAME: 'PrepKit AI',
  AUTHOR_NAME: 'Aakarsh Sharma',
  NAV_DASHBOARD: 'My Kits',
  NAV_NEW_KIT: 'New Kit',
  NAV_PRACTICE: 'Practice',
  NAV_LOGOUT: 'Sign Out',
  NAV_LOGIN: 'Log In',
  NAV_REGISTER: 'Sign Up',

  // Hero Section
  HERO_BADGE: 'AI Interview Intelligence',
  HERO_HEADLINE: 'Turn any job description into an interview kit.',
  HERO_SUBTITLE:
    'Crawl company culture and engineering docs, generate focused practice questions, and map out a day-by-day study schedule tailored to your role.',
  LABEL_JOB_DESCRIPTION: 'Job Description',
  PLACEHOLDER_JOB_DESCRIPTION: 'Paste the role requirements, responsibilities, or entire job description here...',
  LABEL_COMPANY_URL: 'Company Website',
  PLACEHOLDER_COMPANY_URL: 'https://company.com or company.com',
  LABEL_DAYS_AVAILABLE: 'Days Until Interview',
  DAYS_OPTIONS_LABEL: 'Days before interview',
  BTN_GENERATE_KIT: 'Generate Interview Kit',
  BTN_GENERATING: 'Researching & Generating...',
  BTN_UPLOAD_BATCH: 'Batch Upload Roles',

  // Live Console Logs
  CONSOLE_TITLE: 'Live Research Console',
  CONSOLE_IDLE_MSG: 'Ready for input. Paste a job description and company link to start the crawl.',
  CONSOLE_STEP_EXTRACTION: 'Reading job description and pulling out core requirements...',
  CONSOLE_STEP_CRAWLER: 'Visiting company website and locating hiring/about pages...',
  CONSOLE_STEP_SEARCH: 'Checking public discussions and engineering articles...',
  CONSOLE_STEP_SYNTHESIS: 'Summarizing company mission and engineering focus...',
  CONSOLE_STEP_QUESTIONS: 'Drafting questions across technical, behavioural, and system categories...',
  CONSOLE_STEP_SECOND_PASS: 'Checking requirement coverage and closing any gaps...',
  CONSOLE_STEP_SCHEDULE: 'Calculating daily study schedule across available days...',
  CONSOLE_STEP_DONE: 'Done! Preparation kit is ready.',

  // Kit Workspace
  WORKSPACE_TITLE: 'Interview Kit Workspace',
  SECTION_BRIEF_TITLE: 'Company Overview',
  SECTION_BRIEF_SOURCES: 'Pages referenced:',
  SECTION_ROLE_TITLE: 'Role & Requirements',
  SECTION_ROLE_SENIORITY: 'Level',
  SECTION_ROLE_RESPONSIBILITIES: 'Key Responsibilities',
  SECTION_ROLE_REQUIREMENTS: 'Requirements',
  SECTION_QUESTIONS_TITLE: 'Interview Questions',
  SECTION_SCHEDULE_TITLE: 'Study Schedule',
  SECTION_GAP_ANALYZER_TITLE: 'Requirement Coverage Matrix',

  // Editing & Builder Actions
  BADGE_GENERATED: 'Auto',
  BADGE_EDITED: 'Edited',
  BADGE_MANUAL: 'Added',
  BTN_PIN: 'Pin question',
  BTN_UNPIN: 'Unpin question',
  BTN_ADD_QUESTION: 'Add Question',
  BTN_DELETE_QUESTION: 'Delete',
  BTN_REGENERATE_SECTION: 'Regenerate Section',
  BTN_REGENERATE_TOOLTIP: 'Refreshes this section while keeping any questions you edited or pinned.',
  BTN_SAVE_CHANGES: 'Save Changes',
  SAVED_NOTIFICATION: 'Changes saved.',

  // Coverage Gap Analyzer
  GAP_ANALYZER_SUBTITLE: 'Maps requirements to prepared interview questions to make sure nothing gets missed.',
  LABEL_COVERED_MUST: 'Must-Haves Covered',
  LABEL_UNCOVERED_GAPS: 'Gaps',
  LABEL_PASSES_RUN: 'Passes',
  STATUS_VERIFIED: 'All Must-Haves Covered',
  STATUS_GAPS_DETECTED: 'Missing Requirements',

  // Practice Mode
  PRACTICE_TITLE: 'Flashcard Practice',
  PRACTICE_SUBTITLE: 'Review key interview concepts. Rate your confidence to adjust which cards show up next.',
  BTN_FLIP_CARD: 'Click or press Space to flip',
  CARD_FRONT_LABEL: 'Question',
  CARD_BACK_LABEL: 'Talking Points',
  PRACTICE_PROGRESS: 'Progress',
  CARD_COUNTER: (current, total) => `Card ${current} of ${total}`,
  BTN_AGAIN: 'Again',
  BTN_HARD: 'Hard',
  BTN_GOOD: 'Good',
  BTN_EASY: 'Easy',
  PRACTICE_FINISHED_TITLE: 'Practice Session Done!',
  PRACTICE_FINISHED_DESC: 'You finished all the cards in this deck. The next run will prioritize the ones you marked as harder.',
  BTN_RESTART_PRACTICE: 'Review Again',

  // Mock Interview Feature
  MOCK_MODAL_TITLE: 'Quick Mock Screening',
  MOCK_MODAL_DESC: 'Practice answering 3 interview questions with instant feedback on structure and key points.',
  MOCK_QUESTION_LABEL: (num) => `Question ${num} of 3`,
  MOCK_INPUT_PLACEHOLDER: 'Type your answer here (e.g. using the STAR format)...',
  BTN_SUBMIT_ANSWER: 'Submit Answer',
  MOCK_SCORE_TITLE: 'Interview Readiness',

  // Authentication
  LOGIN_TITLE: 'Welcome Back',
  LOGIN_SUBTITLE: 'Sign in to access your saved interview kits.',
  REGISTER_TITLE: 'Create an Account',
  REGISTER_SUBTITLE: 'Start generating personalized prep kits for your interviews.',
  LABEL_NAME: 'Your Name',
  LABEL_EMAIL: 'Email',
  LABEL_PASSWORD: 'Password',
  BTN_LOGIN_SUBMIT: 'Sign In',
  BTN_REGISTER_SUBMIT: 'Create Account',
  NO_ACCOUNT_PROMPT: "Don't have an account?",
  HAVE_ACCOUNT_PROMPT: 'Already have an account?',

  // Errors & Empty States
  EMPTY_KITS_TITLE: 'No kits created yet.',
  EMPTY_KITS_DESC: 'Generate a new kit from the home page or upload a list of job descriptions to get started.',
  ERROR_GENERIC: 'Something went wrong. Please check your inputs and try again.',
};
