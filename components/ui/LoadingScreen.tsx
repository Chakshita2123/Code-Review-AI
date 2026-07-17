'use client';

import { useEffect, useState } from 'react';

export function LoadingScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    // Start fade-out after 1.2s
    const fadeTimer = window.setTimeout(() => setFadeOut(true), 1200);
    // Remove from DOM after fade completes
    const removeTimer = window.setTimeout(() => setVisible(false), 1700);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#06070b] transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      {/* Logo */}
      <div className="loading-logo mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-blue-500/30 bg-blue-500/10">
        <span className="text-2xl font-bold text-blue-400">&lt;/&gt;</span>
      </div>

      {/* Title */}
      <h1 className="loading-title text-xl font-semibold text-white">
        Code Review AI
      </h1>
      <p className="loading-title mt-2 text-sm text-zinc-500">
        Powered by Gemini
      </p>

      {/* Progress bar */}
      <div className="mt-8 h-1 w-48 overflow-hidden rounded-full bg-zinc-800">
        <div className="loading-progress h-full rounded-full bg-gradient-to-r from-blue-500 via-cyan-400 to-violet-500" />
      </div>
    </div>
  );
}
