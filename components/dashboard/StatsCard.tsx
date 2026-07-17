'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  glowColor?: 'blue' | 'green' | 'red' | 'purple';
  className?: string;
}

const glowMap: Record<NonNullable<StatsCardProps['glowColor']>, string> = {
  blue: 'stat-glow-blue',
  green: 'stat-glow-green',
  red: 'stat-glow-red',
  purple: 'stat-glow-purple',
};

function useCountUp(value: number, duration = 1200) {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let raf: number | null = null;
    const start = Date.now();
    const to = value;

    function frame() {
      const now = Date.now();
      const t = Math.min(1, (now - start) / duration);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(eased * to));
      if (t < 1) raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [value, duration]);

  return display;
}

export function StatsCard({ title, value, subtitle, icon, glowColor = 'blue', className }: StatsCardProps) {
  const numericValue = typeof value === 'number' ? value : parseFloat(String(value));
  const isNumeric = !isNaN(numericValue);
  const countedValue = useCountUp(isNumeric ? numericValue : 0);
  const displayValue = isNumeric ? countedValue : value;

  return (
    <div
      className={cn(
        'rounded-2xl border border-zinc-800 bg-[#111111] p-6 transition hover:-translate-y-1 hover:border-zinc-700',
        glowMap[glowColor],
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {icon && <div className="shrink-0">{icon}</div>}
          <div>
            <p className="text-sm text-zinc-400">{title}</p>
            <h3 className="mt-1 text-2xl font-semibold text-white">{displayValue}</h3>
            {subtitle && <p className="mt-1 text-xs text-zinc-500">{subtitle}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
