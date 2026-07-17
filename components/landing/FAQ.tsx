'use client';

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

export function FAQ() {
  return (
    <section className="relative z-10 py-24 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-blue-400">Frequently Asked Questions</p>
          <h2 className="mt-4 text-4xl font-bold sm:text-5xl">Frequently Asked Questions</h2>
        </div>

        <div className="mt-14 space-y-4">
          {faqs.map((item, index) => (
            <motion.div
              key={item.question}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: index * 0.05 }}
              className="rounded-3xl border border-zinc-800 bg-[#111111] p-6"
            >
              <h3 className="text-lg font-semibold text-white">{item.question}</h3>
              <p className="mt-3 text-sm leading-7 text-zinc-400">{item.answer}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
