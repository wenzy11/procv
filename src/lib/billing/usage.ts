/** ATS kullanım sayacı — `users/{uid}` alanları */
export function currentUsageMonth(): string {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function normalizeAtsUsage(
  month: string | undefined,
  count: number | undefined,
): { month: string; count: number } {
  const current = currentUsageMonth();
  if (month !== current) {
    return { month: current, count: 0 };
  }
  return { month: current, count: typeof count === "number" ? count : 0 };
}
