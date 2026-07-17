'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  content: string;
  role?: 'user' | 'assistant';
  isLatest?: boolean;
}

function TypewriterText({ content }: { content: string }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    let i = 0;
    setDisplayed('');
    setDone(false);

    // Use larger chunks for long messages for performance
    const chunkSize = content.length > 500 ? 3 : 1;
    const interval = setInterval(() => {
      if (i < content.length) {
        setDisplayed(content.slice(0, i + chunkSize));
        i += chunkSize;
      } else {
        setDone(true);
        clearInterval(interval);
      }
    }, 15);

    return () => clearInterval(interval);
  }, [content]);

  return (
    <div>
      <ReactMarkdown>{displayed}</ReactMarkdown>
      {!done && <span className="animate-pulse text-blue-400">▋</span>}
    </div>
  );
}

export function ChatMessage({ content, role = 'assistant', isLatest = false }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div
      className={`rounded-lg border border-border bg-card p-3 text-sm ${
        isUser ? 'ml-auto max-w-[80%] bg-blue-600 text-white border-blue-500/30' : ''
      }`}
    >
      {!isUser && isLatest ? (
        <TypewriterText content={content} />
      ) : (
        <ReactMarkdown>{content}</ReactMarkdown>
      )}
    </div>
  );
}
