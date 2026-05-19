"use client";

import { getIdToken } from "@/lib/firebase/auth";

/** Starts Lemon Squeezy checkout; redirects the browser on success. */
export async function startProCheckout(email?: string | null): Promise<void> {
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
    body: JSON.stringify(email ? { email } : {}),
  });

  if (!res.ok) {
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(data.error ?? `Checkout failed (${res.status})`);
  }

  const { url } = (await res.json()) as { url: string };
  if (!url) throw new Error("No checkout URL");
  window.location.href = url;
}
