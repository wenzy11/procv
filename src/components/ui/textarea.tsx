"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, rows = 4, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          "block w-full resize-y rounded-md border border-white/[0.06] bg-white/[0.03] px-3 py-2.5 text-sm leading-6 text-ink-primary placeholder:text-ink-muted transition-colors focus:border-accent-400/60 focus:bg-white/[0.05] focus:outline-none focus:ring-2 focus:ring-accent-400/20",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";
