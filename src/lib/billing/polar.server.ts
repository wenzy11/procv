import "server-only";

import {
  extractProductIdFromPolarData,
  getConfiguredBillingTiers,
  getPolarProductIdForTier,
  planFromPolarProductId,
} from "./polar-products";
import { normalizePlan } from "./plan";
import type { BillingTier, UserPlan } from "./types";

const PRODUCTION_API = "https://api.polar.sh/v1";
const SANDBOX_API = "https://sandbox-api.polar.sh/v1";

export function isPolarSandbox(): boolean {
  return process.env.POLAR_SANDBOX === "true";
}

export function isPolarConfigured(): boolean {
  return !!(
    process.env.POLAR_ACCESS_TOKEN?.trim() &&
    getConfiguredBillingTiers().length > 0
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
  tier: BillingTier;
  email?: string | null;
  successUrl: string;
  locale?: string | null;
}): Promise<string> {
  const token = process.env.POLAR_ACCESS_TOKEN;
  const productId = getPolarProductIdForTier(options.tier);
  if (!token || !productId) {
    throw new Error(`Polar product not configured for tier: ${options.tier}`);
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

type PolarSubscriptionRow = {
  id?: string;
  status?: string;
  product_id?: string;
  product?: { id?: string };
};

async function polarFetch(path: string, params: Record<string, string>) {
  const token = process.env.POLAR_ACCESS_TOKEN;
  if (!token) throw new Error("Polar is not configured");

  const url = new URL(`${getApiBase()}${path}`);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    const errText = await res.text();
    const sandboxHint = isPolarSandbox()
      ? ""
      : " (POLAR_SANDBOX=true ve sandbox token kullanıyor musun?)";
    throw new Error(`Polar ${path}: ${errText}${sandboxHint}`);
  }

  return res.json() as Promise<{ items?: PolarSubscriptionRow[] }>;
}

function subscriptionPlan(sub: PolarSubscriptionRow): UserPlan | null {
  const productId =
    sub.product_id ?? sub.product?.id ?? null;
  if (!productId) return null;
  return planFromPolarProductId(productId);
}

function subscriptionActive(sub: PolarSubscriptionRow): boolean {
  const status = String(sub.status ?? "").toLowerCase();
  return status === "active" || status === "trialing" || status === "";
}

/** Ödeme sonrası Polar’dan plan çek (webhook yedek). */
export async function syncPolarPlanForUser(userId: string): Promise<{
  plan: UserPlan;
  subscriptionId: string | null;
}> {
  const unlimitedId = getPolarProductIdForTier("unlimited");
  if (unlimitedId) {
    const orders = await polarFetch("/orders/", {
      external_customer_id: userId,
      limit: "20",
    });
    for (const order of orders.items ?? []) {
      const o = order as Record<string, unknown>;
      const productId = extractProductIdFromPolarData(o);
      if (productId && planFromPolarProductId(productId) === "unlimited") {
        const paid =
          String(o.status ?? "").toLowerCase() === "paid" ||
          o.paid === true;
        if (paid) {
          return { plan: "unlimited", subscriptionId: null };
        }
      }
    }
  }

  const subs = await polarFetch("/subscriptions/", {
    external_customer_id: userId,
    active: "true",
    limit: "10",
  });

  let best: { plan: UserPlan; subscriptionId: string | null } | null = null;
  for (const sub of subs.items ?? []) {
    if (!subscriptionActive(sub)) continue;
    const plan = subscriptionPlan(sub);
    if (!plan || plan === "unlimited") continue;
    const row = { plan, subscriptionId: sub.id ?? null };
    if (
      !best ||
      (plan === "yearly" && best.plan === "monthly")
    ) {
      best = row;
    }
  }

  if (best) return best;
  return { plan: "free", subscriptionId: null };
}

/** @deprecated */
export async function syncPolarSubscriptionForUser(userId: string) {
  const { plan, subscriptionId } = await syncPolarPlanForUser(userId);
  return {
    active: plan !== "free",
    subscriptionId,
    plan: normalizePlan(plan),
  };
}

export function polarSubscriptionIsActive(data: Record<string, unknown>): boolean {
  const status = String(data.status ?? "").toLowerCase();
  return status === "active" || status === "trialing";
}

export function resolvePlanFromPolarEventData(
  data: Record<string, unknown>,
): UserPlan {
  const productId = extractProductIdFromPolarData(data);
  if (productId) {
    const mapped = planFromPolarProductId(productId);
    if (mapped) return mapped;
  }
  return "monthly";
}
