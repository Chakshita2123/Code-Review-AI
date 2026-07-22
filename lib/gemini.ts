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

export async function generateCodeReview(code: string, language: string, roastMode = false): Promise<IDeveloperReport> {
  if (!apiKey) {
    console.warn('GEMINI_API_KEY not configured, using local fallback review.');
    return createFallbackReview(code, language);
  }

  const normalPrompt = `You are an expert ${language} code reviewer with deep knowledge of ${language} best practices, idioms, and common pitfalls.

Analyze the following ${language} code specifically — consider:
- ${language}-specific best practices and conventions
- ${language} naming conventions
- ${language}-specific performance considerations
- ${language}-specific security vulnerabilities
- Common ${language} anti-patterns to avoid

Return ONLY a valid JSON object with no markdown, no code fences, no extra text:
{
  "overallScore": <number 0-100>,
  "bugsFound": <number>,
  "performance": <number 0-10>,
  "readability": <number 0-10>,
  "security": <number 0-10>,
  "timeComplexity": "<e.g. O(n log n)>",
  "spaceComplexity": "<e.g. O(n)>",
  "topRecommendation": "<most important language-specific suggestion>",
  "summary": "<2-3 sentences, mention ${language} specifically>",
  "strengths": ["<${language}-specific strength>", ...],
  "weaknesses": ["<${language}-specific weakness>", ...],
  "bugDetails": ["<bug 1>", ...],
  "bestPractices": ["<${language} best practice>", ...],
  "namingSuggestions": ["<follow ${language} naming convention>", ...],
  "securityIssues": ["<${language}-specific security issue>", ...],
  "suggestedImprovements": ["<improvement 1>", ...],
  "finalVerdict": "<concluding sentence mentioning ${language}>"
}

${language} code to review:
\`\`\`${language}
${code}
\`\`\``;

  const roastPrompt = `You are a brutally honest but funny senior developer doing a code review. You have high standards and a sharp wit. Review the following ${language} code with brutal honesty — point out every flaw, bad practice, and inefficiency, but make it entertaining and educational, not mean-spirited.

Use phrases like:
- 'This is giving me trust issues...'
- 'My eyes are bleeding...'  
- 'Did you write this at 3am?'
- 'I've seen better code in a tutorial from 2009'
- 'The good news is... actually there is no good news'

But also genuinely help them improve.

Return the SAME JSON structure as normal reviews but make the summary, strengths, weaknesses, finalVerdict entertaining and funny while still being accurate.

Return ONLY valid JSON, no markdown:
{
  "overallScore": <number>,
  "bugsFound": <number>,
  "performance": <number 0-10>,
  "readability": <number 0-10>,
  "security": <number 0-10>,
  "timeComplexity": "<string>",
  "spaceComplexity": "<string>",
  "topRecommendation": "<funny but accurate>",
  "summary": "<entertaining roast summary>",
  "strengths": ["<genuine strength with humor>"],
  "weaknesses": ["<weakness described dramatically>"],
  "bugDetails": ["<bug described with flair>"],
  "bestPractices": ["<practice with commentary>"],
  "namingSuggestions": ["<naming critique>"],
  "securityIssues": ["<security issue>"],
  "suggestedImprovements": ["<improvement>"],
  "finalVerdict": "<dramatic entertaining conclusion>"
}

${language} code:
${code}`;

  const basePrompt = roastMode ? roastPrompt : normalPrompt;
  const prompt = `IMPORTANT: First verify if the provided code is actually 
written in ${language}. 

If the code is NOT in ${language}:
- Set overallScore to 0
- Set bugsFound to 1  
- Set summary to: 'ERROR: This does not appear to be 
  ${language} code. The code seems to be written in a 
  different language. Please select the correct language 
  from the dropdown and try again.'
- Set finalVerdict to: 'Wrong language selected. Please 
  select the correct programming language and review again.'
- Set topRecommendation to: 'Select the correct language 
  from the dropdown menu.'
- Set all other numeric scores to 0
- Return the same JSON structure

If the code IS in ${language}, proceed with full review.

${basePrompt}`;
  const model = getReviewModel();

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const rawText = response.text();
    return parseGeminiJson(rawText);
  } catch (error: unknown) {
    // Check if it's a quota/rate limit error
    const err = error as { status?: number; message?: string };
    if (err?.status === 429) {
      throw new Error('API quota exceeded. Please wait a moment and try again.');
    }
    // For other errors, use fallback
    console.error('[Review] Error:', err?.status, err?.message);
    return createFallbackReview(code, language);
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
