import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { getEntitlements } from "@/lib/billing/entitlements";
import { normalizePlan } from "@/lib/billing/plan";
import { currentUsageMonth, normalizeAtsUsage } from "@/lib/billing/usage";
import type { SubscriptionStatus, UserPlan } from "@/lib/billing/types";

import { getAdminDb } from "./admin";

export class UsageLimitError extends Error {
  code = "USAGE_LIMIT" as const;
  constructor(message: string) {
    super(message);
    this.name = "UsageLimitError";
  }
}

async function readUserPlan(uid: string): Promise<{
  plan: UserPlan;
  subscriptionStatus: SubscriptionStatus;
  atsUsageMonth?: string;
  atsUsageCount?: number;
}> {
  const snap = await getAdminDb().collection("users").doc(uid).get();
  const data = snap.data() ?? {};
  return {
    plan: normalizePlan(data.plan as string | undefined),
    subscriptionStatus:
      (data.subscriptionStatus as SubscriptionStatus | undefined) ?? "none",
    atsUsageMonth: data.atsUsageMonth as string | undefined,
    atsUsageCount: data.atsUsageCount as number | undefined,
  };
}

/** ATS analiz kotası — free ayda 5, ücretli sınırsız (yüksek limit). */
export async function consumeAtsAnalysis(uid: string): Promise<{
  remaining: number;
  limit: number;
}> {
  const user = await readUserPlan(uid);
  const ent = getEntitlements(user);
  const usage = normalizeAtsUsage(user.atsUsageMonth, user.atsUsageCount);

  if (usage.count >= ent.atsPerMonth) {
    throw new UsageLimitError("ATS monthly limit reached");
  }

  const ref = getAdminDb().collection("users").doc(uid);
  const nextCount = usage.count + 1;

  await ref.set(
    {
      atsUsageMonth: currentUsageMonth(),
      atsUsageCount: nextCount,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return {
    remaining: Math.max(0, ent.atsPerMonth - nextCount),
    limit: ent.atsPerMonth,
  };
}

export async function getAtsUsage(uid: string): Promise<{
  count: number;
  limit: number;
  remaining: number;
  paid: boolean;
}> {
  const user = await readUserPlan(uid);
  const ent = getEntitlements(user);
  const usage = normalizeAtsUsage(user.atsUsageMonth, user.atsUsageCount);
  return {
    count: usage.count,
    limit: ent.atsPerMonth,
    remaining: Math.max(0, ent.atsPerMonth - usage.count),
    paid: ent.paid,
  };
}
