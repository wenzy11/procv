import "server-only";

/** Gumroad product page / checkout permalink (from product Share link). */
export function isGumroadConfigured(): boolean {
  return !!process.env.GUMROAD_PRODUCT_URL?.trim();
}

export function getGumroadProductId(): string | null {
  return process.env.GUMROAD_PRODUCT_ID?.trim() || null;
}

export function buildGumroadCheckoutUrl(options: {
  userId: string;
  email?: string | null;
}): string {
  const base = process.env.GUMROAD_PRODUCT_URL?.trim();
  if (!base) throw new Error("Gumroad is not configured");

  const url = new URL(base);
  url.searchParams.set("wanted", "true");
  url.searchParams.set("user_id", options.userId);
  if (options.email) {
    url.searchParams.set("email", options.email);
  }
  return url.toString();
}

export interface GumroadPingPayload {
  sale_id?: string;
  product_id?: string;
  email?: string;
  refunded?: string;
  test?: string;
  subscription_id?: string;
  is_recurring_charge?: string;
  recurrence?: string;
  url_params?: string;
  custom_fields?: string;
  [key: string]: string | undefined;
}

export function parseGumroadPing(
  form: Record<string, string>,
): GumroadPingPayload {
  return form as GumroadPingPayload;
}

/** Extract Firebase uid from ping (url_params or custom_fields JSON). */
export function extractUserIdFromGumroadPing(
  ping: GumroadPingPayload,
): string | null {
  const direct = ping.user_id?.trim();
  if (direct) return direct;

  for (const raw of [ping.url_params, ping.custom_fields]) {
    if (!raw) continue;
    try {
      const parsed = JSON.parse(raw) as Record<string, string>;
      const uid =
        parsed.user_id ??
        parsed.userid ??
        parsed.uid ??
        parsed["Firebase UID"];
      if (uid && typeof uid === "string") return uid.trim();
    } catch {
      // not JSON
    }
  }

  return null;
}

export function isGumroadTestPurchase(ping: GumroadPingPayload): boolean {
  return ping.test === "true" || ping.test === "1";
}

export function isGumroadRefunded(ping: GumroadPingPayload): boolean {
  return ping.refunded === "true" || ping.refunded === "1";
}

export function isExpectedGumroadProduct(ping: GumroadPingPayload): boolean {
  const expected = getGumroadProductId();
  if (!expected) return true;
  return ping.product_id === expected;
}
