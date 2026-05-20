import { NextResponse } from "next/server";
import { getOpenAI, getOpenAIModel } from "@/lib/openai/client";
import { polishMessages } from "@/lib/openai/prompts";
import {
  badRequest,
  requirePaidFeature,
  requireUser,
  serverError,
} from "@/app/api/_lib/guard";
import { checkRateLimit } from "@/app/api/_lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * POST /api/ai/polish
 * Body: { text: string; locale?: string }
 * Returns: { polished: string }
 */
export async function POST(req: Request) {
  const guard = await requireUser(req);
  if (!guard.ok) return guard.response;

  const paid = await requirePaidFeature(guard.uid, "ai_polish");
  if (!paid.ok) return paid.response;

  const limited = await checkRateLimit(`ai:${guard.uid}`);
  if (!limited.ok) return limited.response;

  let body: { text?: string; locale?: string };
  try {
    body = await req.json();
  } catch {
    return badRequest("Expected JSON body");
  }

  const text = (body.text ?? "").trim();
  const locale = body.locale ?? "en";
  if (!text) return badRequest("`text` is required");
  if (text.length > 4000) return badRequest("`text` is too long (max 4000 chars)");

  try {
    const completion = await getOpenAI().chat.completions.create({
      model: getOpenAIModel(),
      response_format: { type: "json_object" },
      temperature: 0.6,
      max_tokens: 600,
      messages: polishMessages(text, locale),
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { polished?: string };
    const polished = (parsed.polished ?? "").trim();
    if (!polished) return serverError(new Error("Empty completion"));

    return NextResponse.json({ polished });
  } catch (err) {
    return serverError(err);
  }
}
