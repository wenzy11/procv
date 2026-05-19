"use client";

import * as React from "react";
import {
  DEFAULT_LOCALE,
  DICTIONARIES,
  isLocale,
  pickBrowserLocale,
  type Dictionary,
  type Locale,
} from "@/lib/i18n";

/**
 * Lightweight i18n provider.
 *
 * - The selected locale is persisted to `localStorage["procv:locale"]`.
 * - When the user signs in, `useAuth` calls `setLocale()` with their
 *   profile-stored value (see auth-provider.tsx).
 * - All translatable strings live in dictionary files; the `t()` helper
 *   accepts a dot-path and an optional `vars` object for `{name}` style
 *   interpolation.
 */

const STORAGE_KEY = "procv:locale";

interface I18nContextValue {
  locale: Locale;
  dict: Dictionary;
  setLocale: (next: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = React.createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // Read the persisted locale on mount, falling back to the browser language,
  // then to the default. Done in an effect so SSR + CSR stay stable.
  const [locale, setLocaleState] = React.useState<Locale>(DEFAULT_LOCALE);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (isLocale(stored)) {
      setLocaleState(stored);
    } else {
      setLocaleState(pickBrowserLocale());
    }
  }, []);

  const setLocale = React.useCallback((next: Locale) => {
    setLocaleState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
      document.documentElement.lang = next;
    }
  }, []);

  React.useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = locale;
    }
  }, [locale]);

  const dict = DICTIONARIES[locale];

  const t = React.useMemo<I18nContextValue["t"]>(
    () => (key, vars) => {
      const value = pluck(dict, key);
      if (typeof value !== "string") return key;
      if (!vars) return value;
      return interpolate(value, vars);
    },
    [dict],
  );

  const ctx = React.useMemo<I18nContextValue>(
    () => ({ locale, dict, setLocale, t }),
    [locale, dict, setLocale, t],
  );

  return <I18nContext.Provider value={ctx}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = React.useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used inside <I18nProvider />");
  }
  return ctx;
}

/** Convenience: `useT()` returns just the translator function. */
export function useT() {
  return useI18n().t;
}

function pluck(obj: unknown, key: string): unknown {
  let cur: unknown = obj;
  for (const part of key.split(".")) {
    if (cur && typeof cur === "object" && part in (cur as Record<string, unknown>)) {
      cur = (cur as Record<string, unknown>)[part];
    } else {
      return undefined;
    }
  }
  return cur;
}

function interpolate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, name: string) => {
    const v = vars[name];
    return v === undefined ? `{${name}}` : String(v);
  });
}
