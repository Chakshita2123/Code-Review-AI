'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

const stats = [
  { target: 10000, suffix: '+', label: 'Reviews Generated' },
  { target: 50, suffix: '+', label: 'Languages Supported' },
  { target: 99, suffix: '%', label: 'Accuracy Rate' },
  { target: 3, prefix: '< ', suffix: 's', label: 'Average Review Time' },
];

function useCountUp(target: number, active: boolean, duration = 1200) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const totalFrames = Math.round((duration / 1000) * 60);
    const start = performance.now();

    const update = (timestamp: number) => {
      const progress = Math.min((timestamp - start) / duration, 1);
      setValue(Math.round(target * progress));
      if (progress < 1) {
        requestAnimationFrame(update);
      }
    };

    const animation = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animation);
  }, [active, duration, target]);

  return value;
}

export function StatsBar() {
  const [started, setStarted] = useState(false);
  const counts = stats.map((stat) => useCountUp(stat.target, started));

  return (
    <section className="relative z-10 border-t border-b border-zinc-800 bg-[#09090a] py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          onViewportEnter={() => setStarted(true)}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="grid gap-6 text-center sm:grid-cols-4"
        >
          {stats.map((stat, index) => {
            const count = counts[index];
            const display = `${stat.prefix ?? ''}${count.toLocaleString()}${stat.suffix ?? ''}`;

            return (
              <div key={stat.label} className="rounded-3xl border border-zinc-800 bg-[#111111] px-6 py-8">
                <p className="text-4xl font-semibold text-white">{display}</p>
                <p className="mt-3 text-sm text-zinc-400">{stat.label}</p>
              </div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
