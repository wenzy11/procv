import { NextResponse } from "next/server";

import { getConfiguredBillingTiers } from "@/lib/billing/polar-products";
import { isPolarConfigured } from "@/lib/billing/polar.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/billing/config — hangi planlar checkout’ta açık */
export async function GET() {
  return NextResponse.json({
    polar: isPolarConfigured(),
    tiers: getConfiguredBillingTiers(),
  });
}
