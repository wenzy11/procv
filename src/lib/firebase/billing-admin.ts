import "server-only";

import { FieldValue } from "firebase-admin/firestore";

import { getAdminDb } from "./admin";
import type { SubscriptionStatus, UserPlan } from "@/lib/billing/types";

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
