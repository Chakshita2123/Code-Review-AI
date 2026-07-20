import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { getOrCreateUser } from '@/lib/user';
import Review from '@/models/Review';
import User from '@/models/User';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const user = await getOrCreateUser(auth.session.user);

    // Aggregate stats from Review collection
    const reviews = await Review.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .select('_id language report.overallScore isFavorited createdAt')
      .lean();

    const totalReviews = reviews.length;
    const favoritesCount = reviews.filter((r) => r.isFavorited).length;

    const totalScore = reviews.reduce((sum, r) => sum + (r.report?.overallScore || 0), 0);
    const averageScore = totalReviews > 0 ? Math.round(totalScore / totalReviews) : 0;

    // Get 3 most recent reviews
    const recentActivity = reviews.slice(0, 3).map((r) => ({
      id: String(r._id),
      language: r.language,
      score: r.report?.overallScore || 0,
      createdAt: r.createdAt,
    }));

    // Find the last review date
    const lastReviewDate = reviews.length > 0 ? reviews[0].createdAt : null;

    return NextResponse.json({
      success: true,
      profile: {
        id: String(user._id),
        name: user.name,
        email: user.email,
        image: auth.session.user.image || user.image,
        provider: user.provider,
        createdAt: user.createdAt,
      },
      stats: {
        totalReviews,
        averageScore,
        favoritesCount,
        recentActivity,
        lastReviewDate,
      },
    });
  } catch (error) {
    console.error('[User Profile GET error]', error);
    return NextResponse.json(
      { success: false, message: 'Unable to load profile. Please try again.' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const body = await request.json();
    const rawName = body?.name;

    // Validate and sanitize name
    if (!rawName || typeof rawName !== 'string') {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    }

    const name = rawName.replace(/\0/g, '').trim();

    if (!name) {
      return NextResponse.json({ success: false, message: 'Name is required' }, { status: 400 });
    }

    if (name.length > 50) {
      return NextResponse.json({ success: false, message: 'Name must be under 50 characters' }, { status: 400 });
    }

    const user = await getOrCreateUser(auth.session.user);
    const updatedUser = await User.findOneAndUpdate(
      { _id: user._id },
      { $set: { name } },
      { new: true },
    ).lean();

    if (!updatedUser) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, name: updatedUser.name });
  } catch (error) {
    console.error('[User Profile PATCH error]', error);
    return NextResponse.json(
      { success: false, message: 'Unable to update profile. Please try again.' },
      { status: 500 },
    );
  }
}

