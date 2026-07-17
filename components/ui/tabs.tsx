import * as React from 'react';
import { cn } from '@/lib/utils';

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Tabs({ className, children, ...props }: TabsProps) {
  return (
    <div className={cn('flex flex-col gap-2', className)} {...props}>
      {children}
    </div>
  );
}

interface TabListProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function TabList({ className, children, ...props }: TabListProps) {
  return (
    <div className={cn('flex gap-2', className)} {...props}>
      {children}
    </div>
  );
}

interface TabTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export function TabTrigger({ className, children, ...props }: TabTriggerProps) {
  return (
    <button
      className={cn(
        'rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground transition hover:bg-zinc-950',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
