"use client";

import { getIdToken } from "@/lib/firebase/auth";

/** Starts hosted checkout (Polar / Gumroad / Lemon); redirects on success. */
export async function startProCheckout(
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

/** After ?billing=success — ask Polar API and write plan to Firestore. */
export async function syncProPlanAfterPayment(): Promise<boolean> {
  const token = await getIdToken();
  if (!token) return false;

  const res = await fetch("/api/billing/sync", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) return false;
  const data = (await res.json()) as { plan?: string };
  return data.plan === "pro";
}
