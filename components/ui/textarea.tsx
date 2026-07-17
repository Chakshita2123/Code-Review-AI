import * as React from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn('min-h-[120px] w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm text-foreground outline-none transition-colors placeholder:text-zinc-500 focus:border-accent focus:ring-2 focus:ring-accent/20', className)}
      {...props}
    />
  ),
);

Textarea.displayName = 'Textarea';
