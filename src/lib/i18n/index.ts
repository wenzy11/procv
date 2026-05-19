import { en } from "./dictionaries/en";
import { tr } from "./dictionaries/tr";
import { es } from "./dictionaries/es";
import { de } from "./dictionaries/de";
import { fr } from "./dictionaries/fr";
import type { Dictionary } from "./types";

export type Locale = "en" | "tr" | "es" | "de" | "fr";

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALES: Locale[] = ["en", "tr", "es", "de", "fr"];

/** All loaded dictionaries keyed by locale. */
export const DICTIONARIES: Record<Locale, Dictionary> = {
  en,
  tr,
  es,
  de,
  fr,
};

/** Map of human-readable locale labels (rendered in the language menu). */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: en.locale,
  tr: tr.locale,
  es: es.locale,
  de: de.locale,
  fr: fr.locale,
};

export const LOCALE_FLAGS: Record<Locale, string> = {
  en: "🇬🇧",
  tr: "🇹🇷",
  es: "🇪🇸",
  de: "🇩🇪",
  fr: "🇫🇷",
};

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (LOCALES as string[]).includes(value);
}

export function pickBrowserLocale(): Locale {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  const lang = (navigator.language || "").slice(0, 2).toLowerCase();
  return isLocale(lang) ? lang : DEFAULT_LOCALE;
}

export type { Dictionary };
