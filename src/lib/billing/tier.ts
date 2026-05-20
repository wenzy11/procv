import type { BillingTier } from "./types";

export function parseBillingTier(raw: unknown): BillingTier | null {
  if (raw === "monthly" || raw === "yearly" || raw === "unlimited") return raw;
  return null;
}
