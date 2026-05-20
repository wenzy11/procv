import type { KeywordMatchResult } from "@/lib/types";

export function formatKeywordReport(
  result: KeywordMatchResult,
  labels: {
    title: string;
    strength: string;
    matched: string;
    missing: string;
    none: string;
  },
): string {
  const lines = [
    labels.title,
    `${labels.strength}: ${result.strength}%`,
    "",
    `## ${labels.matched} (${result.matched.length})`,
    result.matched.length ? result.matched.join(", ") : labels.none,
    "",
    `## ${labels.missing} (${result.missing.length})`,
    result.missing.length ? result.missing.join(", ") : labels.none,
  ];
  return lines.join("\n");
}

export function downloadTextFile(filename: string, content: string): void {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
