import { NextResponse } from "next/server";

import { requireUser, serverError } from "@/app/api/_lib/guard";
import { hasPaidAccess, normalizePlan } from "@/lib/billing/plan";
import {
  isPolarConfigured,
  syncPolarPlanForUser,
} from "@/lib/billing/polar.server";
import { updateUserBilling } from "@/lib/firebase/billing-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/billing/sync
 * After checkout success: query Polar API and mirror plan to Firestore.
 */
export async function POST(req: Request) {
  const guard = await requireUser(req, { allowUnverifiedEmail: true });
  if (!guard.ok) return guard.response;

  if (!isPolarConfigured()) {
    return NextResponse.json(
      { error: "Polar is not configured" },
      { status: 503 },
    );
  }

  try {
    const { plan, subscriptionId } = await syncPolarPlanForUser(guard.uid);
    const normalized = normalizePlan(plan);

    if (hasPaidAccess({ plan: normalized, subscriptionStatus: "active" })) {
      await updateUserBilling(guard.uid, {
        plan: normalized,
        subscriptionStatus:
          normalized === "unlimited" ? "active" : "active",
        lemonSubscriptionId: subscriptionId,
      });
      return NextResponse.json({ ok: true, plan: normalized });
    }

    return NextResponse.json({ ok: true, plan: "free" as const });
  } catch (err) {
    return serverError(err);
  }
}
