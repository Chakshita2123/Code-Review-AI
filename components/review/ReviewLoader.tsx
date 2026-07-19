'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Cpu } from 'lucide-react';

const normalMessages = [
  '🔍 Analyzing your code...',
  '🐛 Hunting for bugs...',
  '📊 Measuring complexity...',
  '🔒 Security scanning...',
  '🤖 Consulting AI overlords...',
  '✨ Almost ready...',
];

const roastMessages = [
  '🔥 Preparing your roast...',
  "😅 Finding mistakes... there are many",
  "😈 Asking Gemini to be gentle... it refused",
  "💀 Writing your code's eulogy...",
  "👀 Judging your life choices...",
  "🎭 Almost done roasting...",
];

interface ReviewLoaderProps {
  isRoastMode?: boolean;
  streamingStatus?: string | null;
}

export function ReviewLoader({ isRoastMode = false, streamingStatus = null }: ReviewLoaderProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  const messages = isRoastMode ? roastMessages : normalMessages;

  useEffect(() => {
    const messageTimer = window.setInterval(() => {
      setMessageIndex((v) => (v + 1) % messages.length);
    }, 1500);

    // Fill progress over ~8s with easing
    const startTime = Date.now();
    const duration = 8000;
    const progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const t = Math.min(elapsed / duration, 1);
      // ease-out quad
      const eased = 1 - Math.pow(1 - t, 2);
      setProgress(Math.round(eased * 96)); // cap at 96 to never show 100% until done
    }, 80);

    return () => {
      window.clearInterval(messageTimer);
      window.clearInterval(progressTimer);
    };
  }, [messages.length]);

  return (
    <div
      className="relative flex h-full min-h-[420px] flex-col items-center justify-center overflow-hidden rounded-3xl border border-blue-500/20 border-pulse-blue p-8 text-center"
      style={{
        background: '#0A0A10',
        backgroundImage:
          'linear-gradient(rgba(31,31,48,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(31,31,48,0.6) 1px, transparent 1px)',
        backgroundSize: '30px 30px',
      }}
    >
      {/* Scanner line */}
      <div className="scan-line" />

      {/* Corner bracket — top-left */}
      <span
        className="loader-corner pointer-events-none absolute left-4 top-4 h-8 w-8 border-l-2 border-t-2 border-blue-400/60"
        style={{ animation: 'pulse-corner 2s ease-in-out infinite' }}
      />
      {/* Corner bracket — top-right */}
      <span
        className="loader-corner pointer-events-none absolute right-4 top-4 h-8 w-8 border-r-2 border-t-2 border-blue-400/60"
        style={{ animation: 'pulse-corner 2s ease-in-out infinite 0.5s' }}
      />
      {/* Corner bracket — bottom-left */}
      <span
        className="loader-corner pointer-events-none absolute bottom-4 left-4 h-8 w-8 border-b-2 border-l-2 border-blue-400/60"
        style={{ animation: 'pulse-corner 2s ease-in-out infinite 1s' }}
      />
      {/* Corner bracket — bottom-right */}
      <span
        className="loader-corner pointer-events-none absolute bottom-4 right-4 h-8 w-8 border-b-2 border-r-2 border-blue-400/60"
        style={{ animation: 'pulse-corner 2s ease-in-out infinite 1.5s' }}
      />

      {/* Center AI icon with rotating ring */}
      <div className="relative mb-6 flex items-center justify-center">
        {/* Rotating outer ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, ease: 'linear', repeat: Infinity }}
          className="absolute h-24 w-24 rounded-full border border-dashed border-blue-400/30"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 5, ease: 'linear', repeat: Infinity }}
          className="absolute h-[88px] w-[88px] rounded-full border border-blue-500/15"
        />
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, ease: 'easeInOut', repeat: Infinity }}
          className="flex h-16 w-16 items-center justify-center rounded-full border border-blue-500/40 bg-blue-500/10"
          style={{ boxShadow: '0 0 30px rgba(59,130,246,0.25), 0 0 60px rgba(59,130,246,0.1)' }}
        >
          <Cpu className="h-7 w-7 text-blue-300" />
        </motion.div>
      </div>

      {/* Rotating message */}
      <motion.div
        key={streamingStatus || messageIndex}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.3 }}
        className="mb-2 text-lg font-semibold text-white"
      >
        {streamingStatus || messages[messageIndex]}
      </motion.div>

      <p className="max-w-sm text-sm leading-7 text-zinc-400">
        {isRoastMode
          ? 'Our AI is preparing a brutally honest analysis of your code...'
          : 'Our AI is reviewing architecture, correctness, security, and readability in real time.'}
      </p>

      {/* Progress bar */}
      <div className="mt-8 h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-zinc-800">
        <motion.div
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.15, ease: 'linear' }}
          className="h-full rounded-full"
          style={{
            background: 'linear-gradient(90deg, #3B82F6, #06B6D4, #8B5CF6)',
            boxShadow: '0 0 8px rgba(59,130,246,0.6), 0 0 16px rgba(59,130,246,0.2)',
          }}
        />
      </div>

      <div className="mt-3 text-sm text-zinc-500">This usually takes a few seconds.</div>
    </div>
  );
}
