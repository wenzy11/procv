import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";

import {
  badRequest,
  requireUser,
  serverError,
} from "@/app/api/_lib/guard";
import { checkRateLimit } from "@/app/api/_lib/rate-limit";
import { registerPdfFonts } from "@/lib/pdf/register-fonts";
import {
  ResumePdfDocument,
  type ResumePdfLabels,
} from "@/lib/pdf/resume-pdf-document";
import { isLocale, type Locale } from "@/lib/i18n";
import type { ResumeDocument } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * POST /api/resume/pdf
 * Body: { resume, locale?, labels }
 */
export async function POST(req: Request) {
  const guard = await requireUser(req);
  if (!guard.ok) return guard.response;

  const limited = await checkRateLimit(`pdf:${guard.uid}`);
  if (!limited.ok) return limited.response;

  let body: {
    resume?: Omit<ResumeDocument, "id" | "updatedAt">;
    locale?: string;
    labels?: Partial<ResumePdfLabels>;
  };
  try {
    body = await req.json();
  } catch {
    return badRequest("Expected JSON body");
  }

  if (!body.resume?.personal) return badRequest("`resume` is required");

  const locale: Locale = isLocale(body.locale) ? body.locale : "en";
  const L = body.labels ?? {};
  const labels: ResumePdfLabels = {
    summary: L.summary ?? "Summary",
    experience: L.experience ?? "Experience",
    projects: L.projects ?? "Projects",
    skills: L.skills ?? "Skills",
    languages: L.languages ?? "Languages",
    education: L.education ?? "Education",
    present: L.present ?? "Present",
    stack: L.stack ?? "Stack",
  };

  try {
    registerPdfFonts();
    const buffer = await renderToBuffer(
      <ResumePdfDocument resume={body.resume} locale={locale} labels={labels} />,
    );

    const filename = `${(body.resume.title || "resume").replace(/[^\w.-]+/g, "_")}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch (err) {
    return serverError(err);
  }
}
