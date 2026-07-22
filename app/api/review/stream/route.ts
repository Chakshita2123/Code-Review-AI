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

  const { code, language, roastMode } = await request.json();
  if (!code || !language) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
  }

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
          generationConfig: { maxOutputTokens: 2048, temperature: 0.3 },
        });

        const roastPrompt = roastMode
          ? `You are a brutally honest but funny senior developer.
Review the following ${language} code with brutal honesty.
Use phrases like 'This is giving me trust issues', 'My eyes are bleeding', 'Did you write this at 3am?'
But also genuinely help them improve.`
          : `You are an expert ${language} developer and code reviewer.`;

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
          .replace(/```json/g, '')
          .replace(/```/g, '')
          .trim();
        const report = JSON.parse(cleaned);

        await connectDB();
        let user = await User.findOne({ email: session.user.email });
        if (!user) {
          user = await User.create({
            name: session.user.name || session.user.email.split('@')[0] || 'User',
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
        console.error('Error during streaming review:', error);
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              type: 'error',
              message: 'Review failed. Please try again.',
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
