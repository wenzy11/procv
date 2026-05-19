import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * ProCV wordmark — an SVG-rendered chevron-on-square monogram plus the brand
 * type. Inline SVG so the logo recolors with the gradient at any size.
 */
export function Logo({
  className,
  showWordmark = true,
}: {
  className?: string;
  showWordmark?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2.5 select-none",
        className,
      )}
      aria-label="ProCV"
    >
      <span className="relative grid h-8 w-8 place-items-center">
        <span
          aria-hidden
          className="absolute inset-0 rounded-md bg-brand-gradient shadow-[0_0_24px_-6px_rgba(129,140,248,0.7)]"
        />
        <svg
          viewBox="0 0 24 24"
          className="relative h-4 w-4 text-white"
          fill="none"
          aria-hidden
        >
          <path
            d="M5 6h7a4 4 0 0 1 0 8H8"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M14 18l5-5"
            stroke="currentColor"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.85"
          />
        </svg>
      </span>
      {showWordmark ? (
        <span className="flex items-baseline gap-1 font-semibold tracking-tight">
          <span className="text-ink-primary">Pro</span>
          <span className="text-brand-gradient">CV</span>
        </span>
      ) : null}
    </div>
  );
}
