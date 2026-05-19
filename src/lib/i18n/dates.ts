import type { Locale } from "@/lib/i18n";

const LOCALE_MAP: Record<Locale, string> = {
  en: "en-US",
  tr: "tr-TR",
  es: "es-ES",
  de: "de-DE",
  fr: "fr-FR",
};

/**
 * Formats résumé date fields (`YYYY-MM` or `Present`) for display in preview/PDF.
 */
export function formatResumeDate(
  value: string,
  locale: Locale,
  presentLabel: string,
): string {
  if (!value) return "";
  if (value === "Present") return presentLabel;

  const parts = value.split("-");
  const year = parts[0];
  const month = parts[1];
  if (!year) return value;
  if (!month) return year;

  const monthIndex = parseInt(month, 10) - 1;
  if (Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return `${month}/${year}`;
  }

  const date = new Date(Number(year), monthIndex, 1);
  const label = new Intl.DateTimeFormat(LOCALE_MAP[locale], {
    month: "short",
    year: "numeric",
  }).format(date);

  return label;
}
