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
    <aside className="flex h-full w-64 flex-col bg-[#0d0d0d] p-4 text-white">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/15 text-blue-400 transition-transform duration-300 hover:rotate-[15deg]">
            <span className="text-sm font-semibold">&lt;/&gt;</span>
          </div>
          <div>
            <div className="text-sm font-semibold">Code Review AI</div>
            <div className="text-xs text-zinc-500">Developer Copilot</div>
          </div>
        </div>
        {mobile ? (
          <button onClick={onClose} className="rounded-lg border border-zinc-800 p-2 text-zinc-400 lg:hidden">
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
                  ? 'nav-active-dot border-blue-500/20 bg-blue-500/10 text-blue-400'
                  : 'text-zinc-400 hover:border-zinc-800 hover:bg-zinc-900 hover:text-white',
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto rounded-2xl border border-zinc-800 bg-zinc-950/80 p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/15 text-sm font-semibold text-blue-400">
            {session?.user?.name?.charAt(0) ?? 'U'}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">{session?.user?.name ?? 'User'}</div>
            <div className="truncate text-xs text-zinc-500">{session?.user?.email ?? 'member@code-review.ai'}</div>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="btn-press mt-3 w-full rounded-lg border border-zinc-800 px-3 py-2 text-sm text-zinc-300 transition hover:bg-zinc-900"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
}
