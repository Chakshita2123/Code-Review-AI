'use client';

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/cjs/styles/prism';
import type { Components } from 'react-markdown';
import dynamic from 'next/dynamic';
import {
  Check,
  Code2,
  Copy,
  Loader2,
  Menu,
  MessageSquare,
  Plus,
  RefreshCw,
  Send,
  Sparkles,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { useChat } from '@/hooks/useChat';
import { formatRelativeTime } from '@/utils/formatDate';

// Monaco Editor loaded lazily (no SSR)
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });

// ─── Suggestion chips shown on empty state ─────────────────────────────────
const SUGGESTIONS = [
  'Explain recursion in simple terms',
  'What is the difference between == and ===',
  'How do I optimize a nested loop?',
  'Explain Big O notation',
  'What is a closure in JavaScript?',
  'How does async/await work?',
];

// ─── Code generator constants ────────────────────────────────────────────────
const SUPPORTED_LANGUAGES = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C', 'Go', 'Rust', 'PHP', 'C#',
] as const;

type GenLanguage = (typeof SUPPORTED_LANGUAGES)[number];

interface GenSuggestion {
  label: string;
  language: GenLanguage;
}

const GEN_SUGGESTIONS: GenSuggestion[] = [
  { label: 'Binary search in Python', language: 'Python' },
  { label: 'Linked list in Java', language: 'Java' },
  { label: 'REST API with Express.js', language: 'JavaScript' },
  { label: 'React hook for debounce', language: 'TypeScript' },
  { label: 'Quick sort in C++', language: 'C++' },
  { label: 'JWT auth middleware in Node.js', language: 'JavaScript' },
  { label: 'Fibonacci with memoization in Python', language: 'Python' },
  { label: 'Stack implementation in Go', language: 'Go' },
];

// ─── Typing dots animation ──────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex items-end gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
        <span className="text-xs font-bold">&lt;/&gt;</span>
      </div>
      <div className="rounded-2xl rounded-tl-sm border border-zinc-700/50 bg-zinc-800 px-4 py-3">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-2 w-2 rounded-full bg-zinc-400"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
            />
          ))}
          <span className="ml-2 text-xs text-zinc-500">Gemini is thinking…</span>
        </div>
      </div>
    </div>
  );
}

// ─── Code block with copy button ───────────────────────────────────────────
function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    void navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="group relative my-3 overflow-hidden rounded-xl border border-zinc-700/50">
      <div className="flex items-center justify-between border-b border-zinc-700/50 bg-zinc-900 px-4 py-2">
        <span className="text-xs font-medium text-zinc-400">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 rounded-md px-2 py-1 text-xs text-zinc-400 transition hover:bg-zinc-700 hover:text-white"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3" />
              Copy
            </>
          )}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        customStyle={{
          margin: 0,
          borderRadius: 0,
          background: '#0f0f0f',
          fontSize: '0.8rem',
          lineHeight: '1.6',
        }}
        showLineNumbers
        wrapLongLines
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}

// ─── Markdown components ────────────────────────────────────────────────────
function buildMarkdownComponents(): Components {
  return {
    code({ className, children, ...props }) {
      const isBlock = className?.startsWith('language-');
      const language = className?.replace('language-', '') ?? '';
      if (isBlock) {
        return (
          <CodeBlock language={language} code={String(children).replace(/\n$/, '')} />
        );
      }
      return (
        <code
          className="rounded bg-zinc-700/60 px-1.5 py-0.5 font-mono text-[0.82em] text-zinc-200"
          {...props}
        >
          {children}
        </code>
      );
    },
    p({ children }) {
      return <p className="mb-3 last:mb-0 leading-7">{children}</p>;
    },
    ul({ children }) {
      return <ul className="mb-3 ml-4 list-disc space-y-1 leading-7">{children}</ul>;
    },
    ol({ children }) {
      return <ol className="mb-3 ml-4 list-decimal space-y-1 leading-7">{children}</ol>;
    },
    li({ children }) {
      return <li className="leading-7">{children}</li>;
    },
    strong({ children }) {
      return <strong className="font-semibold text-white">{children}</strong>;
    },
    blockquote({ children }) {
      return (
        <blockquote className="my-3 border-l-2 border-blue-500/40 pl-4 text-zinc-400 italic">
          {children}
        </blockquote>
      );
    },
    h1({ children }) {
      return <h1 className="mb-3 mt-4 text-xl font-semibold text-white">{children}</h1>;
    },
    h2({ children }) {
      return <h2 className="mb-2 mt-4 text-lg font-semibold text-white">{children}</h2>;
    },
    h3({ children }) {
      return <h3 className="mb-2 mt-3 font-semibold text-white">{children}</h3>;
    },
  };
}

const markdownComponents = buildMarkdownComponents();

// ─── Typewriter effect for assistant messages ──────────────────────────────
function TypewriterText({ content }: { content: string }) {
  const [displayedLength, setDisplayedLength] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  useEffect(() => {
    if (displayedLength < content.length) {
      const timer = window.setTimeout(() => {
        // Reveal in small chunks for performance with long messages
        const chunkSize = content.length > 500 ? 3 : 1;
        setDisplayedLength((prev) => Math.min(prev + chunkSize, content.length));
      }, 20);
      return () => window.clearTimeout(timer);
    } else {
      setIsComplete(true);
    }
  }, [displayedLength, content.length]);

  const visibleContent = content.slice(0, displayedLength);

  return (
    <span>
      <ReactMarkdown components={markdownComponents}>{visibleContent}</ReactMarkdown>
      {!isComplete && <span className="typewriter-cursor" />}
    </span>
  );
}

// ─── Helper: detect if a message contains a code block ──────────────────────
function hasCodeBlock(content: string): boolean {
  return /```[\s\S]*?```/.test(content) || /^( {4}|\t).+/m.test(content);
}

function extractCode(content: string): string {
  const fenceMatch = content.match(/```[\w]*\n([\s\S]*?)```/);
  return fenceMatch ? fenceMatch[1].trim() : content.trim();
}

function extractLang(content: string): string {
  const langMatch = content.match(/```([\w+#]+)/);
  if (!langMatch) return 'JavaScript';
  const raw = langMatch[1].toLowerCase();
  const map: Record<string, string> = {
    js: 'JavaScript', javascript: 'JavaScript',
    ts: 'TypeScript', typescript: 'TypeScript',
    py: 'Python', python: 'Python',
    java: 'Java',
    cpp: 'C++', 'c++': 'C++',
    c: 'C',
    go: 'Go',
    rust: 'Rust', rs: 'Rust',
    php: 'PHP',
    cs: 'C#', csharp: 'C#', 'c#': 'C#',
  };
  return map[raw] ?? 'JavaScript';
}

// ─── Single message bubble ─────────────────────────────────────────────────
interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  userImage?: string | null;
  userName?: string | null;
  isLastMessage?: boolean;
  onReviewCode?: (code: string, language: string) => void;
}

function MessageBubble({ role, content, timestamp, userImage, userName, isLastMessage, onReviewCode }: MessageBubbleProps) {
  const isUser = role === 'user';
  const isLatest = isLastMessage;
  const [bubbleCopied, setBubbleCopied] = useState(false);

  const withCode = hasCodeBlock(content);

  const handleBubbleCopy = () => {
    const code = extractCode(content);
    void navigator.clipboard.writeText(code).then(() => {
      setBubbleCopied(true);
      setTimeout(() => setBubbleCopied(false), 2000);
    });
  };

  const handleReview = () => {
    if (onReviewCode) {
      onReviewCode(extractCode(content), extractLang(content));
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 40 : -40, y: 8 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 25 }}
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className="shrink-0 pt-0.5">
        {isUser ? (
          userImage ? (
            <Image
              src={userImage}
              alt={userName ?? 'User'}
              width={32}
              height={32}
              className="rounded-full ring-1 ring-zinc-700"
            />
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-700 text-xs font-semibold text-zinc-300">
              {(userName ?? 'U').charAt(0).toUpperCase()}
            </div>
          )
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-blue-400">
            <span className="text-[10px] font-bold">&lt;/&gt;</span>
          </div>
        )}
      </div>

      {/* Bubble */}
      <div className={`flex max-w-[75%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'rounded-tr-sm bg-blue-600 text-white'
              : 'rounded-tl-sm border border-zinc-700/50 bg-zinc-800 text-zinc-100'
          }`}
        >
          {isUser ? (
            <span className="whitespace-pre-wrap">{content}</span>
          ) : isLatest ? (
            <TypewriterText content={content} />
          ) : (
            <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
          )}
        </div>

        {/* Action buttons for messages that contain code */}
        {withCode && (
          <div className={`mt-1.5 flex items-center gap-1.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
            {/* Copy code — both user & assistant */}
            <button
              onClick={handleBubbleCopy}
              className="flex items-center gap-1 rounded-md border border-zinc-700/50 bg-zinc-800/80 px-2 py-1 text-[11px] text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200"
            >
              {bubbleCopied ? (
                <><Check className="h-2.5 w-2.5 text-emerald-400" /><span className="text-emerald-400">Copied</span></>
              ) : (
                <><Copy className="h-2.5 w-2.5" />Copy</>  
              )}
            </button>

            {/* Review This Code — user messages only */}
            {isUser && (
              <button
                onClick={handleReview}
                className="flex items-center gap-1 rounded-md border border-blue-500/40 bg-blue-500/10 px-2 py-1 text-[11px] text-blue-300 transition hover:bg-blue-500/20 hover:text-blue-200"
              >
                <Zap className="h-2.5 w-2.5" />
                Review This Code
              </button>
            )}
          </div>
        )}

        <span className="mt-1 text-[11px] text-zinc-600">
          {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
}

// ─── AI Code Generator Panel ─────────────────────────────────────────────────
function CodeGeneratorPanel() {
  const [genPrompt, setGenPrompt] = useState('');
  const [genLanguage, setGenLanguage] = useState<GenLanguage>('JavaScript');
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [genCopied, setGenCopied] = useState(false);

  const generate = async () => {
    if (!genPrompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setGenError(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: genPrompt, language: genLanguage }),
      });
      const data = await res.json() as { code?: string; error?: string };
      if (!res.ok) {
        setGenError(data.error ?? 'Generation failed. Please try again.');
      } else {
        setGeneratedCode(data.code ?? '');
      }
    } catch {
      setGenError('Network error. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    if (!generatedCode) return;
    void navigator.clipboard.writeText(generatedCode).then(() => {
      setGenCopied(true);
      setTimeout(() => setGenCopied(false), 2000);
    });
  };

  const handleSuggestion = (s: GenSuggestion) => {
    setGenPrompt(s.label);
    setGenLanguage(s.language);
  };

  return (
    <div className="flex flex-1 flex-col overflow-y-auto lg:flex-row">
      {/* ── Left: Input Form ──────────────────────────────────────────────── */}
      <div className="flex w-full shrink-0 flex-col gap-5 border-b border-zinc-800 bg-[#0A0A0A] p-6 lg:w-[380px] lg:border-b-0 lg:border-r">
        <div>
          <div className="flex items-center gap-2 text-blue-400">
            <Zap className="h-5 w-5" />
            <h2 className="text-lg font-bold text-white">AI Code Generator</h2>
          </div>
          <p className="mt-1 text-sm text-zinc-500">Describe what you want to generate</p>
        </div>

        {/* Prompt textarea */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-400" htmlFor="gen-prompt">
            Description
          </label>
          <textarea
            id="gen-prompt"
            value={genPrompt}
            onChange={(e) => setGenPrompt(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder={`e.g. A binary search function that handles duplicate values and returns all indices`}
            className="w-full resize-none rounded-xl border border-zinc-700/60 bg-zinc-900 px-4 py-3 text-sm text-zinc-100 placeholder:text-zinc-600 focus:border-blue-500/50 focus:outline-none focus:ring-1 focus:ring-blue-500/20"
          />
          <span className={`text-right text-[11px] ${genPrompt.length > 450 ? 'text-amber-500' : 'text-zinc-700'}`}>
            {genPrompt.length}/500
          </span>
        </div>

        {/* Language selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-zinc-400" htmlFor="gen-language">
            Language
          </label>
          <select
            id="gen-language"
            value={genLanguage}
            onChange={(e) => setGenLanguage(e.target.value as GenLanguage)}
            className="rounded-xl border border-zinc-700/60 bg-zinc-900 px-4 py-2.5 text-sm text-zinc-100 focus:border-blue-500/50 focus:outline-none"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l} value={l}>{l}</option>
            ))}
          </select>
        </div>

        {/* Generate button */}
        <button
          id="gen-generate-btn"
          onClick={() => void generate()}
          disabled={!genPrompt.trim() || isGenerating}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? (
            <><Loader2 className="h-4 w-4 animate-spin" />Generating...</>
          ) : (
            <><Zap className="h-4 w-4" />Generate Code</>
          )}
        </button>

        {genError && (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {genError}
          </p>
        )}

        {/* Suggestion chips */}
        <div>
          <p className="mb-2.5 text-xs font-medium text-zinc-500">Quick suggestions</p>
          <div className="flex flex-wrap gap-2">
            {GEN_SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => handleSuggestion(s)}
                className="rounded-lg border border-zinc-700/50 bg-zinc-800/50 px-3 py-1.5 text-[11px] text-zinc-400 transition hover:border-blue-500/30 hover:bg-blue-500/8 hover:text-blue-300"
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Output Panel ───────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col gap-4 bg-[#0A0A0A] p-6">
        {generatedCode === null ? (
          /* Empty state */
          <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-800 text-center">
            <Code2 className="mb-4 h-12 w-12 text-zinc-600" />
            <p className="text-sm font-medium text-zinc-400">Your generated code will appear here</p>
            <p className="mt-1 text-xs text-zinc-600">Describe what you want and click Generate</p>
          </div>
        ) : (
          /* Code output */
          <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-zinc-700/50">
            {/* Header bar */}
            <div className="flex items-center justify-between border-b border-zinc-700/50 bg-zinc-900 px-4 py-2.5">
              <span className="rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300">
                {genLanguage}
              </span>
              <span className="flex items-center gap-1.5 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400">
                <Zap className="h-3 w-3" /> Generated
              </span>
            </div>

            {/* Monaco editor */}
            <div className="flex-1" style={{ minHeight: '400px' }}>
              <MonacoEditor
                height="400px"
                language={genLanguage.toLowerCase().replace('c++', 'cpp').replace('c#', 'csharp')}
                value={generatedCode}
                theme="vs-dark"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                  padding: { top: 12, bottom: 12 },
                  renderLineHighlight: 'none',
                  scrollbar: { verticalScrollbarSize: 6 },
                }}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-zinc-700/50 bg-zinc-900 px-4 py-3">
              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-600 hover:text-white"
                >
                  {genCopied ? (
                    <><Check className="h-3 w-3 text-emerald-400" /><span className="text-emerald-400">Copied!</span></>
                  ) : (
                    <><Copy className="h-3 w-3" />Copy Code</>
                  )}
                </button>
                <button
                  onClick={() => void generate()}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-zinc-300 transition hover:border-zinc-600 hover:text-white disabled:opacity-50"
                >
                  <RefreshCw className={`h-3 w-3 ${isGenerating ? 'animate-spin' : ''}`} />
                  Regenerate
                </button>
              </div>
              <p className="text-[11px] text-zinc-600">AI-generated code. Review before using in production.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Conversations sidebar ─────────────────────────────────────────────────
interface SidebarProps {
  conversations: ReturnType<typeof useChat>['conversations'];
  activeConversationId: string | null;
  isSidebarLoading: boolean;
  onSelect: (id: string) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  onClose?: () => void;
}

function ConversationsSidebar({
  conversations,
  activeConversationId,
  isSidebarLoading,
  onSelect,
  onNewChat,
  onDelete,
  onClose,
}: SidebarProps) {
  return (
    <aside className="flex h-full flex-col bg-[#0D0D0D]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 p-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-semibold text-white">AI Chat</span>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-zinc-500 transition hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* New Chat button */}
      <div className="p-3">
        <button
          onClick={onNewChat}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-blue-500/30 bg-blue-600/10 px-3 py-2.5 text-sm font-medium text-blue-400 transition hover:bg-blue-600/20 hover:text-blue-300"
        >
          <Plus className="h-4 w-4" />
          New Chat
        </button>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto px-2 pb-3">
        {isSidebarLoading ? (
          <div className="space-y-2 px-1 pt-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-zinc-800/50" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="mb-3 h-8 w-8 text-zinc-700" />
            <p className="text-xs text-zinc-600">No conversations yet</p>
            <p className="mt-1 text-xs text-zinc-700">Start a new chat</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {conversations.map((conv) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                className="group relative"
              >
                <button
                  onClick={() => onSelect(conv.id)}
                  className={`w-full rounded-lg px-3 py-2.5 text-left transition ${
                    activeConversationId === conv.id
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-300'
                  }`}
                >
                  <p className="truncate pr-6 text-xs font-medium">{conv.title}</p>
                  <p className="mt-0.5 text-[10px] text-zinc-600">
                    {formatRelativeTime(conv.updatedAt)}
                  </p>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-600 opacity-0 transition hover:bg-zinc-700 hover:text-red-400 group-hover:opacity-100"
                  aria-label="Delete conversation"
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Model badge */}
      <div className="border-t border-zinc-800 p-3">
        <div className="flex items-center gap-2 rounded-lg border border-zinc-800 px-3 py-2">
          <Sparkles className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-xs text-zinc-500">Gemini 3 Flash</span>
        </div>
      </div>
    </aside>
  );
}

// ─── Empty state ───────────────────────────────────────────────────────────
function EmptyState({ onSuggestionClick }: { onSuggestionClick: (text: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-1 flex-col items-center justify-center px-6 py-12 text-center"
    >
      <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-3xl border border-blue-500/20 bg-blue-500/10">
        <Sparkles className="h-10 w-10 text-blue-400" />
      </div>
      <h2 className="text-2xl font-bold text-white">How can I help you code today?</h2>
      <p className="mt-2 text-sm text-zinc-500">Ask me anything about programming</p>

      <div className="mt-8 flex max-w-2xl flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            onClick={() => onSuggestionClick(s)}
            className="rounded-xl border border-zinc-700/60 bg-zinc-800/40 px-4 py-2 text-sm text-zinc-300 transition hover:border-blue-500/40 hover:bg-blue-500/8 hover:text-blue-300"
          >
            {s}
          </button>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Main Chat Page ─────────────────────────────────────────────────────────
export default function ChatPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const {
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
  } = useChat();

  const [activeTab, setActiveTab] = useState<'chat' | 'generate'>('chat');
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new messages
  useLayoutEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-resize textarea
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = 6 * 24; // ~6 lines
    el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px';
  }, [input]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const msg = input;
    setInput('');
    await sendMessage(msg);
  }, [input, isLoading, sendMessage]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const handleSuggestionClick = (text: string) => {
    setInput(text);
    textareaRef.current?.focus();
  };

  const handleConversationSelect = async (id: string) => {
    setSidebarOpen(false);
    await loadConversation(id);
  };

  const handleNewChat = () => {
    startNewChat();
    setSidebarOpen(false);
    setInput('');
  };

  const handleReviewCode = (code: string, language: string) => {
    localStorage.setItem('pending-review', JSON.stringify({ code, language, fromChat: true }));
    router.push('/new-review');
  };

  const charCount = input.length;
  const nearLimit = charCount > 4500;

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#0A0A0A] lg:h-screen">

      {/* ── Desktop sidebar ──────────────────────────────────────────────── */}
      <div className="hidden w-[260px] shrink-0 border-r border-zinc-800 lg:flex lg:flex-col">
        <ConversationsSidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          isSidebarLoading={isSidebarLoading}
          onSelect={(id) => void handleConversationSelect(id)}
          onNewChat={handleNewChat}
          onDelete={(id) => void deleteConversation(id)}
        />
      </div>

      {/* ── Mobile sidebar drawer ─────────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 z-40 bg-black/60 lg:hidden"
            />
            <motion.div
              initial={{ x: -260 }}
              animate={{ x: 0 }}
              exit={{ x: -260 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed inset-y-0 left-0 z-50 w-[260px] border-r border-[var(--border-primary)] lg:hidden"
            >
              <ConversationsSidebar
                conversations={conversations}
                activeConversationId={activeConversationId}
                isSidebarLoading={isSidebarLoading}
                onSelect={(id) => void handleConversationSelect(id)}
                onNewChat={handleNewChat}
                onDelete={(id) => void deleteConversation(id)}
                onClose={() => setSidebarOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Chat window ──────────────────────────────────────────────────── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* Chat header */}
        <div className="flex shrink-0 items-center justify-between border-b border-[var(--border-primary)] bg-[var(--bg-primary)]/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-3">
            {/* Mobile conversations drawer button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-1.5 rounded-lg border border-[var(--border-primary)] px-2.5 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] lg:hidden"
              aria-label="Open conversations"
            >
              <Menu className="h-4 w-4 text-blue-400" />
              <span>Conversations</span>
            </button>

            {/* Tab switcher */}
            <div className="flex items-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900 p-1">
              <button
                id="chat-tab"
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  activeTab === 'chat'
                    ? 'bg-zinc-700 text-white shadow'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Chat
              </button>
              <button
                id="generate-tab"
                onClick={() => setActiveTab('generate')}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                  activeTab === 'generate'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                Generate Code
              </button>
            </div>

            {activeTab === 'chat' && (
              <div className="hidden lg:block">
                <h1 className="text-sm font-semibold text-[var(--text-primary)]">
                  {activeTitle.length > 40 ? activeTitle.slice(0, 40) + '…' : activeTitle}
                </h1>
                {activeConversationId && (
                  <p className="text-[11px] text-[var(--text-secondary)]">
                    {messages.length} message{messages.length !== 1 ? 's' : ''}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Model badge */}
            <div className="hidden items-center gap-1.5 rounded-lg border border-[var(--border-primary)] px-3 py-1.5 sm:flex">
              <Sparkles className="h-3 w-3 text-blue-400" />
              <span className="text-xs text-[var(--text-secondary)]">Gemini 3 Flash</span>
            </div>

            {/* Clear / new chat — only in chat tab */}
            {activeTab === 'chat' && messages.length > 0 && (
              <button
                onClick={handleNewChat}
                className="flex items-center gap-1.5 rounded-lg border border-[var(--border-primary)] px-3 py-1.5 text-xs text-[var(--text-secondary)] transition hover:border-red-500/30 hover:bg-red-500/8 hover:text-red-400"
                title="Clear chat"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* ── Generate Code Tab ─────────────────────────────────────────── */}
        {activeTab === 'generate' && <CodeGeneratorPanel />}

        {/* Messages area — only shown in chat tab */}
        {activeTab === 'chat' && (
        <div
          ref={messagesContainerRef}
          className="flex-1 overflow-y-auto px-4 py-6 sm:px-6"
        >
          {messages.length === 0 ? (
            <EmptyState onSuggestionClick={handleSuggestionClick} />
          ) : (
            <div className="mx-auto max-w-3xl space-y-6">
              {messages.map((msg, idx) => (
                <MessageBubble
                  key={idx}
                  role={msg.role}
                  content={msg.content}
                  timestamp={msg.timestamp}
                  userImage={session?.user?.image}
                  userName={session?.user?.name}
                  isLastMessage={idx === messages.length - 1 && msg.role === 'assistant'}
                  onReviewCode={handleReviewCode}
                />
              ))}

              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <TypingIndicator />
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        )}

        {/* Input area — only shown in chat tab */}
        {activeTab === 'chat' && (
        <div className="shrink-0 border-t border-[var(--border-primary)] bg-[var(--bg-primary)]/95 px-4 pb-4 pt-3 backdrop-blur sm:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="chat-input-glow flex items-end gap-3 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-card)] px-4 py-3 transition-all focus-within:border-blue-500/40">
              <textarea
                ref={textareaRef}
                id="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about programming..."
                disabled={isLoading}
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none disabled:opacity-50"
                style={{ maxHeight: '144px' }}
              />
              <button
                id="chat-send"
                onClick={() => void handleSend()}
                disabled={!input.trim() || isLoading}
                className="btn-press flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send message"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Bottom bar */}
            <div className="mt-2 flex items-center justify-between px-1">
              <p className="text-[11px] text-zinc-750">
                Powered by Gemini AI&nbsp;·&nbsp;Focused on programming
              </p>
              {nearLimit && (
                <span className={`text-[11px] ${charCount > 4900 ? 'text-red-400' : 'text-amber-500'}`}>
                  {charCount}/5000
                </span>
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
