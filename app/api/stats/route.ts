import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { connectDB } from '@/lib/db';
import Review from '@/models/Review';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    await connectDB();

    const user = await User.findOne({ email: auth.session.user.email }).lean();
    if (!user) {
      return NextResponse.json({ success: true, data: { totalReviews: 0, averageScore: 0, totalBugsFound: 0, languagesUsed: 0, weeklyNew: 0 } });
    }

    const userId = user._id;

    const totalReviews = await Review.countDocuments({ userId });

    const agg = await Review.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: null,
          avgScore: { $avg: '$report.overallScore' },
          totalBugs: { $sum: '$report.bugsFound' },
        },
      },
    ]);

    const averageScore = agg?.[0]?.avgScore ? Math.round(agg[0].avgScore * 100) / 100 : 0;
    const totalBugsFound = agg?.[0]?.totalBugs ? agg[0].totalBugs : 0;

    const languages = await Review.distinct('language', { userId });
    const languagesUsed = Array.isArray(languages) ? languages.length : 0;

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const weeklyNew = await Review.countDocuments({ userId, createdAt: { $gte: weekAgo } });

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
