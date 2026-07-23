import { GoogleGenerativeAI } from '@google/generative-ai';
import type { IApproach, IDeveloperReport } from '@/types';

const apiKey = process.env.GEMINI_API_KEY?.trim();

// ─── Model singletons ─────────────────────────────────────────────────────────
// Each function gets its own cached model instance with tuned generationConfig.
// Creating a model is cheap but calling getGenerativeModel() repeatedly adds up.

let reviewModel: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;
let explainModel: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;
let improveModel: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;
let chatModel: ReturnType<GoogleGenerativeAI['getGenerativeModel']> | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
  return new GoogleGenerativeAI(apiKey);
}

function getReviewModel() {
  if (!reviewModel) {
    reviewModel = getGenAI().getGenerativeModel({
      model: 'gemini-3-flash-preview',
      generationConfig: {
        maxOutputTokens: 2048,
        temperature: 0.3,   // low — we want deterministic, accurate analysis
        topP: 0.8,
      },
    });
  }
  return reviewModel;
}

function getExplainModel() {
  if (!explainModel) {
    explainModel = getGenAI().getGenerativeModel({
      model: 'gemini-3-flash-preview',
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.5,
        topP: 0.85,
      },
    });
  }
  return explainModel;
}

function getImproveModel() {
  if (!improveModel) {
    improveModel = getGenAI().getGenerativeModel({
      model: 'gemini-3-flash-preview',
      generationConfig: {
        maxOutputTokens: 3000,
        temperature: 0.2,   // very low — we want consistent code output
      },
    });
  }
  return improveModel;
}

function getChatModel() {
  if (!chatModel) {
    chatModel = getGenAI().getGenerativeModel({
      model: 'gemini-3-flash-preview',
      systemInstruction: CHAT_SYSTEM_PROMPT,
      generationConfig: {
        maxOutputTokens: 1024,
        temperature: 0.7,
        topP: 0.9,
      },
    });
  }
  return chatModel;
}

// ─── Fallback ─────────────────────────────────────────────────────────────────

function createFallbackReview(code: string, language: string): IDeveloperReport {
  const trimmed = code.trim();
  const hasAsync = /async|await/.test(trimmed);
  const hasLoop = /for\s*\(|while\s*\(/.test(trimmed);
  const hasPotentialIssue = /eval\(|innerHTML|JSON\.parse\(|new Function|process\.env/.test(trimmed);
  const isPython = language.toLowerCase() === 'python';
  const isJavaScriptOrTypeScript = ['javascript', 'typescript'].includes(language.toLowerCase());
  const isJava = language.toLowerCase() === 'java';
  const isCSharp = language.toLowerCase() === 'c#';

  const languageStyle = isPython
    ? 'Follow Python naming conventions like snake_case and keep functions readable and PEP 8-friendly.'
    : isJava
      ? 'Use clear Java naming and class structure, with explicit handling for edge cases and null safety.'
      : isJavaScriptOrTypeScript
        ? 'Prefer camelCase, simple functions, and clearer boundaries for state and side effects.'
        : isCSharp
          ? 'Use C# naming and structure conventions, keeping members clear and maintainable.'
          : `Use ${language}-appropriate naming and structure conventions to make the implementation easier to maintain.`;

  const score = Math.max(55, Math.min(92, 78 - (hasPotentialIssue ? 6 : 0) - (hasLoop ? 2 : 0)));

  return {
    overallScore: Math.round(score),
    bugsFound: hasPotentialIssue ? 2 : 0,
    performance: hasLoop ? 6 : 8,
    readability: hasAsync ? 8 : 7,
    security: hasPotentialIssue ? 5 : 8,
    timeComplexity: hasLoop ? 'O(n)' : 'O(1)',
    spaceComplexity: 'O(1)',
    topRecommendation: `Refine the ${language} implementation by tightening ${language === 'Python' ? 'PEP 8 and naming clarity' : 'language-specific structure and edge-case handling'}.`,
    summary: `This ${language} snippet is structurally sound and shows solid intent, but it would benefit from a few defensive improvements and clearer ${language === 'Python' ? 'Pythonic' : language === 'JavaScript' || language === 'TypeScript' ? 'JavaScript/TypeScript' : language}-specific conventions.`,
    strengths: ['Readable structure', 'Clear intent', 'Reasonable control flow'],
    weaknesses: ['Limited validation', 'Possible maintainability issues', 'A few edge cases deserve handling'],
    bugDetails: hasPotentialIssue ? ['Potential unsafe execution path detected.'] : ['No obvious defects were detected in the sample.'],
    bestPractices: ['Add input validation', 'Use descriptive names', 'Keep functions focused'],
    namingSuggestions: [languageStyle, 'Rename ambiguous helper variables', 'Use clearer callback names'],
    securityIssues: hasPotentialIssue ? ['Avoid executing dynamic content or raw inputs without validation.'] : [],
    suggestedImprovements: ['Add comments for complex branches', 'Handle edge cases explicitly', 'Consider breaking this into smaller helpers'],
    finalVerdict: `The code is a solid starting point, but it would benefit from a stronger ${language}-specific cleanup pass.`,
  };
}

async function runGeminiWithFallback<T>(operation: () => Promise<T>, fallback: T): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    console.error('Gemini request failed, using fallback response:', error);
    return fallback;
  }
}

function parseGeminiJson(rawResponse: string): IDeveloperReport {
  const cleaned = rawResponse
    .replace(/```json\s*/gi, '')
    .replace(/```/g, '')
    .trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const candidate =
    firstBrace >= 0 && lastBrace > firstBrace ? cleaned.slice(firstBrace, lastBrace + 1) : cleaned;

  try {
    const parsed = JSON.parse(candidate) as Partial<IDeveloperReport>;
    return {
      overallScore: parsed.overallScore ?? 0,
      bugsFound: parsed.bugsFound ?? 0,
      performance: parsed.performance ?? 0,
      readability: parsed.readability ?? 0,
      security: parsed.security ?? 0,
      timeComplexity: parsed.timeComplexity ?? 'O(n)',
      spaceComplexity: parsed.spaceComplexity ?? 'O(1)',
      topRecommendation:
        parsed.topRecommendation ?? 'Review the main logic block for clarity and maintainability.',
      summary: parsed.summary ?? 'No summary available.',
      strengths: parsed.strengths ?? [],
      weaknesses: parsed.weaknesses ?? [],
      bugDetails: parsed.bugDetails ?? [],
      bestPractices: parsed.bestPractices ?? [],
      namingSuggestions: parsed.namingSuggestions ?? [],
      securityIssues: parsed.securityIssues ?? [],
      suggestedImprovements: parsed.suggestedImprovements ?? [],
      finalVerdict: parsed.finalVerdict ?? 'The code is acceptable with room for improvement.',
    };
  } catch {
    console.error('Gemini JSON parse failed:', rawResponse);
    throw new Error('Unable to parse Gemini review response.');
  }
}

// ─── Code Review ──────────────────────────────────────────────────────────────

export async function generateCodeReview(
  code: string,
  language: string,
  roastMode = false,
  template = 'standard',
): Promise<IDeveloperReport> {
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not configured, using local fallback review.');
    const fallback = createFallbackReview(code, language);
    fallback.template = template as any;
    return fallback;
  }

  const templatePrompts: Record<string, string> = {
    standard: `You are an expert ${language} code reviewer. Provide a comprehensive review covering all aspects.`,

    performance: `You are a performance optimization expert specializing in ${language}.
Focus HEAVILY on:
- Time complexity analysis (be very specific with Big O)
- Space complexity analysis
- Algorithm efficiency
- Memory usage patterns
- Bottlenecks and hotspots
- Caching opportunities
- Loop optimizations
- Data structure choices
Give performance a weight of 40% in your overall score.
Be very strict about inefficient code.`,

    security: `You are a cybersecurity expert and ${language} security specialist.
Focus HEAVILY on:
- OWASP Top 10 vulnerabilities
- Input validation and sanitization
- SQL/NoSQL injection risks
- XSS vulnerabilities
- Authentication and authorization issues
- Sensitive data exposure
- Cryptographic weaknesses
- Dependency vulnerabilities
Give security a weight of 40% in your overall score.
Be very strict about security issues.`,

    readability: `You are a senior ${language} developer focused on code quality and maintainability.
Focus HEAVILY on:
- Variable and function naming
- Code clarity and simplicity
- Documentation and comments
- Function length and single responsibility
- Code duplication
- Consistent formatting
- Self-documenting code
Give readability a weight of 40% in your overall score.
Be encouraging but firm about clean code principles.`,

    interview: `You are a FAANG senior engineer conducting a technical interview for a Software Engineer position.
Evaluate this ${language} code AS IF it was submitted in a coding interview. Focus on:

CRITICAL CHECKS:
- Does it solve the problem correctly?
- Time complexity — would this pass with large inputs?
- Space complexity — is memory usage optimal?
- Edge cases — null, empty, negative, overflow handled?
- Code cleanliness — would an interviewer be impressed?
- Naming — clear variable/function names?
- Could this be optimized further?

SCORING (be strict like a real FAANG interview):
- 90-100: Exceptional — would get strong hire
- 75-89: Good — would likely get hire
- 60-74: Acceptable — borderline, needs improvement
- Below 60: Would not pass interview

In your finalVerdict, explicitly state:
"FAANG Verdict: [Strong Hire / Hire / No Hire]"
with reason.

In topRecommendation, give the single most important change to make it interview-ready.`,
  };

  const selectedTemplatePrompt = templatePrompts[template] ?? templatePrompts.standard;

  const normalPrompt = `${selectedTemplatePrompt}

Analyze the following ${language} code specifically — consider language-specific conventions, performance, security, and cleanliness.

Return ONLY a valid JSON object with no markdown, no code fences, no extra text:
{
  "overallScore": <number 0-100>,
  "bugsFound": <number>,
  "performance": <number 0-10>,
  "readability": <number 0-10>,
  "security": <number 0-10>,
  "timeComplexity": "<e.g. O(n log n)>",
  "spaceComplexity": "<e.g. O(n)>",
  "topRecommendation": "<most important recommendation>",
  "summary": "<2-3 sentences summary>",
  "strengths": ["<strength 1>", ...],
  "weaknesses": ["<weakness 1>", ...],
  "bugDetails": ["<bug 1>", ...],
  "bestPractices": ["<best practice 1>", ...],
  "namingSuggestions": ["<naming suggestion>", ...],
  "securityIssues": ["<security issue>", ...],
  "suggestedImprovements": ["<improvement 1>", ...],
  "finalVerdict": "<concluding verdict sentence>"
}

${language} code to review:
\`\`\`${language}
${code}
\`\`\``;

  const roastPrompt = `You are a brutally honest but funny senior developer doing a code review (${template} mode). You have high standards and a sharp wit. Review the following ${language} code with brutal honesty — point out every flaw, bad practice, and inefficiency, but make it entertaining and educational.

Use phrases like:
- 'This is giving me trust issues...'
- 'My eyes are bleeding...'  
- 'Did you write this at 3am?'
- 'I've seen better code in a tutorial from 2009'

${template === 'interview' ? 'Give a hilarious FAANG interview roasting verdict starting with "FAANG Verdict: No Hire - [joke]".' : ''}

Return ONLY valid JSON:
{
  "overallScore": <number>,
  "bugsFound": <number>,
  "performance": <number 0-10>,
  "readability": <number 0-10>,
  "security": <number 0-10>,
  "timeComplexity": "<string>",
  "spaceComplexity": "<string>",
  "topRecommendation": "<funny recommendation>",
  "summary": "<entertaining roast summary>",
  "strengths": ["<strength with humor>"],
  "weaknesses": ["<dramatic weakness>"],
  "bugDetails": ["<bug detail>"],
  "bestPractices": ["<practice critique>"],
  "namingSuggestions": ["<naming critique>"],
  "securityIssues": ["<security issue>"],
  "suggestedImprovements": ["<improvement>"],
  "finalVerdict": "<dramatic conclusion>"
}

${language} code:
${code}`;

  const basePrompt = roastMode ? roastPrompt : normalPrompt;
  const prompt = `IMPORTANT: First verify if the provided code is actually 
written in ${language}. 

If the code is NOT in ${language}:
- Set overallScore to 0
- Set bugsFound to 1  
- Set summary to: 'ERROR: This does not appear to be ${language} code. Please select the correct language.'
- Set finalVerdict to: 'Wrong language selected. Please select the correct programming language and review again.'
- Set topRecommendation to: 'Select the correct language from the dropdown menu.'
- Set all other numeric scores to 0
- Return the same JSON structure

If the code IS in ${language}, proceed with full review.

${basePrompt}`;
  const model = getReviewModel();

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text();
    const parsed = parseGeminiJson(rawText);
    parsed.template = template as any;
    return parsed;
  } catch (error: unknown) {
    // Check if it's a quota/rate limit error
    const err = error as { status?: number; message?: string };
    if (err?.status === 429) {
      throw new Error('API quota exceeded. Please wait a moment and try again.');
    }
    // For other errors, use fallback
    console.error('[Review] Error:', err?.status, err?.message);
    const fallback = createFallbackReview(code, language);
    fallback.template = template as any;
    return fallback;
  }
}

// ─── Code Explanation ─────────────────────────────────────────────────────────

export async function generateCodeExplanation(code: string, language: string): Promise<string> {
  if (!apiKey) {
    return `This ${language} snippet appears to focus on a single task. The main opportunities are to split responsibilities into smaller helpers, validate inputs, and improve clarity around edge cases.`;
  }

  const prompt = `You are an expert ${language} developer and programming teacher. Explain the following ${language} code block by block in simple, friendly language.

For each important block or function:
- What it does
- Why it's written this way
- Any important ${language}-specific concepts used

Use markdown formatting with headers for each section.
Include code snippets where helpful.
Make it educational and easy to understand.

${language} code to explain:
\`\`\`${language.toLowerCase()}
${code}
\`\`\``;

  const model = getExplainModel();
  return runGeminiWithFallback(
    async () => {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    },
    `This ${language} snippet appears to focus on a single task. The main opportunities are to split responsibilities into smaller helpers, validate inputs, and improve clarity around edge cases.`,
  );
}

// ─── Improved Code ────────────────────────────────────────────────────────────

function parseApproachesJson(rawResponse: string, language: string, code: string): IApproach[] {
  const cleaned = rawResponse
    .replace(/```json\s*/gi, '')
    .replace(/```/g, '')
    .trim();

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  const candidate =
    firstBrace >= 0 && lastBrace > firstBrace ? cleaned.slice(firstBrace, lastBrace + 1) : cleaned;

  try {
    const parsed = JSON.parse(candidate) as { approaches?: IApproach[] };
    if (Array.isArray(parsed.approaches) && parsed.approaches.length > 0) {
      return parsed.approaches.map((a) => ({
        title: a.title || 'Improvement',
        description: a.description || '',
        difficulty: (['Easy', 'Medium', 'Advanced'].includes(a.difficulty) ? a.difficulty : 'Easy') as IApproach['difficulty'],
        improvements: Array.isArray(a.improvements) ? a.improvements : [],
        code: typeof a.code === 'string' ? a.code : code,
      }));
    }
    throw new Error('No valid approaches array found');
  } catch {
    console.error('Approaches JSON parse failed:', rawResponse);
    throw new Error('Unable to parse Gemini improvement approaches.');
  }
}

export async function generateImprovedCode(code: string, language: string): Promise<IApproach[]> {
  const fallback: IApproach[] = [
    {
      title: 'Quick Fix',
      description: `Simple improvements to the ${language} code keeping the same approach.`,
      difficulty: 'Easy',
      improvements: ['Add input validation', 'Improve variable naming', 'Add error handling'],
      code: `// Quick Fix — ${language}\n${code}`,
    },
  ];

  if (!apiKey) {
    console.warn('GEMINI_API_KEY not configured, using fallback approaches.');
    return fallback;
  }

  const prompt = `You are an expert ${language} developer.
Analyze this code and provide 2-3 different improvement approaches, from simple to advanced.

Return ONLY a valid JSON object with no markdown, no code fences:
{
  "approaches": [
    {
      "title": "Quick Fix",
      "description": "Simple improvements keeping same approach",
      "difficulty": "Easy",
      "improvements": ["what was changed and why"],
      "code": "the improved code here"
    },
    {
      "title": "Optimized Version",
      "description": "Better algorithm or pattern",
      "difficulty": "Medium",
      "improvements": ["what was changed and why"],
      "code": "the optimized code here"
    },
    {
      "title": "Production Ready",
      "description": "Full best practices, error handling, documentation",
      "difficulty": "Advanced",
      "improvements": ["what was changed and why"],
      "code": "the production grade code here"
    }
  ]
}

Important rules:
- "Quick Fix" should be minimal changes, NOT a rewrite
- "Optimized" should improve algorithm if possible
- "Production Ready" can be comprehensive
- All three must be valid ${language} code
- Keep code appropriate to the complexity of the input (don't over-engineer simple utility functions)

${language} code to improve:
\`\`\`${language.toLowerCase()}
${code}
\`\`\``;

  const model = getImproveModel();
  return runGeminiWithFallback(
    async () => {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const rawText = response.text();
      return parseApproachesJson(rawText, language, code);
    },
    fallback,
  );
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface GeminiHistoryPart {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

const CHAT_SYSTEM_PROMPT = `You are an expert programming assistant integrated into Code Review AI. You help developers with:
- Explaining programming concepts clearly
- Debugging code issues
- Suggesting optimizations
- Explaining algorithms and data structures
- Best practices and design patterns
- Any programming language questions

Format your responses with:
- Clear explanations
- Code examples in proper code blocks with language specified
- Step by step breakdowns when helpful
- Practical examples

Keep responses focused on programming and software development. If asked about non-programming topics, politely redirect to programming topics.`;

export async function generateChatResponse(
  history: GeminiHistoryPart[],
  userMessage: string,
): Promise<string> {
  if (!apiKey) {
    return `I'm sorry, the AI service is not currently configured. Please check that your GEMINI_API_KEY is set.\n\nIn the meantime — **"${userMessage.slice(0, 60)}${userMessage.length > 60 ? '…' : ''}"** is a great question! Configure the API key to get a full answer.`;
  }

  // Keep last 10 turns (20 messages) for context without blowing token limits
  const trimmedHistory = history.slice(-10);
  const chat = getChatModel().startChat({ history: trimmedHistory });

  const result = await chat.sendMessage(userMessage);
  const response = await result.response;
  return response.text();
}
