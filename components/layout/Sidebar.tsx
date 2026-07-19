'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut, useSession } from 'next-auth/react';
import { History, LayoutDashboard, MessageSquare, Settings, Sparkles, User, X } from 'lucide-react';
import { cn } from '@/lib/utils';


const items = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/new-review', label: 'New Review', icon: Sparkles },
  { href: '/history', label: 'History', icon: History },
  { href: '/chat', label: 'AI Chat', icon: MessageSquare },
  { href: '/profile', label: 'Profile', icon: User },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  mobile?: boolean;
  onClose?: () => void;
}

export function Sidebar({ mobile = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();


  return (
    <aside className="flex h-full w-64 flex-col bg-[var(--sidebar-bg)] border-r border-[var(--border-primary)] p-4 text-[var(--text-primary)]">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-subtle)] text-blue-400 transition-transform duration-300 hover:rotate-[15deg]">
            <span className="text-sm font-semibold">&lt;/&gt;</span>
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--text-primary)]">Code Review AI</div>
            <div className="text-xs text-[var(--text-secondary)]">Developer Copilot</div>
          </div>
        </div>
        {mobile ? (
          <button onClick={onClose} className="rounded-lg border border-[var(--border-primary)] p-2 text-[var(--text-secondary)] lg:hidden">
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <nav className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                'nav-sweep flex items-center gap-3 rounded-xl border border-transparent px-3 py-3 text-sm font-medium transition',
                isActive
                  ? 'nav-active-dot border-blue-500/20 bg-[var(--accent-subtle)] text-blue-400'
                  : 'text-[var(--text-secondary)] hover:border-[var(--border-hover)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-[var(--border-primary)] bg-[var(--bg-card)] p-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[var(--accent-subtle)] text-sm font-semibold text-blue-400">
            {session?.user?.name?.charAt(0) ?? 'U'}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-[var(--text-primary)]">{session?.user?.name ?? 'User'}</div>
            <div className="truncate text-xs text-[var(--text-muted)]">{session?.user?.email ?? 'member@code-review.ai'}</div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="btn-press mt-3 w-full rounded-lg border border-[var(--border-primary)] px-3 py-2 text-sm text-[var(--text-secondary)] transition hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
