import * as React from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps extends React.HTMLAttributes<HTMLDivElement> {
  content: string;
  children: React.ReactNode;
}

export function Tooltip({ content, className, children, ...props }: TooltipProps) {
  return (
    <div className={cn('group relative inline-flex', className)} {...props}>
      {children}
      <span className="pointer-events-none absolute left-1/2 top-full mt-2 hidden -translate-x-1/2 rounded-md bg-zinc-900 px-2 py-1 text-xs text-zinc-100 group-hover:block">
        {content}
      </span>
    </div>
  );
}
