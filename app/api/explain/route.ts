import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRateLimit } from '@/lib/api-auth';
import { generateCodeExplanation } from '@/lib/gemini';
import { sanitizeCode, validateLanguage } from '@/lib/sanitize';
import type { SupportedLanguage } from '@/types';

export async function POST(request: NextRequest) {
  // Authenticate + rate-limit: 10 requests per minute per user
  const auth = await requireAuthWithRateLimit(request, request.headers.get('x-forwarded-for') ?? 'anonymous', 10, 60_000);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();

    // Sanitize and validate inputs
    let code: string;
    try {
      code = sanitizeCode(typeof body?.code === 'string' ? body.code : '');
    } catch (e) {
      return NextResponse.json(
        { success: false, message: e instanceof Error ? e.message : 'Invalid code input' },
        { status: 400 },
      );
    }

    if (!code) {
      return NextResponse.json({ success: false, message: 'Code is required' }, { status: 400 });
    }

    const language = typeof body?.language === 'string' ? body.language : 'JavaScript';
    if (!validateLanguage(language)) {
      return NextResponse.json({ success: false, message: 'Unsupported language' }, { status: 400 });
    }

    const explanation = await generateCodeExplanation(code, language as SupportedLanguage);
    return NextResponse.json({ success: true, explanation });
  } catch (error) {
    console.error('Explanation generation failed:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to explain code. Please try again.' },
      { status: 500 },
    );
  }
}
