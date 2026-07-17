'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { usePathname } from 'next/navigation';

function DashboardCursorGlow() {
  const [position, setPosition] = useState({ x: -9999, y: -9999 });
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleMediaQuery = (e: MediaQueryListEvent | MediaQueryList) => {
      setIsDesktop(e.matches);
    };

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    handleMediaQuery(mediaQuery);
    mediaQuery.addEventListener('change', handleMediaQuery);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaQuery);
    };
  }, []);

  useEffect(() => {
    if (!isDesktop) return;

    let rafId: number;
    let targetX = -9999;
    let targetY = -9999;
    let currentX = -9999;
    let currentY = -9999;

    const handleMouseMove = (e: MouseEvent) => {
      targetX = e.clientX;
      targetY = e.clientY;
      if (currentX === -9999) {
        currentX = targetX;
        currentY = targetY;
      }
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    const tick = () => {
      if (targetX !== -9999) {
        currentX += (targetX - currentX) * 0.08;
        currentY += (targetY - currentY) * 0.08;
        setPosition({ x: currentX, y: currentY });
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(rafId);
    };
  }, [isDesktop]);

  if (!isDesktop || position.x === -9999) return null;

  return (
    <div
      className="pointer-events-none fixed z-0 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,_rgba(59,130,246,0.12)_0%,_transparent_70%)] blur-3xl"
      style={{
        left: position.x,
        top: position.y,
        willChange: 'left, top',
      }}
    />
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#06070b] text-white relative overflow-hidden">
      <DashboardCursorGlow />
      <div className="flex min-h-screen relative z-10">
        <div className="hidden lg:block">
          <Sidebar />
        </div>

        {isOpen ? (
          <div className="fixed inset-0 z-40 bg-black/70 lg:hidden" onClick={() => setIsOpen(false)} />
        ) : null}

        <div className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-zinc-800 bg-[#0d0d0d] transition-transform duration-200 lg:hidden ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <Sidebar onClose={() => setIsOpen(false)} mobile />
        </div>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-zinc-800 bg-[#06070b]/90 px-4 backdrop-blur lg:hidden">
            <button onClick={() => setIsOpen(true)} className="rounded-lg border border-zinc-800 p-2 text-zinc-300">
              <Menu className="h-5 w-5" />
            </button>
            <div className="text-sm font-semibold">Code Review AI</div>
            <button onClick={() => setIsOpen(false)} className="rounded-lg border border-zinc-800 p-2 text-zinc-300">
              <X className="h-5 w-5" />
            </button>
          </header>

          <main className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
