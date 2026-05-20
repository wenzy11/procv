import "server-only";

const PRODUCTION_API = "https://api.polar.sh/v1";
const SANDBOX_API = "https://sandbox-api.polar.sh/v1";

export function isPolarSandbox(): boolean {
  return process.env.POLAR_SANDBOX === "true";
}

export function isPolarConfigured(): boolean {
  return !!(
    process.env.POLAR_ACCESS_TOKEN?.trim() &&
    process.env.POLAR_PRODUCT_ID?.trim()
  );
}

function getApiBase(): string {
  return isPolarSandbox() ? SANDBOX_API : PRODUCTION_API;
}

const POLAR_LOCALES = new Set(["en", "tr", "de", "fr", "es"]);

function toPolarLocale(locale?: string | null): string {
  const base = (locale ?? "en").split("-")[0]?.toLowerCase() ?? "en";
  return POLAR_LOCALES.has(base) ? base : "en";
}

export async function createPolarCheckout(options: {
  userId: string;
  email?: string | null;
  successUrl: string;
  locale?: string | null;
}): Promise<string> {
  const token = process.env.POLAR_ACCESS_TOKEN;
  const productId = process.env.POLAR_PRODUCT_ID;
  if (!token || !productId) {
    throw new Error("Polar is not configured");
  }

  const res = await fetch(`${getApiBase()}/checkouts/`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      products: [productId],
      external_customer_id: options.userId,
      customer_email: options.email ?? undefined,
      success_url: options.successUrl,
      locale: toPolarLocale(options.locale),
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    let detail = errText;
    try {
      const parsed = JSON.parse(errText) as { detail?: string | unknown };
      if (typeof parsed.detail === "string") detail = parsed.detail;
    } catch {
      /* raw text */
    }
    const sandboxHint = isPolarSandbox()
      ? ""
      : " (POLAR_SANDBOX=true ve sandbox token kullanıyor musun?)";
    throw new Error(`Polar: ${detail}${sandboxHint}`);
  }

  const json = (await res.json()) as { url?: string };
  const url = json.url;
  if (!url) throw new Error("Polar checkout URL alınamadı — PRODUCT_ID doğru mu?");
  return url;
}

export interface PolarWebhookEnvelope {
  type?: string;
  data?: Record<string, unknown>;
}

function readUid(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function extractFirebaseUidFromPolarEvent(
  event: PolarWebhookEnvelope,
): string | null {
  const data = event.data;
  if (!data) return null;

  const customer = data.customer as Record<string, unknown> | undefined;
  const metadata = data.metadata as Record<string, unknown> | undefined;
  const meta = data.meta as Record<string, unknown> | undefined;

  const candidates = [
    data.external_customer_id,
    data.externalCustomerId,
    customer?.external_customer_id,
    customer?.externalCustomerId,
    customer?.external_id,
    customer?.externalId,
    metadata?.user_id,
    metadata?.userId,
    metadata?.firebase_uid,
    meta?.user_id,
    meta?.userId,
  ];

  for (const value of candidates) {
    const uid = readUid(value);
    if (uid) return uid;
  }

  return null;
}

/** Pull active subscription from Polar API (webhook bypass for checkout success). */
export async function syncPolarSubscriptionForUser(
  userId: string,
): Promise<{ active: boolean; subscriptionId: string | null }> {
  const token = process.env.POLAR_ACCESS_TOKEN;
  if (!token) {
    throw new Error("Polar is not configured");
  }

  const url = new URL(`${getApiBase()}/subscriptions/`);
  url.searchParams.set("external_customer_id", userId);
  url.searchParams.set("active", "true");
  url.searchParams.set("limit", "1");

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const errText = await res.text();
    const sandboxHint = isPolarSandbox()
      ? ""
      : " (POLAR_SANDBOX=true ve sandbox token kullanıyor musun?)";
    throw new Error(`Polar subscriptions: ${errText}${sandboxHint}`);
  }

  const json = (await res.json()) as {
    items?: Array<{ id?: string; status?: string }>;
  };
  const sub = json.items?.[0];
  const status = String(sub?.status ?? "").toLowerCase();
  const active =
    !!sub && (status === "active" || status === "trialing" || status === "");
  return {
    active,
    subscriptionId: sub?.id ?? null,
  };
}

export function polarSubscriptionIsActive(data: Record<string, unknown>): boolean {
  const status = String(data.status ?? "").toLowerCase();
  return status === "active" || status === "trialing";
}
