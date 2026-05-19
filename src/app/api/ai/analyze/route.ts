import { NextResponse } from "next/server";
import { getOpenAI, getOpenAIModel } from "@/lib/openai/client";
import { analyzeMessages } from "@/lib/openai/prompts";
import { badRequest, requireUser, serverError } from "@/app/api/_lib/guard";
import { checkRateLimit } from "@/app/api/_lib/rate-limit";
import type { AISuggestion, ATSScore, ResumeDocument } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * POST /api/ai/analyze
 * Body: { resume: ResumeDocument; locale?: string }
 * Returns: { score: ATSScore; suggestions: AISuggestion[] }
 */
export async function POST(req: Request) {
  const guard = await requireUser(req);
  if (!guard.ok) return guard.response;

  const limited = await checkRateLimit(`ai:${guard.uid}`);
  if (!limited.ok) return limited.response;

  let body: { resume?: ResumeDocument; locale?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Expected JSON body");
  }

  if (!body.resume || typeof body.resume !== "object") {
    return badRequest("`resume` is required");
  }
  const locale = body.locale ?? "en";

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: getOpenAIModel(),
      response_format: { type: "json_object" },
      temperature: 0.2,
      max_tokens: 1200,
      messages: analyzeMessages(body.resume, locale),
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as {
      score?: ATSScore;
      suggestions?: AISuggestion[];
    };

    const score = sanitizeScore(parsed.score);
    const suggestions = sanitizeSuggestions(parsed.suggestions);

    return NextResponse.json({ score, suggestions });
  } catch (err) {
    return serverError(err);
  }
}

function clamp(n: unknown): number {
  const v = typeof n === "number" ? n : 0;
  return Math.max(0, Math.min(100, Math.round(v)));
}

function sanitizeScore(s: ATSScore | undefined): ATSScore {
  const b = s?.breakdown ?? ({} as ATSScore["breakdown"]);
  return {
    total: clamp(s?.total),
    breakdown: {
      keywordCoverage: clamp(b.keywordCoverage),
      formatting: clamp(b.formatting),
      impactLanguage: clamp(b.impactLanguage),
      completeness: clamp(b.completeness),
      readability: clamp(b.readability),
    },
  };
}

function sanitizeSuggestions(arr: AISuggestion[] | undefined): AISuggestion[] {
  if (!Array.isArray(arr)) return [];
  const allowedSeverity = new Set(["critical", "warning", "info"]);
  const allowedTarget = new Set([
    "personal",
    "summary",
    "experience",
    "projects",
    "skills",
    "languages",
    "education",
    "global",
  ]);
  return arr.slice(0, 8).map((s, i) => ({
    id: `sug_${Date.now()}_${i}`,
    title: String(s.title ?? "").slice(0, 160),
    description: String(s.description ?? "").slice(0, 600),
    severity: allowedSeverity.has(s.severity) ? s.severity : "info",
    target: (allowedTarget.has(s.target) ? s.target : "global") as AISuggestion["target"],
    actionLabel: String(s.actionLabel ?? "Open section").slice(0, 60),
  }));
}
