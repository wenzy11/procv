"use client";

import { getIdToken } from "@/lib/firebase/auth";
import { hasPaidAccess, normalizePlan } from "@/lib/billing/plan";
import type { BillingTier } from "@/lib/billing/types";

/** Starts hosted checkout for a paid tier. */
export async function startProCheckout(
  tier: BillingTier,
  email?: string | null,
  locale?: string | null,
): Promise<void> {
  const token = await getIdToken();
  if (!token) {
    throw new Error("NOT_SIGNED_IN");
  }

  const res = await fetch("/api/billing/checkout", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      tier,
      ...(email ? { email } : {}),
      ...(locale ? { locale } : {}),
    }),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `Checkout failed (${res.status})`);
  }

  const { url } = (await res.json()) as { url: string };
  if (!url) throw new Error("No checkout URL");
  window.location.href = url;
}

export type BillingConfig = {
  polar: boolean;
  tiers: BillingTier[];
};

export async function fetchBillingConfig(): Promise<BillingConfig> {
  const res = await fetch("/api/billing/config", { cache: "no-store" });
  if (!res.ok) {
    return { polar: false, tiers: [] };
  }
  return res.json() as Promise<BillingConfig>;
}

/** After ?billing=success — sync plan from Polar. */
export async function syncProPlanAfterPayment(): Promise<boolean> {
  const token = await getIdToken();
  if (!token) return false;

  const res = await fetch("/api/billing/sync", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return false;
  const data = (await res.json()) as { plan?: string };
  const plan = normalizePlan(data.plan);
  return hasPaidAccess({ plan, subscriptionStatus: "active" });
}
