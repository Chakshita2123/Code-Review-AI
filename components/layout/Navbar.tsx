'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { Code2 } from 'lucide-react';

export function Navbar() {
  const { data: session, status } = useSession();
  const isAuthenticated = status === 'authenticated';

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0A0A0A]/80 backdrop-blur-xl">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/15 text-blue-400">
            <Code2 className="h-4 w-4" />
          </span>
          <span>Code Review AI</span>
        </Link>

        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <>
              <Link href="/dashboard" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10">
                Go to Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link href="/login" className="rounded-full border border-white/10 px-4 py-2 text-sm text-white transition hover:bg-white/10">
                Sign In
              </Link>
              <Link href="/login" className="rounded-full bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-400">
                Get Started
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
