import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { getOrCreateUser } from '@/lib/user';
import User from '@/models/User';
import Review from '@/models/Review';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const user = await getOrCreateUser(auth.session.user);

    const reviews = await Review.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .select('-userId -__v')
      .lean();

    // Map to string IDs for clean JSON
    const cleanReviews = reviews.map((r) => ({
      ...r,
      _id: String(r._id),
    }));

    return NextResponse.json({ success: true, reviews: cleanReviews });
  } catch (error) {
    console.error('[User Reviews GET error]', error);
    return NextResponse.json(
      { success: false, message: 'Unable to load reviews. Please try again.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const user = await getOrCreateUser(auth.session.user);

    const result = await Review.deleteMany({ userId: user._id });

    // Also reset the reviewsCompleted count on the user
    await User.updateOne({ _id: user._id }, { $set: { reviewsCompleted: 0 } });

    return NextResponse.json({
      success: true,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    console.error('[User Reviews DELETE error]', error);
    return NextResponse.json(
      { success: false, message: 'Unable to clear reviews. Please try again.' },
      { status: 500 },
    );
  }
}

