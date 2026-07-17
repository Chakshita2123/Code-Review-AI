'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

// ── Context ────────────────────────────────────────────────────────────────────

interface AlertDialogContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AlertDialogContext = React.createContext<AlertDialogContextValue>({
  open: false,
  setOpen: () => {},
});

function useAlertDialogContext() {
  return React.useContext(AlertDialogContext);
}

// ── Root ────────────────────────────────────────────────────────────────────────

interface AlertDialogProps {
  /** Controlled mode: pass open + onOpenChange. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export function AlertDialog({ open: controlledOpen, onOpenChange, children }: AlertDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = React.useCallback(
    (value: boolean) => {
      if (isControlled) {
        onOpenChange?.(value);
      } else {
        setInternalOpen(value);
      }
    },
    [isControlled, onOpenChange],
  );

  return (
    <AlertDialogContext.Provider value={{ open, setOpen }}>
      {children}
    </AlertDialogContext.Provider>
  );
}

// ── Trigger ─────────────────────────────────────────────────────────────────────

interface AlertDialogTriggerProps {
  asChild?: boolean;
  children: React.ReactElement | React.ReactNode;
}

export function AlertDialogTrigger({ asChild, children }: AlertDialogTriggerProps) {
  const { setOpen } = useAlertDialogContext();

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<{ onClick?: () => void }>, {
      onClick: () => setOpen(true),
    });
  }

  return (
    <button type="button" onClick={() => setOpen(true)}>
      {children}
    </button>
  );
}

// ── Content (the overlay + panel) ───────────────────────────────────────────────

export function AlertDialogContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const { open, setOpen } = useAlertDialogContext();

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={() => setOpen(false)}
      role="presentation"
    >
      <div
        className={cn('w-full max-w-md rounded-2xl border border-zinc-800 bg-[#111111] p-6 shadow-xl', className)}
        onClick={(e) => e.stopPropagation()}
        role="alertdialog"
        aria-modal="true"
      >
        {children}
      </div>
    </div>
  );
}

// ── Subcomponents ───────────────────────────────────────────────────────────────

export function AlertDialogHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mb-4', className)}>{children}</div>;
}

export function AlertDialogTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h2 className={cn('text-lg font-semibold text-white', className)}>{children}</h2>;
}

export function AlertDialogDescription({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={cn('mt-2 text-sm text-zinc-400', className)}>{children}</p>;
}

export function AlertDialogFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  const { setOpen } = useAlertDialogContext();

  // Wrap children to auto-close on Cancel clicks
  return <div className={cn('mt-6 flex justify-end gap-3', className)}>{children}</div>;
}

export function AlertDialogCancel({
  className,
  children,
  onClick,
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  const { setOpen } = useAlertDialogContext();

  return (
    <button
      type="button"
      onClick={() => {
        setOpen(false);
        onClick?.();
      }}
      className={cn(
        'rounded-lg border border-zinc-700 bg-transparent px-4 py-2 text-sm font-medium text-zinc-300 transition hover:bg-zinc-800',
        className,
      )}
    >
      {children}
    </button>
  );
}

export function AlertDialogAction({
  className,
  children,
  onClick,
  disabled,
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const { setOpen } = useAlertDialogContext();

  return (
    <button
      type="button"
      onClick={() => {
        onClick?.();
        setOpen(false);
      }}
      disabled={disabled}
      className={cn(
        'rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-500 disabled:opacity-50',
        className,
      )}
    >
      {children}
    </button>
  );
}
