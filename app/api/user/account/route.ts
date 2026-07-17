import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Review from '@/models/Review';
import Conversation from '@/models/Conversation';

export async function DELETE(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const user = await User.findOne({ email: auth.session.user.email }).lean();
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    // 1. Delete all reviews
    await Review.deleteMany({ userId: user._id });

    // 2. Delete all conversations
    await Conversation.deleteMany({ userId: user._id });

    // 3. Delete user document
    await User.deleteOne({ _id: user._id });

    return NextResponse.json({
      success: true,
      deleted: true,
      message: 'Account permanently deleted',
    });
  } catch (error) {
    console.error('[User Account DELETE error]', error);
    return NextResponse.json(
      { success: false, message: 'Unable to delete account. Please try again.' },
      { status: 500 },
    );
  }
}
