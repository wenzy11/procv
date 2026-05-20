import { NextResponse } from "next/server";

import { requireUser, serverError } from "@/app/api/_lib/guard";
import { hasPaidAccess } from "@/lib/billing/plan";
import { parseBillingTier } from "@/lib/billing/tier";
import type { BillingTier } from "@/lib/billing/types";
import { getUserBilling, updateUserBilling } from "@/lib/firebase/billing-admin";
import {
  createPolarCheckout,
  isPolarConfigured,
  syncPolarPlanForUser,
} from "@/lib/billing/polar.server";
import {
  buildGumroadCheckoutUrl,
  isGumroadConfigured,
} from "@/lib/billing/gumroad.server";
import {
  createLemonCheckout,
  getCheckoutUrlFallback,
  isLemonSqueezyConfigured,
} from "@/lib/billing/lemon-squeezy.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/billing/checkout
 * Body: { tier?: "monthly" | "yearly" | "unlimited"; email?; locale? }
 */
export async function POST(req: Request) {
  const guard = await requireUser(req, { allowUnverifiedEmail: true });
  if (!guard.ok) return guard.response;

  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  const redirectUrl = `${origin}/settings?billing=success`;

  let email: string | null = null;
  let locale: string | null = null;
  let tier: BillingTier = "monthly";
  try {
    const body = (await req.json()) as {
      email?: string;
      locale?: string;
      tier?: string;
    };
    email = body.email ?? null;
    locale = body.locale ?? null;
    tier = parseBillingTier(body.tier) ?? "monthly";
  } catch {
    // optional body
  }

  try {
    if (isPolarConfigured()) {
      try {
        const url = await createPolarCheckout({
          userId: guard.uid,
          tier,
          email,
          successUrl: redirectUrl,
          locale,
        });
        return NextResponse.json({ url, tier });
      } catch (err) {
        const message = err instanceof Error ? err.message : "";
        const alreadySubscribed =
          /already.*subscrib/i.test(message) ||
          /already.*active/i.test(message);
        if (alreadySubscribed) {
          const synced = await syncPolarPlanForUser(guard.uid);
          if (synced.plan !== "free") {
            await updateUserBilling(guard.uid, {
              plan: synced.plan,
              subscriptionStatus: "active",
              lemonSubscriptionId: synced.subscriptionId,
            });
          } else {
            const current = await getUserBilling(guard.uid);
            if (hasPaidAccess(current)) {
              return NextResponse.json({ url: redirectUrl, tier: current.plan });
            }
            await updateUserBilling(guard.uid, {
              plan: "monthly",
              subscriptionStatus: "active",
            });
          }
          return NextResponse.json({ url: redirectUrl, tier });
        }
        throw err;
      }
    }

    if (isGumroadConfigured()) {
      const url = buildGumroadCheckoutUrl({
        userId: guard.uid,
        email,
      });
      return NextResponse.json({ url });
    }

    if (isLemonSqueezyConfigured()) {
      const url = await createLemonCheckout({
        userId: guard.uid,
        email,
        redirectUrl,
      });
      return NextResponse.json({ url });
    }

    const fallback = getCheckoutUrlFallback();
    if (fallback) {
      const url = new URL(fallback);
      url.searchParams.set("checkout[custom][user_id]", guard.uid);
      return NextResponse.json({ url: url.toString() });
    }

    return NextResponse.json(
      { error: "Billing is not configured" },
      { status: 503 },
    );
  } catch (err) {
    return serverError(err);
  }
}
