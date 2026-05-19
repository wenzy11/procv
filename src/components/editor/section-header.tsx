import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Compact section header used by every editor block. Keeps spacing consistent
 * and ensures the eyebrow + title rhythm matches across forms.
 */
export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex items-end justify-between gap-3", className)}>
      <div className="space-y-1">
        {eyebrow ? (
          <span className="text-2xs font-medium uppercase tracking-[0.14em] text-accent-300">
            {eyebrow}
          </span>
        ) : null}
        <h2 className="text-lg font-semibold tracking-tight text-ink-primary">
          {title}
        </h2>
        {description ? (
          <p className="text-xs text-ink-tertiary">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}
