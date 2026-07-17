import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { connectDB } from '@/lib/db';
import Review from '@/models/Review';
import Conversation from '@/models/Conversation';
import User from '@/models/User';
import { ACHIEVEMENTS } from '@/utils/achievements';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    await connectDB();
    const user = await User.findOne({ email: auth.session.user.email }).lean();
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found' }, { status: 404 });
    }

    const reviews = await Review.find({ userId: user._id }).lean();
    const conversations = await Conversation.find({ userId: user._id }).lean();

    const earned = new Set<string>();

    if (reviews.length >= 1) earned.add('first_review');
    if (reviews.length >= 10) earned.add('on_fire');
    if (reviews.some((r) => r.report.overallScore === 100)) earned.add('perfect_score');
    if (reviews.some((r) => r.report.bugsFound >= 5)) earned.add('bug_hunter');
    if (reviews.some((r) => r.report.security === 10)) earned.add('security_expert');
    if (reviews.some((r) => r.report.readability === 10)) earned.add('clean_coder');

    const uniqueLanguages = new Set(reviews.map((r) => r.language));
    if (uniqueLanguages.size >= 3) earned.add('polyglot');

    let userMessageCount = 0;
    conversations.forEach((conv) => {
      userMessageCount += conv.messages.filter((m: { role: string }) => m.role === 'user').length;
    });
    if (userMessageCount >= 5) earned.add('chatty');

    const earnedList = ACHIEVEMENTS.filter((a) => earned.has(a.id));
    const lockedList = ACHIEVEMENTS.filter((a) => !earned.has(a.id));

    return NextResponse.json({ success: true, earned: earnedList, locked: lockedList });
  } catch (error) {
    console.error('Failed to fetch achievements:', error);
    return NextResponse.json(
      { success: false, message: 'Unable to load achievements. Please try again.' },
      { status: 500 },
    );
  }
}
