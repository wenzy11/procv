import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "./admin";
import { normalizePlan } from "@/lib/billing/plan";
import type { SubscriptionStatus, UserPlan } from "@/lib/billing/types";

export async function getUserBilling(uid: string): Promise<{
  plan: UserPlan;
  subscriptionStatus: SubscriptionStatus;
}> {
  const snap = await getAdminDb().collection("users").doc(uid).get();
  const data = snap.data() ?? {};
  return {
    plan: normalizePlan(data.plan as string | undefined),
    subscriptionStatus:
      (data.subscriptionStatus as SubscriptionStatus | undefined) ?? "none",
  };
}

export async function updateUserBilling(
  uid: string,
  patch: {
    plan?: UserPlan;
    subscriptionStatus?: SubscriptionStatus;
    lemonSubscriptionId?: string | null;
    lemonCustomerId?: string | null;
    lemonVariantId?: string | null;
  },
): Promise<void> {
  await getAdminDb()
    .collection("users")
    .doc(uid)
    .set(
      {
        ...patch,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
}
