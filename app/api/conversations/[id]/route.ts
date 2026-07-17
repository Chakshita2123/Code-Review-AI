import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/api-auth';
import { connectDB } from '@/lib/db';
import Conversation from '@/models/Conversation';
import User from '@/models/User';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Look up a conversation that belongs to the given user.
 * Distinguishes between "not found" and "wrong owner" for proper HTTP status codes.
 */
async function getOwnedConversation(conversationId: string, userEmail: string) {
  await connectDB();
  const user = await User.findOne({ email: userEmail }).lean();
  if (!user) return { user: null, conversation: null, wrongOwner: false };

  const conversationExists = await Conversation.exists({ _id: conversationId });
  if (!conversationExists) return { user, conversation: null, wrongOwner: false };

  const conversation = await Conversation.findOne({ _id: conversationId, userId: user._id });
  if (!conversation) return { user, conversation: null, wrongOwner: true };

  return { user, conversation, wrongOwner: false };
}

export async function GET(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await context.params;
    const { conversation, wrongOwner } = await getOwnedConversation(id, auth.session.user.email);

    if (wrongOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!conversation) {
      return NextResponse.json({ success: false, message: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      conversation: {
        id: String(conversation._id),
        title: conversation.title,
        messages: conversation.messages,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
      },
    });
  } catch (error) {
    console.error('[Conversation GET [id] error]', error);
    return NextResponse.json(
      { success: false, message: 'Unable to load conversation. Please try again.' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const auth = await requireAuth(request);
  if (auth.error) return auth.error;

  try {
    const { id } = await context.params;
    const { user, conversation, wrongOwner } = await getOwnedConversation(id, auth.session.user.email);

    if (wrongOwner) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!conversation || !user) {
      return NextResponse.json({ success: false, message: 'Conversation not found' }, { status: 404 });
    }

    await Conversation.deleteOne({ _id: id, userId: user._id });
    return NextResponse.json({ success: true, deleted: true });
  } catch (error) {
    console.error('[Conversation DELETE [id] error]', error);
    return NextResponse.json(
      { success: false, message: 'Unable to delete conversation. Please try again.' },
      { status: 500 },
    );
  }
}
