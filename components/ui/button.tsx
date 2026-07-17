import * as React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost';
}

export function Button({ className, variant = 'default', ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
        variant === 'outline'
          ? 'border border-border bg-transparent text-foreground hover:bg-zinc-950'
          : variant === 'ghost'
          ? 'bg-transparent text-foreground hover:bg-zinc-950'
          : 'bg-accent text-black hover:bg-blue-500',
        className,
      )}
      {...props}
    />
  );
}
