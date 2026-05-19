"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

/**
 * Button — the single canonical button across ProCV.
 *
 * Variants:
 *  - `primary`   : brand gradient, used for the dominant action on a screen.
 *  - `secondary` : muted surface, used for neutral actions.
 *  - `ghost`     : transparent, used inside dense toolbars.
 *  - `outline`   : hairline border, used for low-emphasis controls.
 *  - `destructive`
 *  - `neon`      : glowing call-to-action used for AI-related actions.
 */
const buttonVariants = cva(
  "relative inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium leading-none transition-[transform,box-shadow,background-color,color] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-base disabled:pointer-events-none disabled:opacity-50 active:translate-y-px select-none",
  {
    variants: {
      variant: {
        primary:
          "text-white bg-brand-gradient shadow-glow hover:shadow-glow-strong",
        secondary:
          "bg-white/[0.04] text-ink-primary border border-white/[0.06] hover:bg-white/[0.07]",
        ghost:
          "text-ink-secondary hover:text-ink-primary hover:bg-white/[0.05]",
        outline:
          "border border-white/[0.08] text-ink-primary hover:border-white/[0.16] hover:bg-white/[0.04]",
        destructive:
          "bg-state-danger/15 text-state-danger border border-state-danger/30 hover:bg-state-danger/25",
        neon: "text-white bg-brand-gradient ring-1 ring-violet-400/40 shadow-[0_0_24px_-6px_rgba(129,140,248,0.6)] hover:shadow-[0_0_32px_-4px_rgba(168,85,247,0.8)]",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-9 px-4",
        lg: "h-11 px-5 text-base",
        icon: "h-9 w-9",
        "icon-sm": "h-7 w-7",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

/**
 * When `asChild` is `true`, the Button delegates rendering to its single child
 * via Radix `Slot`. In that mode we render the child *as-is* — Slot expects
 * exactly one React element and won't accept the spinner + content wrappers
 * we use in standalone mode. Consumers using `asChild` are responsible for
 * their own content; the `loading` prop is only honored on real buttons.
 */
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild, loading, disabled, children, ...props },
    ref,
  ) => {
    if (asChild) {
      return (
        <Slot
          ref={ref}
          className={cn(buttonVariants({ variant, size }), className)}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        data-loading={loading ? "" : undefined}
        {...props}
      >
        {loading ? (
          <span
            aria-hidden
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
          >
            <span className="block h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white/90" />
          </span>
        ) : null}
        <span
          className={cn(
            "inline-flex items-center gap-2",
            loading && "opacity-0",
          )}
        >
          {children}
        </span>
      </button>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
