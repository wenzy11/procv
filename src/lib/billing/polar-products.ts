import "server-only";

import type { BillingTier, UserPlan } from "./types";

function env(id: string | undefined): string | null {
  const v = id?.trim();
  return v || null;
}

/** Polar ürün UUID → plan */
export function planFromPolarProductId(productId: string): UserPlan | null {
  const id = productId.trim();
  if (!id) return null;
  if (id === env(process.env.POLAR_PRODUCT_ID_UNLIMITED)) return "unlimited";
  if (id === env(process.env.POLAR_PRODUCT_ID_YEARLY)) return "yearly";
  if (
    id === env(process.env.POLAR_PRODUCT_ID_MONTHLY) ||
    id === env(process.env.POLAR_PRODUCT_ID)
  ) {
    return "monthly";
  }
  return null;
}

export function getPolarProductIdForTier(tier: BillingTier): string | null {
  switch (tier) {
    case "monthly":
      return (
        env(process.env.POLAR_PRODUCT_ID_MONTHLY) ??
        env(process.env.POLAR_PRODUCT_ID)
      );
    case "yearly":
      return env(process.env.POLAR_PRODUCT_ID_YEARLY);
    case "unlimited":
      return env(process.env.POLAR_PRODUCT_ID_UNLIMITED);
    default:
      return null;
  }
}

export function getConfiguredBillingTiers(): BillingTier[] {
  const tiers: BillingTier[] = [];
  if (getPolarProductIdForTier("monthly")) tiers.push("monthly");
  if (getPolarProductIdForTier("yearly")) tiers.push("yearly");
  if (getPolarProductIdForTier("unlimited")) tiers.push("unlimited");
  return tiers;
}

export function extractProductIdFromPolarData(
  data: Record<string, unknown>,
): string | null {
  const product = data.product as Record<string, unknown> | undefined;
  const candidates = [
    data.product_id,
    data.productId,
    product?.id,
    (data.subscription as Record<string, unknown> | undefined)?.product_id,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
  }
  return null;
}
