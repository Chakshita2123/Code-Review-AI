import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { connectDB } from '@/lib/db';
import Review from '@/models/Review';
import User from '@/models/User';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await context.params;

    await connectDB();
    const user = await User.findOne({ email: auth.session.user.email }).lean();
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // Check if review exists at all — then verify ownership
    const reviewExists = await Review.exists({ _id: id });
    if (!reviewExists) {
      return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 });
    }

    const review = await Review.findOne({ _id: id, userId: user._id });
    if (!review) {
      // Review exists but belongs to a different user
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    review.isFavorited = !review.isFavorited;
    await review.save();

    return NextResponse.json({
      success: true,
      review: {
        id: String(review._id),
        isFavorited: review.isFavorited,
      },
    });
  } catch (error) {
    console.error('History favorite PATCH error', error);
    return NextResponse.json(
      { success: false, message: 'Unable to update favourite. Please try again.' },
      { status: 500 },
    );
  }
}
