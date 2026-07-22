'use client';

import { type ReactNode } from 'react';

interface ChatWindowProps {
  children?: ReactNode;
  className?: string;
}

/**
 * ChatWindow — reusable container for the AI chat interface.
 * Provides the styled frame (flex column, full height, dark bg)
 * that wraps message list, typing indicators, and input area.
 */
export function ChatWindow({ children, className = '' }: ChatWindowProps) {
  return (
    <div
      className={`flex flex-col h-full overflow-hidden rounded-2xl border border-zinc-800 bg-[#0A0A0A] ${className}`}
    >
      {children}
    </div>
  );
}
