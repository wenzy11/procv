import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Concatenate Tailwind class strings while de-duplicating conflicting utilities.
 * Used by every primitive so that consumers can override defaults safely.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
