"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { useT } from "@/components/providers/i18n-provider";

/**
 * Shared chrome for /sign-in and /sign-up. Two-column layout on wide
 * screens: marketing/brand on the left, form on the right.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  const t = useT();
  return (
    <div className="grid min-h-screen grid-cols-1 lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden border-r border-white/[0.06] bg-surface-base px-10 py-10 lg:flex lg:flex-col lg:justify-between">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-grid opacity-70"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -left-32 top-1/3 h-96 w-96 rounded-full bg-brand-gradient-soft blur-3xl"
        />
        <Link href="/" className="relative z-10 self-start">
          <Logo />
        </Link>
        <div className="relative z-10 max-w-md">
          <p className="text-2xs font-medium uppercase tracking-[0.18em] text-accent-300">
            ProCV
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight">
            {t("brand.tagline")}
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-ink-secondary">
            {t("auth.tagline")} {t("auth.poweredBy")}
          </p>
        </div>
        <div className="relative z-10 flex items-center justify-between text-xs text-ink-tertiary">
          <span>© {new Date().getFullYear()} ProCV</span>
          <LocaleSwitcher />
        </div>
      </aside>

      <main className="flex flex-col items-stretch justify-center px-6 py-10 sm:px-10">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex items-center justify-between lg:hidden">
            <Logo />
            <LocaleSwitcher />
          </div>
          <header className="mb-6">
            <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
            {subtitle ? (
              <p className="mt-1 text-sm text-ink-secondary">{subtitle}</p>
            ) : null}
          </header>
          {children}
          {footer ? (
            <p className="mt-6 text-center text-xs text-ink-tertiary">{footer}</p>
          ) : null}
        </div>
      </main>
    </div>
  );
}
