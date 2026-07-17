'use client';

import { motion } from 'framer-motion';

const features = [
  {
    icon: '🤖',
    title: 'AI Code Review',
    description: 'Instant detailed reviews powered by Google Gemini.',
  },
  {
    icon: '🐛',
    title: 'Bug Detection',
    description: 'Automatically identify bugs, errors, and potential crashes.',
  },
  {
    icon: '⚡',
    title: 'Performance Analysis',
    description: 'Time & space complexity with optimization suggestions.',
  },
  {
    icon: '🔒',
    title: 'Security Scanning',
    description: 'Detect common vulnerabilities and security issues.',
  },
  {
    icon: '📖',
    title: 'Code Explanation',
    description: 'Understand every block in beginner-friendly language.',
  },
  {
    icon: '📊',
    title: 'Review History',
    description: 'Save, search, and track all your past reviews.',
  },
];

export function Features() {
  return (
    <section id="features" className="relative z-10 py-24 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-blue-400">Everything You Need to Write Better Code</p>
          <h2 className="mt-4 text-4xl font-bold sm:text-5xl">A complete toolkit for code quality</h2>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              whileHover={{ scale: 1.02 }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: index * 0.08 }}
              className="rounded-3xl border border-zinc-800 bg-[#111111] p-6 transition duration-300 hover:border-blue-500/30"
            >
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-500/10 text-2xl">{feature.icon}</div>
              <h3 className="text-xl font-semibold text-white">{feature.title}</h3>
              <p className="mt-4 text-sm leading-7 text-zinc-400">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
