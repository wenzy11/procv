import { isAtsCacheValid } from "@/lib/ats/resume-content-hash";
import type { AISuggestion, ATSScore, ResumeDocument } from "@/lib/types";

export function getCachedAtsAnalysis(
  resume: ResumeDocument,
  locale: string,
): { score: ATSScore; suggestions: AISuggestion[] } | null {
  if (!isAtsCacheValid(resume, locale)) return null;
  if (!resume.lastAtsBreakdown) return null;

  return {
    score: {
      total: resume.lastAtsScore ?? 0,
      breakdown: resume.lastAtsBreakdown,
    },
    suggestions: resume.lastAtsSuggestions ?? [],
  };
}
