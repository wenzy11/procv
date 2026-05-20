import type { ATSScore } from "@/lib/types";

export type BreakdownKey = keyof ATSScore["breakdown"];

/** Static coaching copy keyed for i18n (`ats.breakdownTips.*`). */
export const BREAKDOWN_TIP_KEYS: Record<BreakdownKey, string> = {
  keywordCoverage: "ats.breakdownTips.keywordCoverage",
  formatting: "ats.breakdownTips.formatting",
  impactLanguage: "ats.breakdownTips.impactLanguage",
  completeness: "ats.breakdownTips.completeness",
  readability: "ats.breakdownTips.readability",
};

export function breakdownMood(
  value: number,
): "excellent" | "strong" | "fair" | "needsWork" {
  if (value >= 80) return "excellent";
  if (value >= 65) return "strong";
  if (value >= 45) return "fair";
  return "needsWork";
}
