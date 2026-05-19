"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Optional icon rendered at the start of the field. */
  leading?: React.ReactNode;
  /** Optional element rendered at the end (e.g., a button). */
  trailing?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, leading, trailing, type = "text", ...props }, ref) => {
    return (
      <div
        className={cn(
          "group relative flex h-10 items-center rounded-md border border-white/[0.06] bg-white/[0.03] transition-colors focus-within:border-accent-400/60 focus-within:bg-white/[0.05] focus-within:ring-2 focus-within:ring-accent-400/20",
          className,
        )}
      >
        {leading ? (
          <span className="pointer-events-none flex h-full items-center pl-3 text-ink-tertiary">
            {leading}
          </span>
        ) : null}
        <input
          ref={ref}
          type={type}
          className={cn(
            "h-full w-full flex-1 bg-transparent px-3 text-sm text-ink-primary placeholder:text-ink-muted focus:outline-none",
            leading && "pl-2",
            trailing && "pr-2",
          )}
          {...props}
        />
        {trailing ? (
          <span className="flex h-full items-center pr-1.5">{trailing}</span>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";
