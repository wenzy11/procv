import { NextResponse } from "next/server";

import {
  extractUserIdFromGumroadPing,
  isExpectedGumroadProduct,
  isGumroadRefunded,
  isGumroadTestPurchase,
  parseGumroadPing,
} from "@/lib/billing/gumroad.server";
import { updateUserBilling } from "@/lib/firebase/billing-admin";
import { findUserIdByEmail } from "@/lib/firebase/user-lookup-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Gumroad Ping (account Settings → Advanced).
 * Content-Type: application/x-www-form-urlencoded
 */
export async function POST(req: Request) {
  const raw = await req.text();
  const params = new URLSearchParams(raw);
  const form = Object.fromEntries(params.entries()) as Record<string, string>;
  const ping = parseGumroadPing(form);

  if (isGumroadTestPurchase(ping)) {
    return new NextResponse("", { status: 200 });
  }

  if (!isExpectedGumroadProduct(ping)) {
    return new NextResponse("", { status: 200 });
  }

  let uid = extractUserIdFromGumroadPing(ping);

  if (!uid && ping.email) {
    uid = await findUserIdByEmail(ping.email);
  }

  if (!uid) {
    console.warn("[gumroad ping] no user_id for sale", ping.sale_id);
    return new NextResponse("", { status: 200 });
  }

  try {
    if (isGumroadRefunded(ping)) {
      await updateUserBilling(uid, {
        plan: "free",
        subscriptionStatus: "cancelled",
      });
    } else {
      await updateUserBilling(uid, {
        plan: "pro",
        subscriptionStatus: "active",
        lemonSubscriptionId: ping.subscription_id ?? ping.sale_id ?? null,
      });
    }
  } catch (err) {
    console.error("[gumroad ping]", err);
    return new NextResponse("", { status: 500 });
  }

  return new NextResponse("", { status: 200 });
}
