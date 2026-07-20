import { NextRequest, NextResponse } from 'next/server';
import type { FilterQuery } from 'mongoose';
import { requireAuth } from '@/lib/api-auth';
import { getOrCreateUser } from '@/lib/user';
import Review, { type IReview } from '@/models/Review';

type SortBy = 'newest' | 'oldest' | 'highest' | 'lowest';

function getSortOption(sortBy: string): Record<string, 1 | -1> {
  switch (sortBy as SortBy) {
    case 'oldest':
      return { createdAt: 1 };
    case 'highest':
      return { 'report.overallScore': -1 };
    case 'lowest':
      return { 'report.overallScore': 1 };
    default:
      return { createdAt: -1 };
  }
}

interface LeanReviewListItem {
  _id: { toString(): string };
  language: string;
  report?: {
    overallScore?: number;
    bugsFound?: number;
    performance?: number;
    readability?: number;
    security?: number;
    timeComplexity?: string;
    spaceComplexity?: string;
    finalVerdict?: string;
  };
  isFavorited?: boolean;
  createdAt: Date;
}

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const url = new URL(request.url);
    const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit') || '10', 10) || 10, 1), 50);
    const page = Math.max(parseInt(url.searchParams.get('page') || '1', 10) || 1, 1);
    const search = url.searchParams.get('search') || '';
    const language = url.searchParams.get('language') || '';
    const favorited = url.searchParams.get('favorited');
    const sortBy = url.searchParams.get('sortBy') || 'newest';

    const user = await getOrCreateUser(auth.session.user);

    const filter: FilterQuery<IReview> = { userId: user._id };
    if (language) filter.language = language;
    if (favorited === 'true') filter.isFavorited = true;
    if (search) filter['report.finalVerdict'] = { $regex: search, $options: 'i' };

    const [total, totalAll, statsAgg, reviews] = await Promise.all([
      Review.countDocuments(filter),
      Review.countDocuments({ userId: user._id }),
      Review.aggregate([
        { $match: filter },
        {
          $group: {
            _id: null,
            avgScore: { $avg: '$report.overallScore' },
            favorites: { $sum: { $cond: ['$isFavorited', 1, 0] } },
          },
        },
      ]),
      Review.find(filter)
        .sort(getSortOption(sortBy))
        .skip((page - 1) * limit)
        .limit(limit)
        .select(
          'language report.overallScore report.bugsFound report.performance report.readability report.security report.timeComplexity report.spaceComplexity report.finalVerdict isFavorited createdAt',
        )
        .lean<LeanReviewListItem[]>(),
    ]);

    const totalPages = Math.ceil(total / limit);
    const averageScore = statsAgg[0]?.avgScore ? Math.round(statsAgg[0].avgScore) : 0;
    const favoritesCount = statsAgg[0]?.favorites ?? 0;

    const mapped = reviews.map((r) => ({
      id: String(r._id),
      language: r.language,
      overallScore: r.report?.overallScore ?? 0,
      bugsFound: r.report?.bugsFound ?? 0,
      performance: r.report?.performance ?? 0,
      readability: r.report?.readability ?? 0,
      security: r.report?.security ?? 0,
      timeComplexity: r.report?.timeComplexity ?? 'N/A',
      spaceComplexity: r.report?.spaceComplexity ?? 'N/A',
      finalVerdict: r.report?.finalVerdict ?? '',
      isFavorited: !!r.isFavorited,
      createdAt: r.createdAt,
    }));

    return NextResponse.json(
      { success: true, reviews: mapped, total, page, totalPages, averageScore, favoritesCount, totalAll },
      { headers: { 'Cache-Control': 's-maxage=30, stale-while-revalidate=15' } },
    );
  } catch (error) {
    console.error('History API error', error);
    return NextResponse.json(
      { success: false, message: 'Unable to load history. Please try again.' },
      { status: 500 },
    );
  }
}

