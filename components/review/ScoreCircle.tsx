'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ScoreCircleProps {
  score: number;
  size?: number;
}

function useCountUp(target: number, duration = 1500) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const start = performance.now();
    let raf: number;

    function tick(now: number) {
      const elapsed = now - start;
      const t = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Math.round(eased * target));
      if (t < 1) raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return value;
}

export function ScoreCircle({ score, size = 120 }: ScoreCircleProps) {
  const normalized = Math.max(0, Math.min(100, score));
  const displayValue = useCountUp(normalized);

  // Circle geometry — viewBox 0 0 140 140, center 70,70
  const strokeWidth = 10;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (circumference * normalized) / 100;

  // Outer dashed ring
  const outerRadius = radius + 14;
  const outerCircumference = 2 * Math.PI * outerRadius;

  // Color based on score
  const color =
    normalized > 80 ? '#22C55E' : normalized > 60 ? '#EAB308' : '#EF4444';

  const dropShadow =
    normalized > 80
      ? `drop-shadow(0 0 12px #22C55E80)`
      : normalized > 60
        ? `drop-shadow(0 0 12px #EAB30880)`
        : `drop-shadow(0 0 12px #EF444480)`;

  return (
    <div
      className="relative flex flex-col items-center justify-center"
      style={{ width: size, height: size + 24 }}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 140 140"
        className="-rotate-90"
        style={{ filter: dropShadow }}
      >
        {/* Rotating outer dashed ring */}
        <motion.circle
          cx="70"
          cy="70"
          r={outerRadius}
          stroke={color}
          strokeWidth={1.5}
          fill="none"
          strokeDasharray={`${outerCircumference * 0.08} ${outerCircumference * 0.04}`}
          opacity={0.35}
          style={{ transformOrigin: '70px 70px' }}
          animate={{ rotate: 360 }}
          transition={{ duration: 8, ease: 'linear', repeat: Infinity }}
        />

        {/* Background circle */}
        <circle
          cx="70"
          cy="70"
          r={radius}
          stroke="#1F1F1F"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Animated foreground arc */}
        <motion.circle
          cx="70"
          cy="70"
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      </svg>

      {/* Center text */}
      <div
        className="absolute flex flex-col items-center justify-center"
        style={{ top: (size - 44) / 2 }}
      >
        <span className="text-3xl font-bold text-white">{displayValue}</span>
        <span className="text-xs text-zinc-400">/100</span>
      </div>
    </div>
  );
}
