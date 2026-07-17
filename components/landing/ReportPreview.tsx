'use client';

import { motion } from 'framer-motion';

export function ReportPreview() {
  return (
    <section className="relative z-10 py-24 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-blue-400">Your Personal Code Report Card</p>
          <h2 className="mt-4 text-4xl font-bold sm:text-5xl">Don't just get told 'your code is good'. Get specifics.</h2>
          <p className="mt-4 text-base leading-8 text-zinc-400">A polished developer report with scores, issue summaries, and actionable optimization guidance.</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.7 }}
          className="mt-14 grid gap-8 lg:grid-cols-[1.1fr_0.9fr]"
        >
          <div className="rounded-3xl border border-zinc-800 bg-[#111111] p-8">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-blue-400">Code Input</p>
                <p className="mt-2 text-lg font-semibold text-white">Input code with syntax highlighting</p>
              </div>
            </div>
            <div className="rounded-3xl bg-[#07070b] p-5 text-sm leading-6 text-zinc-300">
              <pre>{`function analyzeData(items) {
  const results = [];

  for (let i = 0; i < items.length; i++) {
    for (let j = 0; j < items.length; j++) {
      if (items[i].id === items[j].parentId) {
        results.push(items[i]);
      }
    }
  }

  return results;
}`}</pre>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-zinc-800 bg-[#111111] p-8">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.28em] text-zinc-400">Developer Report</p>
                  <p className="mt-2 text-lg font-semibold text-white">Detailed assessments at a glance</p>
                </div>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-sm font-semibold text-emerald-300">Scorecard</span>
              </div>
              <div className="mt-6 space-y-4">
                <div className="rounded-3xl bg-[#0d0d14] p-5">
                  <div className="flex items-center justify-between gap-4 text-sm text-zinc-400">
                    <span>Code Quality</span>
                    <span className="font-semibold text-white">87/100</span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/5">
                    <div className="h-full w-11/12 rounded-full bg-emerald-400" />
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="rounded-3xl bg-[#0d0d14] p-5">
                    <p className="text-sm text-zinc-400">Bugs Found</p>
                    <p className="mt-2 text-xl font-semibold text-red-300">2</p>
                  </div>
                  <div className="rounded-3xl bg-[#0d0d14] p-5">
                    <p className="text-sm text-zinc-400">Performance</p>
                    <p className="mt-2 text-xl font-semibold text-amber-300">8/10</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="rounded-3xl border border-zinc-800 bg-[#111111] p-8">
              <p className="text-sm uppercase tracking-[0.28em] text-zinc-400">Top Recommendation</p>
              <p className="mt-4 text-xl font-semibold text-white">Replace the nested loops with a HashMap lookup.</p>
              <p className="mt-4 text-sm leading-7 text-zinc-400">This change reduces runtime and makes the review much easier to maintain.</p>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
