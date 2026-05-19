"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * Global toast outlet — themed to fit the ProCV palette. Mounted once at the
 * root layout; components emit toasts via `import { toast } from 'sonner'`.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      theme="dark"
      richColors={false}
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "bg-surface-elevated text-ink-primary border border-white/[0.08] shadow-panel",
          title: "text-sm font-medium",
          description: "text-xs text-ink-tertiary",
          actionButton:
            "!bg-brand-gradient !text-white !shadow-glow !text-xs",
          cancelButton:
            "!bg-white/[0.04] !text-ink-secondary !border !border-white/[0.06]",
          success: "!bg-state-successSoft !text-state-success",
          error: "!bg-state-dangerSoft !text-state-danger",
          info: "!bg-state-infoSoft !text-state-info",
          warning: "!bg-state-warnSoft !text-state-warn",
        },
      }}
    />
  );
}
