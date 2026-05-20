import { NextResponse } from "next/server";
import { getOpenAI, getOpenAIModel } from "@/lib/openai/client";
import { coverLetterMessages } from "@/lib/openai/prompts";
import {
  badRequest,
  requirePaidFeature,
  requireUser,
  serverError,
} from "@/app/api/_lib/guard";
import { checkRateLimit } from "@/app/api/_lib/rate-limit";
import type { ResumeDocument } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

/**
 * POST /api/ai/cover-letter
 * Body: { resume, jobDescription, locale?, company?, role?, tone? }
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
    company?: string;
    role?: string;
    tone?: string;
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
      temperature: 0.55,
      max_tokens: 1200,
      messages: coverLetterMessages(body.resume, jd, locale, {
        company: body.company,
        role: body.role,
        tone: body.tone,
      }),
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw) as { letter?: string };
    const letter = (parsed.letter ?? "").trim();
    if (!letter) return serverError(new Error("Empty cover letter"));

    return NextResponse.json({ letter });
  } catch (err) {
    return serverError(err);
  }
}
