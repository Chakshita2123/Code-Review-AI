import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { getOrCreateUser } from '@/lib/user';
import Review from '@/models/Review';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const user = await getOrCreateUser(auth.session.user);
    const userId = user._id;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [totalReviews, agg, languages, weeklyNew] = await Promise.all([
      Review.countDocuments({ userId }),
      Review.aggregate([
        { $match: { userId } },
        {
          $group: {
            _id: null,
            avgScore: { $avg: '$report.overallScore' },
            totalBugs: { $sum: '$report.bugsFound' },
          },
        },
      ]),
      Review.distinct('language', { userId }),
      Review.countDocuments({ userId, createdAt: { $gte: weekAgo } }),
    ]);

    const averageScore = agg?.[0]?.avgScore ? Math.round(agg[0].avgScore * 100) / 100 : 0;
    const totalBugsFound = agg?.[0]?.totalBugs ? agg[0].totalBugs : 0;
    const languagesUsed = Array.isArray(languages) ? languages.length : 0;

    return NextResponse.json(
      { success: true, data: { totalReviews, averageScore, totalBugsFound, languagesUsed, weeklyNew } },
      { headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=30' } },
    );
  } catch (error) {
    console.error('Stats API error', error);
    return NextResponse.json(
      { success: false, message: 'Unable to load stats. Please try again.' },
      { status: 500 },
    );
  }
}

