import { NextResponse } from "next/server";
import { validateEvent, WebhookVerificationError } from "@polar-sh/sdk/webhooks";

import {
  extractFirebaseUidFromPolarEvent,
  polarSubscriptionIsActive,
  type PolarWebhookEnvelope,
} from "@/lib/billing/polar.server";
import { updateUserBilling } from "@/lib/firebase/billing-admin";
import { findUserIdByEmail } from "@/lib/firebase/user-lookup-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Polar webhooks (Standard Webhooks). Configure in Polar → Settings → Webhooks.
 */
export async function POST(req: Request) {
  const secret = process.env.POLAR_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Webhook secret not set" }, { status: 500 });
  }

  const rawBody = await req.text();
  const headers = Object.fromEntries(req.headers.entries());

  let event: PolarWebhookEnvelope;
  try {
    event = validateEvent(
      rawBody,
      headers,
      secret,
    ) as PolarWebhookEnvelope;
  } catch (err) {
    if (err instanceof WebhookVerificationError) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
    }
    throw err;
  }

  const type = event.type ?? "";
  const data = (event.data ?? {}) as Record<string, unknown>;
  const orderStatus = String(data.status ?? "").toLowerCase();
  const nestedSubscription = (data.subscription as
    | Record<string, unknown>
    | undefined) ?? { id: data.subscription_id };

  let uid = extractFirebaseUidFromPolarEvent(event);
  if (!uid) {
    const email =
      (data.customer_email as string | undefined) ??
      (data.email as string | undefined) ??
      ((data.customer as Record<string, unknown> | undefined)?.email as
        | string
        | undefined);
    if (email) uid = await findUserIdByEmail(email);
  }

  if (!uid) {
    console.warn("[polar webhook] no uid", type, data.customer ?? data.email);
    return NextResponse.json(
      { ok: true, skipped: "no uid", type },
      { status: 202 },
    );
  }

  let applied = false;

  try {
    if (
      type === "subscription.created" ||
      type === "subscription.active" ||
      type === "subscription.uncanceled" ||
      type === "order.paid" ||
      (type === "order.updated" && orderStatus === "paid")
    ) {
      await updateUserBilling(uid, {
        plan: "pro",
        subscriptionStatus: "active",
        lemonSubscriptionId:
          (nestedSubscription.id as string | undefined) ??
          (data.subscription_id as string | undefined) ??
          (data.id as string | undefined) ??
          null,
      });
      applied = true;
    } else if (
      type === "subscription.revoked" ||
      type === "subscription.canceled" ||
      type === "order.refunded"
    ) {
      const stillActive =
        type === "subscription.canceled" && polarSubscriptionIsActive(data);
      await updateUserBilling(uid, {
        plan: stillActive ? "pro" : "free",
        subscriptionStatus: stillActive ? "active" : "cancelled",
      });
      applied = true;
    } else if (type === "subscription.updated") {
      const active = polarSubscriptionIsActive(data);
      await updateUserBilling(uid, {
        plan: active ? "pro" : "free",
        subscriptionStatus: active ? "active" : "cancelled",
      });
      applied = true;
    } else {
      console.info("[polar webhook] unhandled event", type, uid);
    }
  } catch (err) {
    console.error("[polar webhook]", type, err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, type, uid, applied }, { status: 202 });
}
