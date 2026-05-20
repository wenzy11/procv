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

export function extractFirebaseUidFromPolarEvent(
  event: PolarWebhookEnvelope,
): string | null {
  const data = event.data;
  if (!data) return null;

  const direct =
    data.external_customer_id ??
    data.externalCustomerId ??
    (data.customer as Record<string, unknown> | undefined)?.external_id ??
    (data.customer as Record<string, unknown> | undefined)?.externalId;

  if (typeof direct === "string" && direct.trim()) return direct.trim();
  return null;
}

export function polarSubscriptionIsActive(data: Record<string, unknown>): boolean {
  const status = String(data.status ?? "").toLowerCase();
  return status === "active" || status === "trialing";
}
