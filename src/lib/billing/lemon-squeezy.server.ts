import "server-only";
import crypto from "crypto";

const API_BASE = "https://api.lemonsqueezy.com/v1";

export function isLemonSqueezyConfigured(): boolean {
  return !!(
    process.env.LEMONSQUEEZY_API_KEY &&
    process.env.LEMONSQUEEZY_STORE_ID &&
    process.env.LEMONSQUEEZY_VARIANT_ID
  );
}

export function getCheckoutUrlFallback(): string | null {
  const url = process.env.NEXT_PUBLIC_LEMONSQUEEZY_CHECKOUT_URL?.trim();
  return url || null;
}

/**
 * Creates a hosted checkout and returns the checkout URL.
 * `custom.user_id` must be the Firebase Auth uid (webhook uses it).
 */
export async function createLemonCheckout(options: {
  userId: string;
  email?: string | null;
  redirectUrl: string;
}): Promise<string> {
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = process.env.LEMONSQUEEZY_VARIANT_ID;

  if (!apiKey || !storeId || !variantId) {
    throw new Error("Lemon Squeezy is not configured");
  }

  const res = await fetch(`${API_BASE}/checkouts`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: options.email ?? undefined,
            custom: {
              user_id: options.userId,
            },
          },
          product_options: {
            redirect_url: options.redirectUrl,
          },
        },
        relationships: {
          store: {
            data: { type: "stores", id: String(storeId) },
          },
          variant: {
            data: { type: "variants", id: String(variantId) },
          },
        },
      },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Lemon Squeezy checkout failed: ${err}`);
  }

  const json = (await res.json()) as {
    data?: { attributes?: { url?: string } };
  };
  const url = json.data?.attributes?.url;
  if (!url) throw new Error("No checkout URL in Lemon Squeezy response");
  return url;
}

/** Verify `X-Signature` header (hex HMAC-SHA256 of raw body). */
export function verifyLemonWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signatureHeader) return false;

  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest, "utf8"),
      Buffer.from(signatureHeader, "utf8"),
    );
  } catch {
    return false;
  }
}

export function extractFirebaseUidFromWebhook(
  payload: LemonWebhookPayload,
): string | null {
  const custom = payload.meta?.custom_data as
    | { user_id?: string }
    | undefined;
  if (custom?.user_id) return String(custom.user_id);

  const attrs = payload.data?.attributes as Record<string, unknown> | undefined;
  const first = attrs?.first_order_item as Record<string, unknown> | undefined;
  if (first?.custom_data && typeof first.custom_data === "object") {
    const uid = (first.custom_data as { user_id?: string }).user_id;
    if (uid) return String(uid);
  }

  return null;
}

export interface LemonWebhookPayload {
  meta?: {
    event_name?: string;
    custom_data?: Record<string, unknown>;
  };
  data?: {
    type?: string;
    id?: string;
    attributes?: Record<string, unknown>;
  };
}

export function mapSubscriptionStatus(
  lemonStatus: string | undefined,
): "active" | "on_trial" | "cancelled" | "expired" | "past_due" | "paused" | "none" {
  switch (lemonStatus) {
    case "active":
      return "active";
    case "on_trial":
      return "on_trial";
    case "past_due":
      return "past_due";
    case "paused":
      return "paused";
    case "cancelled":
      return "cancelled";
    case "expired":
      return "expired";
    default:
      return "none";
  }
}
