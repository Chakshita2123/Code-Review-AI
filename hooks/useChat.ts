'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ConversationSummary {
  id: string;
  title: string;
  updatedAt: string;
  createdAt: string;
}

interface ChatApiResponse {
  success: boolean;
  response: string;
  conversationId: string;
}

interface ConversationsApiResponse {
  success: boolean;
  conversations: ConversationSummary[];
}

interface ConversationApiResponse {
  success: boolean;
  conversation: {
    id: string;
    title: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: string }>;
    createdAt: string;
    updatedAt: string;
  };
}

export function useChat() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState<string>('New Conversation');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarLoading, setIsSidebarLoading] = useState(true);
  const abortRef = useRef<AbortController | null>(null);

  // ── Load conversation list on mount ────────────────────────────────────────
  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations');
      const data = (await res.json()) as ConversationsApiResponse;
      if (data.success) setConversations(data.conversations);
    } catch {
      // silent
    } finally {
      setIsSidebarLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  // ── Load a past conversation ───────────────────────────────────────────────
  const loadConversation = useCallback(async (id: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/conversations/${id}`);
      const data = (await res.json()) as ConversationApiResponse;
      if (data.success) {
        const mapped: ChatMessage[] = data.conversation.messages.map((m) => ({
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp),
        }));
        setMessages(mapped);
        setActiveConversationId(id);
        setActiveTitle(data.conversation.title);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ── Start a new empty chat ─────────────────────────────────────────────────
  const startNewChat = useCallback(() => {
    setMessages([]);
    setActiveConversationId(null);
    setActiveTitle('New Conversation');
  }, []);

  // ── Send a message ─────────────────────────────────────────────────────────
  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      // Optimistically add the user message
      const userMsg: ChatMessage = { role: 'user', content: content.trim(), timestamp: new Date() };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);

      // Build history without the message we just added (API will add it)
      const historyForApi = messages.map((m) => ({ role: m.role, content: m.content }));

      try {
        abortRef.current = new AbortController();
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: content.trim(),
            conversationId: activeConversationId,
            history: historyForApi,
          }),
          signal: abortRef.current.signal,
        });

        const data = (await res.json()) as ChatApiResponse;

        if (data.success) {
          const assistantMsg: ChatMessage = {
            role: 'assistant',
            content: data.response,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, assistantMsg]);

          // If this was a new conversation, update sidebar list
          if (!activeConversationId) {
            setActiveConversationId(data.conversationId);
            // Title = first 50 chars of user message
            const newTitle = content.trim().slice(0, 50);
            setActiveTitle(newTitle);
            setConversations((prev) => [
              {
                id: data.conversationId,
                title: newTitle,
                updatedAt: new Date().toISOString(),
                createdAt: new Date().toISOString(),
              },
              ...prev,
            ]);
          } else {
            // Update updatedAt on existing conversation in sidebar
            setConversations((prev) =>
              prev.map((c) =>
                c.id === activeConversationId ? { ...c, updatedAt: new Date().toISOString() } : c,
              ),
            );
          }
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          setMessages((prev) => [
            ...prev,
            {
              role: 'assistant',
              content: 'Sorry, something went wrong. Please try again.',
              timestamp: new Date(),
            },
          ]);
        }
      } finally {
        setIsLoading(false);
        abortRef.current = null;
      }
    },
    [isLoading, messages, activeConversationId],
  );

  // ── Delete a conversation ──────────────────────────────────────────────────
  const deleteConversation = useCallback(
    async (id: string) => {
      try {
        await fetch(`/api/conversations/${id}`, { method: 'DELETE' });
        setConversations((prev) => prev.filter((c) => c.id !== id));
        if (activeConversationId === id) {
          startNewChat();
        }
      } catch {
        // silent
      }
    },
    [activeConversationId, startNewChat],
  );

  return {
    conversations,
    messages,
    activeConversationId,
    activeTitle,
    isLoading,
    isSidebarLoading,
    sendMessage,
    loadConversation,
    startNewChat,
    deleteConversation,
  };
}
