import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { getOrCreateUser } from '@/lib/user';
import Conversation from '@/models/Conversation';

export async function GET(request: NextRequest) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const user = await getOrCreateUser(auth.session.user);

    const conversations = await Conversation.find({ userId: user._id })
      .sort({ updatedAt: -1 })
      .select('_id title updatedAt createdAt')
      .lean<Array<{ _id: { toString(): string }; title: string; updatedAt: Date; createdAt: Date }>>();

    const mapped = conversations.map((c) => ({
      id: String(c._id),
      title: c.title,
      updatedAt: c.updatedAt,
      createdAt: c.createdAt,
    }));

    return NextResponse.json({ success: true, conversations: mapped });
  } catch (error) {
    console.error('[Conversations GET error]', error);
    return NextResponse.json(
      { success: false, message: 'Unable to load conversations. Please try again.' },
      { status: 500 },
    );
  }
}

