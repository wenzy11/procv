import { NextResponse } from "next/server";

import { requireUser, serverError } from "@/app/api/_lib/guard";
import {
  createLemonCheckout,
  getCheckoutUrlFallback,
  isLemonSqueezyConfigured,
} from "@/lib/billing/lemon-squeezy.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/billing/checkout
 * Returns { url } — redirect the browser to Lemon Squeezy hosted checkout.
 */
export async function POST(req: Request) {
  const guard = await requireUser(req, { allowUnverifiedEmail: true });
  if (!guard.ok) return guard.response;

  const origin =
    req.headers.get("origin") ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";

  const redirectUrl = `${origin}/settings?billing=success`;

  try {
    if (isLemonSqueezyConfigured()) {
      let email: string | null = null;
      try {
        const body = (await req.json()) as { email?: string };
        email = body.email ?? null;
      } catch {
        // optional body
      }

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
