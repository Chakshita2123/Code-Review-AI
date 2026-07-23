import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import Review from '@/models/Review';
import User from '@/models/User';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface StreamSession {
  user: {
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
}

export async function POST(request: NextRequest) {
  const session = (await auth()) as StreamSession | null;
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { code, language, roastMode, template } = await request.json();
  if (!code || !language) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

  const selectedTemplate = typeof template === 'string' ? template : 'standard';
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: 'status', message: 'Analyzing your code...' })}\n\n`
          )
        );

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const model = genAI.getGenerativeModel({
          model: 'gemini-3-flash-preview',
          generationConfig: { maxOutputTokens: 4096, temperature: 0.3 },
        });

        const templatePrompts: Record<string, string> = {
          standard: `You are an expert ${language} developer and code reviewer.`,
          performance: `You are a performance optimization expert in ${language}. Focus heavily on Big O time/space complexity, bottlenecks, and efficiency. Weight performance score heavily.`,
          security: `You are a cybersecurity expert in ${language}. Focus heavily on OWASP Top 10, input validation, sanitization, and vulnerabilities. Weight security score heavily.`,
          readability: `You are a senior ${language} developer focused on code cleanliness, naming conventions, documentation, and maintainability. Weight readability heavily.`,
          interview: `You are a FAANG senior engineer conducting a coding interview in ${language}. Evaluate time/space complexity, correctness, edge cases, and code elegance strictly. In finalVerdict explicitly state "FAANG Verdict: [Strong Hire / Hire / No Hire]" with explanation.`,
        };

        const templateInstruction = templatePrompts[selectedTemplate] ?? templatePrompts.standard;

        const roastPrompt = roastMode
          ? `You are a brutally honest but funny senior developer.
Review the following ${language} code with brutal honesty (${selectedTemplate} template).
Use phrases like 'This is giving me trust issues', 'My eyes are bleeding', 'Did you write this at 3am?'
${selectedTemplate === 'interview' ? 'Give a hilarious FAANG interview roasting verdict starting with "FAANG Verdict: No Hire - [joke]".' : ''}
But also genuinely help them improve.`
          : templateInstruction;

        const prompt = `${roastPrompt}

Analyze the following ${language} code and return ONLY a valid JSON object.
No markdown, no code fences, no extra text.

{
  "overallScore": <number 0-100>,
  "bugsFound": <number>,
  "performance": <number 0-10>,
  "readability": <number 0-10>,
  "security": <number 0-10>,
  "timeComplexity": "<string>",
  "spaceComplexity": "<string>",
  "topRecommendation": "<string>",
  "summary": "<string>",
  "strengths": ["<string>"],
  "weaknesses": ["<string>"],
  "bugDetails": ["<string>"],
  "bestPractices": ["<string>"],
  "namingSuggestions": ["<string>"],
  "securityIssues": ["<string>"],
  "suggestedImprovements": ["<string>"],
  "finalVerdict": "<string>"
}

${language} code:
\`\`\`${language.toLowerCase()}
${code}
\`\`\``;

        const result = await model.generateContentStream(prompt);
        let fullText = '';

        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          fullText += chunkText;
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: 'chunk', text: chunkText })}\n\n`
            )
          );
        }

        const cleaned = fullText
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim();

        // Find JSON boundaries
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');

        if (firstBrace === -1 || lastBrace === -1) {
          throw new Error('No valid JSON found in response');
        }

        const jsonCandidate = cleaned.slice(firstBrace, lastBrace + 1);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let report: Record<string, any>;
        try {
          report = JSON.parse(jsonCandidate);
        } catch {
          // Try to fix common JSON issues (trailing commas, control chars)
          const fixed = jsonCandidate
            .replace(/,\s*}/g, '}')
            .replace(/,\s*]/g, ']')
            .replace(/[\u0000-\u001F\u007F-\u009F]/g, '');
          report = JSON.parse(fixed);
        }

        const requiredFields = ['overallScore', 'summary', 'finalVerdict'];
        const missingFields = requiredFields.filter((f) => !(f in report));

        if (missingFields.length > 0) {
          throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
        }

        // Set defaults for optional fields
        report.bugsFound = report.bugsFound ?? 0;
        report.performance = report.performance ?? 5;
        report.readability = report.readability ?? 5;
        report.security = report.security ?? 5;
        report.timeComplexity = report.timeComplexity ?? 'O(n)';
        report.spaceComplexity = report.spaceComplexity ?? 'O(1)';
        report.strengths = report.strengths ?? [];
        report.weaknesses = report.weaknesses ?? [];
        report.bugDetails = report.bugDetails ?? [];
        report.bestPractices = report.bestPractices ?? [];
        report.namingSuggestions = report.namingSuggestions ?? [];
        report.securityIssues = report.securityIssues ?? [];
        report.suggestedImprovements = report.suggestedImprovements ?? [];
        report.topRecommendation = report.topRecommendation ?? 'Review the code for improvements';
        report.template = selectedTemplate;

        await connectDB();
        let user = await User.findOne({ email: session.user.email });
        if (!user) {
          user = await User.create({
            name: session.user.name || session.user.email?.split('@')[0] || 'User',
            email: session.user.email,
            image: session.user.image || undefined,
            provider: 'google',
            reviewsCompleted: 0,
          });
        }

        const review = await Review.create({
          userId: user._id,
          language,
          originalCode: code,
          report,
          improvedCode: null,
          isFavorited: false,
          isRoastMode: roastMode || false,
          template: selectedTemplate,
        });

        user.reviewsCompleted += 1;
        await user.save();

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'complete',
              report,
              reviewId: review._id.toString(),
            })}\n\n`
          )
        );

        controller.close();
      } catch (error) {
        console.error('Streaming review error:', error);
        const message =
          error instanceof SyntaxError
            ? 'AI response was incomplete. Please try again.'
            : error instanceof Error
            ? error.message
            : 'Review failed. Please try again.';

        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'error',
              message,
            })}\n\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
