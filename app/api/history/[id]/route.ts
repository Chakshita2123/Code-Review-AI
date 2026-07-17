import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { connectDB } from '@/lib/db';
import Review from '@/models/Review';
import User from '@/models/User';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Look up a review that belongs to the given user.
 * Returns both the user document and the review (or nulls if not found).
 * Ownership is enforced at the DB query level via userId filter.
 */
async function getOwnedReview(reviewId: string, userEmail: string) {
  await connectDB();
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) return { user: null, review: null, wrongOwner: false };

  // First check if review exists at all
  const reviewExists = await Review.exists({ _id: reviewId });
  if (!reviewExists) return { user, review: null, wrongOwner: false };

  // Then check if this user owns it
  const review = await Review.findOne({ _id: reviewId, userId: user._id });
  if (!review) return { user, review: null, wrongOwner: true };

  return { user, review, wrongOwner: false };
}

function mapReview(review: InstanceType<typeof Review>) {
  return {
    id: String(review._id),
    language: review.language,
    originalCode: review.originalCode,
    improvedCode: review.improvedCode,
    report: review.report,
    isFavorited: review.isFavorited,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await context.params;
    const { review, wrongOwner } = await getOwnedReview(id, auth.session.user.email);

    if (wrongOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!review) {
      return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, review: mapReview(review) });
  } catch (error) {
    console.error('History GET [id] error', error);
    return NextResponse.json(
      { success: false, message: 'Unable to load review. Please try again.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await context.params;
    const { user, review, wrongOwner } = await getOwnedReview(id, auth.session.user.email);

    if (wrongOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!review || !user) {
      return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 });
    }

    await Review.deleteOne({ _id: id, userId: user._id });

    // Decrement counter via atomic update (avoids needing a mutable document)
    await User.updateOne(
      { _id: user._id },
      { $inc: { reviewsCompleted: -1 } },
    );

    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    console.error('History DELETE [id] error', error);
    return NextResponse.json(
      { success: false, message: 'Unable to delete review. Please try again.' },
      { status: 500 },
    );
  }
}
