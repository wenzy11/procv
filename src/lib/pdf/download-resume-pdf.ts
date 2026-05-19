import { getIdToken } from "@/lib/firebase/auth";
import type { ResumePdfLabels } from "@/lib/pdf/resume-pdf-document";
import type { Locale } from "@/lib/i18n";
import type { ResumeDocument } from "@/lib/types";

export async function downloadResumePdf(
  resume: Omit<ResumeDocument, "id" | "updatedAt">,
  locale: Locale,
  labels: ResumePdfLabels,
): Promise<void> {
  const token = await getIdToken();
  if (!token) throw new Error("Not signed in");

  const res = await fetch("/api/resume/pdf", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ resume, locale, labels }),
  });

  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error ?? `PDF export failed (${res.status})`);
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${(resume.title || "resume").replace(/[^\w.-]+/g, "_")}.pdf`;
  anchor.click();
  URL.revokeObjectURL(url);
}
