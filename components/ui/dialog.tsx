import * as React from 'react';
import { cn } from '@/lib/utils';

interface DialogProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function Dialog({ className, children, ...props }: DialogProps) {
  return (
    <div className={cn('fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4', className)} {...props}>
      {children}
    </div>
  );
}

export function DialogContent({ className, children }: DialogProps) {
  return <div className={cn('rounded-2xl border border-border bg-card p-6 shadow-xl', className)}>{children}</div>;
}
