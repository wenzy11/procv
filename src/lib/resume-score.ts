import type { ResumeDocument } from "@/lib/types";

/**
 * Client-side completion heuristic (matches dashboard list chips).
 * Used when no LLM ATS score has been saved yet.
 */
export function completionScore(r: ResumeDocument): number {
  const p = r.personal;
  let pts = 0;
  if (p.fullName) pts++;
  if (p.headline) pts++;
  if (p.email) pts++;
  if (p.summary.length > 80) pts++;
  if (r.experience.length > 0) pts++;
  if (r.skills.length >= 5) pts++;
  if (r.projects.length > 0) pts++;
  if (r.education.length > 0) pts++;
  return Math.round((pts / 8) * 100);
}

/** Prefer persisted ATS score; fall back to completion %. */
export function displayScore(r: ResumeDocument): number {
  if (typeof r.lastAtsScore === "number" && !Number.isNaN(r.lastAtsScore)) {
    return Math.round(r.lastAtsScore);
  }
  return completionScore(r);
}

export function hasPersistedAtsScore(r: ResumeDocument): boolean {
  return typeof r.lastAtsScore === "number";
}
