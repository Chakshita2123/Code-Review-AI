import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRateLimit } from '@/lib/api-auth';
import { getOrCreateUser } from '@/lib/user';
import { generateCodeReview } from '@/lib/gemini';
import { sanitizeCode, validateLanguage } from '@/lib/sanitize';
import Review from '@/models/Review';
import type { IDeveloperReport, SupportedLanguage } from '@/types';

export async function GET() {
  return NextResponse.json({ message: 'Review API ready' });
}

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

    const roastMode = Boolean(body?.roastMode);
    const template = typeof body?.template === 'string' ? body.template : 'standard';

    const report = await generateCodeReview(code, language, roastMode, template);

    const user = await getOrCreateUser(auth.session.user);

    let reviewId: string | null = null;
    try {
      const review = await Review.create({
        userId: user._id,
        language: language as SupportedLanguage,
        originalCode: code,
        report: report as IDeveloperReport,
        improvedCode: null,
        isFavorited: false,
        isRoastMode: roastMode,
        template,
      });
      reviewId = review._id.toString();
      user.reviewsCompleted += 1;
      await user.save();
    } catch (dbError) {
      console.error('Review persistence failed, continuing with fallback response:', dbError);
    }

    const responsePayload = { success: true, reviewId, report, improvedCode: null };
    return NextResponse.json(responsePayload);
  } catch (error) {
    console.error('Review submission failed:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to process review. Please try again.' },
      { status: 500 },
    );
  }
}

