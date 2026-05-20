import { NextResponse } from "next/server";
import { getOpenAI, getOpenAIModel } from "@/lib/openai/client";
import { matchMessages } from "@/lib/openai/prompts";
import {
  badRequest,
  requirePaidFeature,
  requireUser,
  serverError,
} from "@/app/api/_lib/guard";
import { checkRateLimit } from "@/app/api/_lib/rate-limit";
import type { KeywordMatchResult, ResumeDocument } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * POST /api/ai/match
 * Body: { resume: ResumeDocument; jobDescription: string; locale?: string }
 * Returns: KeywordMatchResult
 */
export async function POST(req: Request) {
  const guard = await requireUser(req);
  if (!guard.ok) return guard.response;

  const paid = await requirePaidFeature(guard.uid, "job_match");
  if (!paid.ok) return paid.response;

  const limited = await checkRateLimit(`ai:${guard.uid}`);
  if (!limited.ok) return limited.response;

  let body: {
    resume?: ResumeDocument;
    jobDescription?: string;
    locale?: string;
  };
  try {
    body = await req.json();
  } catch {
    return badRequest("Expected JSON body");
  }

  const jd = (body.jobDescription ?? "").trim();
  if (!body.resume) return badRequest("`resume` is required");
  if (jd.length < 24) return badRequest("`jobDescription` is too short");
  if (jd.length > 12000) return badRequest("`jobDescription` is too long");
  const locale = body.locale ?? "en";

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: getOpenAIModel(),
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 1400,
      messages: matchMessages(body.resume, jd, locale),
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as Partial<KeywordMatchResult>;

    const matched = sanitizeWords(parsed.matched);
    const missing = sanitizeWords(parsed.missing);
    const total = matched.length + missing.length;
    const strength =
      typeof parsed.strength === "number"
        ? Math.max(0, Math.min(100, Math.round(parsed.strength)))
        : total === 0
          ? 0
          : Math.round((matched.length / total) * 100);

    const categories = sanitizeCategories(parsed.categories);

    const result: KeywordMatchResult = {
      matched,
      missing,
      strength,
      categories,
    };
    return NextResponse.json(result);
  } catch (err) {
    return serverError(err);
  }
}

function sanitizeWords(arr: string[] | undefined): string[] {
  if (!Array.isArray(arr)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of arr) {
    const w = String(raw ?? "").toLowerCase().trim();
    if (!w || w.length > 64) continue;
    if (seen.has(w)) continue;
    seen.add(w);
    out.push(w);
    if (out.length >= 24) break;
  }
  return out;
}

function sanitizeCategories(
  arr: KeywordMatchResult["categories"] | undefined,
): KeywordMatchResult["categories"] {
  if (!Array.isArray(arr)) return [];
  const allowed = new Set([
    "Languages",
    "Frameworks",
    "Cloud",
    "Data",
    "Practices",
    "Other",
  ]);
  return arr
    .filter((c) => c && allowed.has(c.name))
    .map((c) => ({
      name: c.name,
      matched: Math.max(0, Math.round(c.matched ?? 0)),
      missing: Math.max(0, Math.round(c.missing ?? 0)),
    }))
    .filter((c) => c.matched + c.missing > 0);
}
