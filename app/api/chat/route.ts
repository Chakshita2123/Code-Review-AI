import { NextRequest, NextResponse } from 'next/server';
import { requireAuthWithRateLimit } from '@/lib/api-auth';
import { getOrCreateUser } from '@/lib/user';
import { generateChatResponse, type GeminiHistoryPart } from '@/lib/gemini';
import { sanitizeMessage } from '@/lib/sanitize';
import Conversation from '@/models/Conversation';

interface ChatRequestBody {
  message: string;
  conversationId?: string;
  history: Array<{ role: 'user' | 'assistant'; content: string }>;
}

export async function POST(request: NextRequest) {
  // Authenticate + rate-limit: 20 requests per minute per user
  const auth = await requireAuthWithRateLimit(request, request.headers.get('x-forwarded-for') ?? 'anonymous', 20, 60_000);
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as ChatRequestBody;
    const rawMessage = body?.message;

    if (!rawMessage || typeof rawMessage !== 'string') {
      return NextResponse.json({ success: false, message: 'Message is required' }, { status: 400 });
    }

    // Sanitize message input
    let message: string;
    try {
      message = sanitizeMessage(rawMessage);
    } catch (e) {
      return NextResponse.json(
        { success: false, message: e instanceof Error ? e.message : 'Invalid message' },
        { status: 400 },
      );
    }

    if (!message) {
      return NextResponse.json({ success: false, message: 'Message is required' }, { status: 400 });
    }

    const { conversationId, history } = body;

    const user = await getOrCreateUser(auth.session.user);

    // Convert client history to Gemini format (last 10 turns)
    const geminiHistory: GeminiHistoryPart[] = (history ?? []).slice(-10).map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const aiResponse = await generateChatResponse(geminiHistory, message);

    const userMsg = { role: 'user' as const, content: message, timestamp: new Date() };
    const assistantMsg = { role: 'assistant' as const, content: aiResponse, timestamp: new Date() };

    let conversation;

    if (conversationId) {
      // Append to existing conversation — ownership verified via userId filter
      conversation = await Conversation.findOne({ _id: conversationId, userId: user._id });
      if (conversation) {
        conversation.messages.push(userMsg, assistantMsg);
        await conversation.save();
      }
    }

    if (!conversation) {
      // Create new conversation — title = first user message (50 chars)
      const title = message.slice(0, 50);
      conversation = await Conversation.create({
        userId: user._id,
        title,
        messages: [userMsg, assistantMsg],
      });
    }

    return NextResponse.json({
      success: true,
      response: aiResponse,
      conversationId: String(conversation._id),
    });
  } catch (error) {
    console.error('[Chat API Error]', error);
    return NextResponse.json(
      { success: false, message: 'Unable to send message. Please try again.' },
      { status: 500 },
    );
  }
}
