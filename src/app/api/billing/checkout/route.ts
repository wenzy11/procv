import { NextResponse } from "next/server";

import { requireUser, serverError } from "@/app/api/_lib/guard";
import {
  createPolarCheckout,
  isPolarConfigured,
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
 * Returns { url } — Gumroad (preferred) or Lemon Squeezy checkout.
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
  try {
    const body = (await req.json()) as { email?: string; locale?: string };
    email = body.email ?? null;
    locale = body.locale ?? null;
  } catch {
    // optional body
  }

  try {
    if (isPolarConfigured()) {
      const url = await createPolarCheckout({
        userId: guard.uid,
        email,
        successUrl: redirectUrl,
        locale,
      });
      return NextResponse.json({ url });
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
