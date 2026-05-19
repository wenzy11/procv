import * as React from "react";
import { cn } from "@/lib/cn";

/**
 * Skeleton — universal placeholder used while async data resolves.
 * The shimmer animation is defined in `globals.css`.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("skeleton rounded-md", className)}
      {...props}
    />
  );
}
