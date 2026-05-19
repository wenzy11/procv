import "server-only";
import { NextResponse } from "next/server";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 20;

const buckets = new Map<string, number[]>();

function prune(timestamps: number[], now: number): number[] {
  return timestamps.filter((t) => now - t < WINDOW_MS);
}

function memoryLimit(
  key: string,
): { ok: true } | { ok: false; response: NextResponse } {
  const now = Date.now();
  const existing = buckets.get(key) ?? [];
  const recent = prune(existing, now);

  if (recent.length >= MAX_REQUESTS) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "Too many requests. Please wait a minute and try again." },
        { status: 429 },
      ),
    };
  }

  recent.push(now);
  buckets.set(key, recent);
  return { ok: true };
}

let upstashLimiter: {
  limit: (id: string) => Promise<{ success: boolean }>;
} | null = null;

async function getUpstashLimiter() {
  if (upstashLimiter) return upstashLimiter;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;

  const { Ratelimit } = await import("@upstash/ratelimit");
  const { Redis } = await import("@upstash/redis");

  upstashLimiter = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.slidingWindow(MAX_REQUESTS, "60 s"),
    prefix: "procv:ai",
  });

  return upstashLimiter;
}

/**
 * Per-user sliding window for AI/PDF routes.
 * Uses Upstash when `UPSTASH_REDIS_REST_*` is set; otherwise in-memory.
 */
export async function checkRateLimit(
  key: string,
): Promise<{ ok: true } | { ok: false; response: NextResponse }> {
  try {
    const limiter = await getUpstashLimiter();
    if (limiter) {
      const { success } = await limiter.limit(key);
      if (!success) {
        return {
          ok: false,
          response: NextResponse.json(
            { error: "Too many requests. Please wait a minute and try again." },
            { status: 429 },
          ),
        };
      }
      return { ok: true };
    }
  } catch {
    // Fall through to in-memory limiter if Upstash is misconfigured.
  }

  return memoryLimit(key);
}
