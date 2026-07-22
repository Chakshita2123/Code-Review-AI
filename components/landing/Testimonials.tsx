'use client';

import { motion } from 'framer-motion';

const testimonials = [
  {
    initials: 'AK',
    name: 'Arjun Kumar',
    role: 'Full Stack Developer',
    quote: 'Code Review AI caught a critical security vulnerability in my API that I had missed for weeks. The suggestions were spot on.',
  },
  {
    initials: 'SP',
    name: 'Sarah Park',
    role: 'CS Student, MIT',
    quote: 'As a student, the code explanations are incredibly helpful. It teaches me WHY something is wrong, not just that it is.',
  },
  {
    initials: 'MR',
    name: 'Miguel Rodriguez',
    role: 'Senior Engineer',
    quote: 'The complexity analysis alone is worth it. Instantly tells me O(n²) vs O(n log n) trade-offs for every function.',
  },
];

export function Testimonials() {
  return (
    <section className="relative z-10 py-24 text-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.32em] text-blue-400">Loved by Developers</p>
          <h2 className="mt-4 text-4xl font-bold sm:text-5xl">Loved by Developers</h2>
        </div>

        <div className="mt-14 grid gap-6 grid-cols-1 md:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              whileHover={{ y: -6 }}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.65, delay: index * 0.1 }}
              className="rounded-3xl border border-zinc-800 bg-[#111111] p-8"
            >
              <div className="mb-6 flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-3xl bg-gradient-to-br from-blue-500 to-violet-500 text-sm font-semibold text-white">
                  {testimonial.initials}
                </div>
                <div>
                  <p className="text-base font-semibold text-white">{testimonial.name}</p>
                  <p className="text-sm text-zinc-400">{testimonial.role}</p>
                </div>
              </div>
              <p className="text-sm leading-7 text-zinc-300">“{testimonial.quote}”</p>
              <div className="mt-8 flex items-center gap-1 text-amber-400">★★★★★</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
