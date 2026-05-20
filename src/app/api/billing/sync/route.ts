import { NextResponse } from "next/server";

import { requireUser, serverError } from "@/app/api/_lib/guard";
import {
  isPolarConfigured,
  syncPolarSubscriptionForUser,
} from "@/lib/billing/polar.server";
import { updateUserBilling } from "@/lib/firebase/billing-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/billing/sync
 * After checkout success: query Polar API and mirror plan to Firestore.
 * Does not depend on webhooks.
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
    const { active, subscriptionId } = await syncPolarSubscriptionForUser(
      guard.uid,
    );

    if (active) {
      await updateUserBilling(guard.uid, {
        plan: "pro",
        subscriptionStatus: "active",
        lemonSubscriptionId: subscriptionId,
      });
      return NextResponse.json({ ok: true, plan: "pro" as const });
    }

    return NextResponse.json({ ok: true, plan: "free" as const, active: false });
  } catch (err) {
    return serverError(err);
  }
}
