"use client";

import { Globe, Check } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n, useT } from "@/components/providers/i18n-provider";
import { LOCALE_FLAGS, LOCALE_LABELS, LOCALES, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/cn";

interface LocaleSwitcherProps {
  variant?: "ghost" | "compact";
}

/**
 * Language picker. Used in the TopNav (compact) and on the auth screens
 * (compact). Selection is persisted via the i18n provider.
 */
export function LocaleSwitcher({ variant = "ghost" }: LocaleSwitcherProps) {
  const { locale, setLocale } = useI18n();
  const t = useT();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("nav.language")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md border border-white/[0.06] bg-white/[0.02] px-2 py-1 text-xs font-medium text-ink-secondary transition-colors hover:border-white/[0.14] hover:text-ink-primary",
            variant === "compact" && "h-7",
          )}
        >
          <Globe className="h-3 w-3" />
          <span className="text-[11px]">{LOCALE_FLAGS[locale]}</span>
          <span className="hidden sm:inline">{LOCALE_LABELS[locale]}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[10rem]">
        <DropdownMenuLabel>{t("nav.language")}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {LOCALES.map((l) => (
          <DropdownMenuItem
            key={l}
            onSelect={() => setLocale(l as Locale)}
            className="cursor-pointer"
          >
            <span className="mr-1">{LOCALE_FLAGS[l]}</span>
            <span className="flex-1">{LOCALE_LABELS[l]}</span>
            {locale === l ? (
              <Check className="h-3.5 w-3.5 text-accent-300" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
