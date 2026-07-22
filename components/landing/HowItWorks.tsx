'use client';

import { motion } from 'framer-motion';
import { Code2, Layers, Sparkles } from 'lucide-react';

const steps = [
  {
    title: 'Paste Your Code',
    description: 'Paste your code or upload a file. Supports 10+ programming languages.',
    icon: Code2,
    number: '01',
  },
  {
    title: 'Select Language',
    description: 'Choose your programming language for accurate, language-specific analysis.',
    icon: Layers,
    number: '02',
  },
  {
    title: 'Get AI Review',
    description: 'Receive a structured Developer Report with scores, bugs, and recommendations.',
    icon: Sparkles,
    number: '03',
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative z-10 py-24 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-blue-400">How It Works</p>
          <h2 className="mt-4 text-4xl font-bold text-white sm:text-5xl">Get a detailed code review in under 3 seconds</h2>
        </motion.div>

        <div className="mt-14 grid gap-6 grid-cols-1 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              whileHover={{ y: -8 }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7, delay: index * 0.12 }}
              className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-[#111111] p-8 transition duration-300 hover:border-blue-500/50"
            >
              <div className="absolute right-6 top-6 text-sm font-semibold text-zinc-700">{step.number}</div>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-3xl bg-blue-500/10 text-blue-300">
                <step.icon className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-semibold text-white">{step.title}</h3>
              <p className="mt-4 text-sm leading-7 text-zinc-400">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
