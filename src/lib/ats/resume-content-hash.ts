import type { ResumeDocument } from "@/lib/types";

/** CV metni değişince ATS önbelleğini geçersiz kılmak için hafif hash. */
export function hashResumeContent(
  resume: Omit<ResumeDocument, "id" | "updatedAt"> | ResumeDocument,
): string {
  const payload = {
    personal: resume.personal,
    experience: resume.experience,
    projects: resume.projects,
    skills: resume.skills,
    languages: resume.languages,
    education: resume.education,
    templateId: resume.templateId,
  };
  const str = JSON.stringify(payload);
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0;
  }
  return `h${Math.abs(h)}`;
}

export function isAtsCacheValid(
  resume: ResumeDocument,
  locale: string,
): boolean {
  if (typeof resume.lastAtsScore !== "number") return false;
  if (!resume.atsContentHash || !resume.lastAtsBreakdown) return false;
  if (resume.atsContentHash !== hashResumeContent(resume)) return false;
  if (resume.atsScoredLocale && resume.atsScoredLocale !== locale) return false;
  return true;
}
