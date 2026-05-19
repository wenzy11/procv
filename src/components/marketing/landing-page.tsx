"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  FileText,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { useAuth } from "@/components/providers/auth-provider";
import { useT } from "@/components/providers/i18n-provider";

export function LandingPage() {
  const t = useT();
  const router = useRouter();
  const { user, initializing, configured } = useAuth();

  React.useEffect(() => {
    if (!configured || initializing) return;
    if (user) router.replace("/dashboard");
  }, [user, initializing, configured, router]);

  if (user && !initializing) return null;

  const features = [
    {
      icon: Sparkles,
      title: t("landing.feature1Title"),
      desc: t("landing.feature1Desc"),
    },
    {
      icon: Target,
      title: t("landing.feature2Title"),
      desc: t("landing.feature2Desc"),
    },
    {
      icon: BarChart3,
      title: t("landing.feature3Title"),
      desc: t("landing.feature3Desc"),
    },
    {
      icon: Zap,
      title: t("landing.feature4Title"),
      desc: t("landing.feature4Desc"),
    },
  ];

  return (
    <div className="min-h-screen bg-surface-base text-ink-primary">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo />
        <div className="flex items-center gap-2">
          <LocaleSwitcher />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/sign-in">{t("auth.signIn")}</Link>
          </Button>
          <Button variant="neon" size="sm" asChild>
            <Link href="/sign-up">
              {t("auth.signUp")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 pb-20">
        <section className="py-16 text-center md:py-24">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xs font-semibold uppercase tracking-[0.2em] text-accent-300"
          >
            {t("brand.tagline")}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mx-auto mt-4 max-w-3xl text-4xl font-semibold tracking-tight md:text-5xl"
          >
            {t("landing.heroTitle")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-5 max-w-2xl text-lg text-ink-secondary"
          >
            {t("landing.heroSubtitle")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
          >
            <Button variant="neon" size="lg" asChild>
              <Link href="/sign-up">
                <FileText className="h-4 w-4" />
                {t("landing.ctaPrimary")}
              </Link>
            </Button>
            <Button variant="secondary" size="lg" asChild>
              <Link href="/sign-in">{t("landing.ctaSecondary")}</Link>
            </Button>
          </motion.div>
          <p className="mt-4 text-xs text-ink-tertiary">{t("auth.poweredBy")}</p>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-5"
            >
              <f.icon className="h-5 w-5 text-accent-400" />
              <h3 className="mt-3 text-sm font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-ink-secondary">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </section>
      </main>
    </div>
  );
}
