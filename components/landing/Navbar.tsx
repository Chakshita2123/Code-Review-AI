'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Code2, Menu, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { AnimatePresence, motion } from 'framer-motion';
import { useScrollY } from './useScrollY';
import { useActiveSection } from './useActiveSection';

const navItems = [
  { href: '#features', label: 'Features' },
  { href: '#how-it-works', label: 'How It Works' },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const scrolled = useScrollY();
  const activeSection = useActiveSection(['features', 'how-it-works', 'pricing']);
  const { data: session, status } = useSession();
  const ctaHref = status === 'authenticated' ? '/dashboard' : '/login';
  const navBackground = scrolled ? 'bg-black/80 border-b border-white/10 backdrop-blur-xl' : 'bg-transparent';

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${navBackground}`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400">
            <Code2 className="h-5 w-5" />
          </span>
          Code Review AI
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          <nav className="flex items-center gap-6 text-sm text-zinc-400">
            {navItems.map((item) => {
              const isActive = activeSection === item.href.replace('#', '');
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`transition ${isActive ? 'text-white' : 'text-zinc-400 hover:text-white'}`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className="h-6 w-px bg-white/10" />
          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-full border border-white/20 px-4 py-2 text-sm text-white transition hover:border-white/40">
              Sign In
            </Link>
            <Link href={ctaHref} className="rounded-lg bg-blue-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-600">
              Get Started
            </Link>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-white/20 md:hidden"
          aria-label="Toggle navigation"
          onClick={() => setMobileOpen((value) => !value)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="md:hidden"
          >
            <div className="border-t border-white/10 bg-[#0A0A0A]/95 px-4 pb-4 pt-3 backdrop-blur-xl">
              <div className="flex flex-col gap-3 text-sm text-zinc-300">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-2xl px-3 py-3 transition hover:bg-white/5 hover:text-white"
                    onClick={() => setMobileOpen(false)}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
              <div className="mt-4 flex flex-col gap-3">
                <Link
                  href="/login"
                  className="rounded-2xl border border-white/20 px-4 py-3 text-center text-sm text-white transition hover:border-white/40"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href={ctaHref}
                  className="rounded-2xl bg-blue-500 px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-blue-600"
                  onClick={() => setMobileOpen(false)}
                >
                  Get Started
                </Link>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
