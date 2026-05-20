import { NextResponse } from "next/server";

import { requireUser } from "@/app/api/_lib/guard";
import { getEntitlements } from "@/lib/billing/entitlements";
import { normalizePlan } from "@/lib/billing/plan";
import { getAtsUsage } from "@/lib/firebase/usage-admin";
import { getAdminDb } from "@/lib/firebase/admin";
import type { SubscriptionStatus } from "@/lib/billing/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const guard = await requireUser(req, { allowUnverifiedEmail: true });
  if (!guard.ok) return guard.response;

  const snap = await getAdminDb().collection("users").doc(guard.uid).get();
  const data = snap.data() ?? {};
  const plan = normalizePlan(data.plan as string | undefined);
  const subscriptionStatus =
    (data.subscriptionStatus as SubscriptionStatus | undefined) ?? "none";
  const ent = getEntitlements({ plan, subscriptionStatus });

  const resumesSnap = await getAdminDb()
    .collection("users")
    .doc(guard.uid)
    .collection("resumes")
    .count()
    .get();

  const resumeCount = resumesSnap.data().count;
  const ats = await getAtsUsage(guard.uid);

  return NextResponse.json({
    ats,
    resumes: {
      count: resumeCount,
      limit: ent.maxResumes,
      remaining: Math.max(0, ent.maxResumes - resumeCount),
    },
  });
}
