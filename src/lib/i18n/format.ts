/**
 * Format helpers that depend on the active dictionary.
 *
 * The `t` argument is the function returned by `useT()` / `useI18n()`. Pulling
 * it in here keeps the formatters themselves pure and SSR-safe (no React
 * hook calls inside).
 */

type Translator = (key: string, vars?: Record<string, string | number>) => string;

/**
 * "5m ago" / "2h ago" / "3d ago" / locale date string for older timestamps.
 *
 * `verbose=false` (default) returns the long, human form.
 * `verbose=true` is a misnomer kept for clarity at call sites — see
 * `formatRelativeShort` below for the compact variant.
 */
export function formatRelative(t: Translator, isoOrMs: string | number): string {
  const ms = typeof isoOrMs === "number" ? isoOrMs : new Date(isoOrMs).getTime();
  const diff = Date.now() - ms;
  const s = Math.max(0, Math.round(diff / 1000));
  if (s < 60) return t("time.justNow");
  const m = Math.round(s / 60);
  if (m < 60) return t("time.minutesAgo", { n: m });
  const h = Math.round(m / 60);
  if (h < 24) return t("time.hoursAgo", { n: h });
  const d = Math.round(h / 24);
  if (d < 7) return t("time.daysAgo", { n: d });
  return new Date(ms).toLocaleDateString();
}

/** Compact form for tight rows (stat tiles, sidebars). */
export function formatRelativeShort(
  t: Translator,
  isoOrMs: string | number,
): string {
  const ms = typeof isoOrMs === "number" ? isoOrMs : new Date(isoOrMs).getTime();
  const diff = Date.now() - ms;
  const s = Math.max(0, Math.round(diff / 1000));
  if (s < 60) return t("time.nowShort");
  const m = Math.round(s / 60);
  if (m < 60) return t("time.minutesShort", { n: m });
  const h = Math.round(m / 60);
  if (h < 24) return t("time.hoursShort", { n: h });
  const d = Math.round(h / 24);
  if (d < 7) return t("time.daysShort", { n: d });
  return new Date(ms).toLocaleDateString();
}
