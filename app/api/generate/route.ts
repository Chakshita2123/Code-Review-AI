import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { rateLimiter } from '@/lib/ratelimit';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Rate limit: 5 requests per minute per user
  const userId = (session.user as { id?: string }).id ?? session.user.email ?? 'unknown';
  const rl = rateLimiter(`${userId}:/api/generate`, 5, 60_000);
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please wait a moment before generating again.' },
      {
        status: 429,
        headers: { 'X-RateLimit-Reset': String(rl.reset) },
      },
    );
  }

  let body: { prompt?: string; language?: string };
  try {
    body = (await request.json()) as { prompt?: string; language?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { prompt, language = 'JavaScript' } = body;

  if (!prompt?.trim() || prompt.length > 500) {
    return NextResponse.json(
      { error: 'Invalid prompt. Must be between 1 and 500 characters.' },
      { status: 400 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { error: 'AI service is not configured.' },
      { status: 503 },
    );
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-3-flash-preview',
    generationConfig: { maxOutputTokens: 2048, temperature: 0.2 },
  });

  const fullPrompt = `You are an expert ${language} developer.
Generate clean, well-commented, production-ready ${language} code for:
"${prompt}"

STRICT RULES:
- Return ONLY the raw code
- NO markdown fences (no \`\`\`)
- NO explanation before or after
- Add inline comments for complex logic
- Handle edge cases and null/empty inputs
- Follow ${language} best practices and conventions
- Make it complete and immediately runnable`;

  try {
    const result = await model.generateContent(fullPrompt);
    const code = result.response.text().trim();
    return NextResponse.json({ code, language });
  } catch (error) {
    console.error('Code generation failed:', error);
    return NextResponse.json(
      { error: 'Generation failed. Please try again.' },
      { status: 500 },
    );
  }
}
