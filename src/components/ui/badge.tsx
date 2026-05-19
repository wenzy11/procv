import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/cn";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-2xs font-medium tracking-wide transition-colors",
  {
    variants: {
      tone: {
        neutral:
          "border-white/[0.08] bg-white/[0.04] text-ink-secondary",
        accent:
          "border-accent-400/30 bg-accent-400/10 text-accent-300",
        success:
          "border-state-success/30 bg-state-success/10 text-state-success shadow-[0_0_18px_-6px_rgba(34,197,94,0.6)]",
        warning:
          "border-state-warn/30 bg-state-warn/10 text-state-warn",
        danger:
          "border-state-danger/30 bg-state-danger/10 text-state-danger",
        violet:
          "border-violet-500/30 bg-violet-500/10 text-violet-400",
      },
      size: {
        sm: "h-5 text-2xs",
        md: "h-6 px-2.5 text-xs",
      },
    },
    defaultVariants: {
      tone: "neutral",
      size: "sm",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone, size }), className)} {...props} />;
}
