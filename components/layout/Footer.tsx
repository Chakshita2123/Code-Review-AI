import Link from 'next/link';
import { Github, Twitter } from 'lucide-react';

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-zinc-800 bg-[#0B0B0E] text-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 px-4 py-12 sm:px-6 lg:px-8 lg:flex-row lg:justify-between">
        <div className="space-y-3">
          <Link href="/" className="flex items-center gap-3 text-lg font-semibold text-white">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/15 text-blue-400">&lt;/&gt;</span>
            Code Review AI
          </Link>
          <p className="max-w-sm text-sm text-zinc-400">AI-powered code reviews for developers.</p>
        </div>

        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">Product</h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-500">
              <li>
                <a href="#features" className="transition hover:text-white">Features</a>
              </li>
              <li>
                <a href="#how-it-works" className="transition hover:text-white">How It Works</a>
              </li>
              <li>
                <a href="#pricing" className="transition hover:text-white">Pricing</a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">Company</h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-500">
              <li>
                <Link href="/about" className="transition hover:text-white">About</Link>
              </li>
              <li>
                <Link href="/blog" className="transition hover:text-white">Blog</Link>
              </li>
              <li>
                <Link href="/careers" className="transition hover:text-white">Careers</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-zinc-400">Legal</h3>
            <ul className="mt-4 space-y-3 text-sm text-zinc-500">
              <li>
                <Link href="/privacy" className="transition hover:text-white">Privacy</Link>
              </li>
              <li>
                <Link href="/terms" className="transition hover:text-white">Terms</Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="space-y-4">
          <p className="text-sm text-zinc-400">Connect with us</p>
          <div className="flex items-center gap-3 text-zinc-400">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="transition hover:text-white">
              <Github className="h-5 w-5" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noreferrer" className="transition hover:text-white">
              <Twitter className="h-5 w-5" />
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-zinc-800 px-4 py-4 text-center text-sm text-zinc-500 sm:px-6 lg:px-8">
        © 2025 Code Review AI. Built with ❤️ and Next.js
      </div>
    </footer>
  );
}
