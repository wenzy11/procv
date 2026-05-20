import { NextResponse } from "next/server";

import {
  extractFirebaseUidFromWebhook,
  mapSubscriptionStatus,
  verifyLemonWebhookSignature,
  type LemonWebhookPayload,
} from "@/lib/billing/lemon-squeezy.server";
import { updateUserBilling } from "@/lib/firebase/billing-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/billing/webhook
 * Lemon Squeezy → updates users/{uid} plan in Firestore.
 */
export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-signature");

  if (!verifyLemonWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: LemonWebhookPayload;
  try {
    payload = JSON.parse(rawBody) as LemonWebhookPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const event =
    req.headers.get("x-event-name") ?? payload.meta?.event_name ?? "";
  const uid = extractFirebaseUidFromWebhook(payload);

  if (!uid) {
    return NextResponse.json({ ok: true, skipped: "no user_id" });
  }

  const attrs = payload.data?.attributes ?? {};
  const subStatus = mapSubscriptionStatus(
    typeof attrs.status === "string" ? attrs.status : undefined,
  );

  try {
    switch (event) {
      case "subscription_created":
      case "subscription_updated":
      case "subscription_resumed":
      case "subscription_payment_success": {
        const active = subStatus === "active" || subStatus === "on_trial";
        await updateUserBilling(uid, {
          plan: active ? "monthly" : "free",
          subscriptionStatus: subStatus,
          lemonSubscriptionId:
            payload.data?.id != null ? String(payload.data.id) : undefined,
          lemonCustomerId:
            attrs.customer_id != null
              ? String(attrs.customer_id)
              : undefined,
        });
        break;
      }
      case "subscription_cancelled":
      case "subscription_expired":
      case "subscription_paused": {
        await updateUserBilling(uid, {
          plan: "free",
          subscriptionStatus: subStatus,
          lemonSubscriptionId:
            payload.data?.id != null ? String(payload.data.id) : null,
        });
        break;
      }
      case "order_created": {
        if (attrs.status === "paid" || attrs.refunded === false) {
          await updateUserBilling(uid, {
            plan: "monthly",
            subscriptionStatus: "active",
          });
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[lemon webhook]", event, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
