'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useSession } from 'next-auth/react';

/* ── Floating code symbols ─────────────────────────────────────────── */
const CODE_SYMBOLS = ['{ }', '< >', ';', '=>', '//', '/* */', '( )', '&&', '||', '!='];

function FloatingSymbols() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {CODE_SYMBOLS.map((sym, i) => {
        const left = `${5 + ((i * 23) % 90)}%`;
        const fontSize = `${0.7 + (i % 3) * 0.4}rem`;
        const duration = `${12 + (i % 5) * 4}s`;
        const delay = `${(i * 1.7) % 10}s`;
        const opacity = 0.05 + (i % 4) * 0.03;

        return (
          <span
            key={i}
            className="floating-symbol font-mono text-blue-300"
            style={{
              left,
              bottom: '-10%',
              fontSize,
              animationDuration: duration,
              animationDelay: delay,
              opacity: 0,
              // max opacity set via keyframe
              ['--float-max-opacity' as string]: opacity,
            }}
          >
            {sym}
          </span>
        );
      })}
    </div>
  );
}

export function Hero() {
  const { status } = useSession();
  const router = useRouter();
  const ctaHref = status === 'authenticated' ? '/dashboard' : '/login';

  return (
    <section id="hero" className="relative z-10 overflow-hidden bg-transparent text-white">

      {/* Radial glows */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.18),transparent_28%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,_rgba(79,70,229,0.14),transparent_25%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_70%)]" />
      <div className="pointer-events-none absolute inset-0 bg-grid-dots opacity-30" />

      {/* Hero beam from top */}
      <div className="hero-beam" />

      {/* Floating code symbols */}
      <FloatingSymbols />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-64px)] max-w-7xl flex-col items-center justify-center px-4 py-16 text-center sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-semibold text-blue-300 shadow-[0_0_0_1px_rgba(59,130,246,0.04)]"
        >
          <Sparkles className="h-4 w-4" />
          AI-Powered Code Reviews
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: 'easeOut', delay: 0.1 }}
          className="max-w-5xl text-5xl font-black leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl"
        >
          Get Instant
          <br />
          <span className="gradient-text-animated">
            AI Code Reviews
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: 'easeOut', delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-base leading-8 text-zinc-400 sm:text-lg"
        >
          Identify bugs, improve readability, optimize performance, and write cleaner code — powered by Gemini AI.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: 'easeOut', delay: 0.3 }}
          className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <button
            type="button"
            onClick={() => router.push(ctaHref)}
            className="btn-shimmer btn-press inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-500 px-8 py-4 text-base font-semibold text-white transition hover:bg-blue-600"
          >
            Start Reviewing Now
            <ArrowRight className="h-4 w-4" />
          </button>
          <Link
            href="#how-it-works"
            className="btn-shimmer btn-press inline-flex items-center justify-center rounded-2xl border border-zinc-700 bg-transparent px-8 py-4 text-base font-semibold text-white transition hover:border-zinc-500"
          >
            See How It Works
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: 'easeOut', delay: 0.4 }}
          className="mt-6 text-sm text-zinc-500"
        >
          ★★★★★ Trusted by 500+ developers
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.75, ease: 'easeOut', delay: 0.5 }}
          className="relative mt-16 w-full max-w-5xl"
        >
          <div className="absolute -left-10 top-8 h-24 w-24 rounded-full bg-blue-500/10 blur-3xl" />
          <div className="absolute -right-10 bottom-8 h-24 w-24 rounded-full bg-emerald-500/10 blur-3xl" />

          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 6, ease: 'easeInOut', repeat: Infinity, delay: 1 }}
            className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 px-6 py-8 shadow-2xl shadow-black/40 backdrop-blur-xl sm:px-8"
          >
            <div className="grid gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
              <div>
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.3em] text-blue-300/80">Developer Report</p>
                    <h2 className="mt-3 text-3xl font-semibold text-white">Overall quality snapshot</h2>
                  </div>
                  <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-300">Live preview</span>
                </div>

                <div className="grid gap-4 rounded-[1.75rem] bg-[#09090d] p-6">
                  <div className="flex flex-wrap gap-3">
                    <span className="rounded-2xl bg-emerald-500/10 px-3 py-2 text-sm font-semibold text-emerald-300">Overall Score: 87/100</span>
                    <span className="rounded-2xl bg-red-500/10 px-3 py-2 text-sm font-semibold text-red-300">Bugs Found: 2</span>
                    <span className="rounded-2xl bg-amber-500/10 px-3 py-2 text-sm font-semibold text-amber-300">Performance: 8/10</span>
                  </div>

                  <div className="grid gap-3 rounded-[1.75rem] bg-zinc-950/70 p-5">
                    <div className="flex items-center justify-between text-sm text-zinc-400">
                      <span>Readability</span>
                      <span className="font-semibold text-white">9/10</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full w-11/12 rounded-full bg-emerald-400" />
                    </div>
                    <div className="flex items-center justify-between text-sm text-zinc-400">
                      <span>Security</span>
                      <span className="font-semibold text-white">10/10</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full w-full rounded-full bg-emerald-400" />
                    </div>
                    <div className="flex items-center justify-between text-sm text-zinc-400">
                      <span>Time Complexity</span>
                      <span className="font-semibold text-white">O(n log n)</span>
                    </div>
                  </div>

                  <div className="rounded-[1.75rem] bg-[#11121a] p-5 text-sm text-zinc-300">
                    <p className="text-xs uppercase tracking-[0.24em] text-zinc-500">Top Recommendation</p>
                    <p className="mt-3 text-base font-medium text-white">Replace nested loops with HashMap to reduce repeated work and simplify iteration.</p>
                  </div>
                </div>
              </div>

              <div className="relative flex items-center justify-center">
                <div className="absolute -left-8 top-8 rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-200 shadow-lg shadow-blue-500/10">
                  Bug Detected 🐛
                </div>
                <div className="absolute -right-8 bottom-8 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-200 shadow-lg shadow-emerald-500/10">
                  Score: 87/100 ✅
                </div>
                <div className="h-[300px] w-full overflow-hidden rounded-[2rem] bg-gradient-to-br from-slate-950 via-[#090a14] to-slate-950 p-5 shadow-2xl shadow-slate-950/80">
                  <div className="flex items-center gap-3 text-sm text-zinc-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                  </div>
                  <pre className="mt-6 h-full overflow-hidden text-left text-sm leading-6 text-zinc-300">
                    <code>{`function validateSignup(user) {
  const issues = [];

  if (!user.email.match(/@/)) {
    issues.push('Invalid email address');
  }

  if (user.password.length < 12) {
    issues.push('Password must be at least 12 characters');
  }

  return {
    score: 87,
    issues,
    recommendation: 'Replace nested loops with HashMap',
  };
}`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
