'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const faqs = [
  {
    question: 'Is Code Review AI free?',
    answer: 'Yes! Code Review AI is completely free to use. Sign in with Google and start reviewing your code instantly with no limits.',
  },
  {
    question: 'Which programming languages are supported?',
    answer: 'Currently supports Java, Python, JavaScript, TypeScript, C++, C, Go, Rust, PHP, and C#.',
  },
  {
    question: 'How accurate are the AI reviews?',
    answer: 'Reviews are powered by Google Gemini, one of the most advanced AI models available.',
  },
  {
    question: 'Is my code stored securely?',
    answer: 'Yes, all code is encrypted and stored securely. You can delete your reviews at any time.',
  },
  {
    question: 'Can I use this for production code?',
    answer: 'Absolutely. The security scanning and bug detection are designed for real-world code.',
  },
];

function FAQItem({ item, index }: { item: { question: string; answer: string }; index: number }) {
  const [open, setOpen] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.6, delay: index * 0.05 }}
      className="rounded-3xl border border-zinc-800 bg-[#111111] overflow-hidden"
    >
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between p-6 text-left transition hover:bg-white/[0.02]"
        aria-expanded={open}
      >
        <h3 className="text-lg font-semibold text-white pr-4">{item.question}</h3>
        <span
          className={`shrink-0 text-zinc-400 transition-transform duration-300 ${open ? 'rotate-180' : ''}`}
          aria-hidden
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <p className="px-6 pb-6 text-sm leading-7 text-zinc-400">{item.answer}</p>
      </div>
    </motion.div>
  );
}

export function FAQ() {
  return (
    <section className="relative z-10 py-24 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-blue-400">Frequently Asked Questions</p>
          <h2 className="mt-4 text-4xl font-bold sm:text-5xl">Got Questions?</h2>
        </div>

        <div className="mt-14 space-y-4 max-w-3xl mx-auto">
          {faqs.map((item, index) => (
            <FAQItem key={item.question} item={item} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
