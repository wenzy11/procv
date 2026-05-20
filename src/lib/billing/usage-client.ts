"use client";

import { getIdToken } from "@/lib/firebase/auth";

export interface UsageSnapshot {
  ats: { count: number; limit: number; remaining: number; paid: boolean };
  resumes: { count: number; limit: number; remaining: number };
}

export async function fetchUsageSnapshot(): Promise<UsageSnapshot | null> {
  const token = await getIdToken();
  if (!token) return null;

  const res = await fetch("/api/billing/usage", {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) return null;
  return res.json() as Promise<UsageSnapshot>;
}
