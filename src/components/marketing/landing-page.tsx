"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Briefcase,
  Check,
  FileSignature,
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
    { icon: Sparkles, title: t("landing.feature1Title"), desc: t("landing.feature1Desc") },
    { icon: Target, title: t("landing.feature2Title"), desc: t("landing.feature2Desc") },
    { icon: BarChart3, title: t("landing.feature3Title"), desc: t("landing.feature3Desc") },
    { icon: Briefcase, title: t("landing.feature5Title"), desc: t("landing.feature5Desc") },
    { icon: FileSignature, title: t("landing.feature6Title"), desc: t("landing.feature6Desc") },
    { icon: Zap, title: t("landing.feature4Title"), desc: t("landing.feature4Desc") },
  ];

  const steps = [
    { n: "1", title: t("landing.step1Title"), desc: t("landing.step1Desc") },
    { n: "2", title: t("landing.step2Title"), desc: t("landing.step2Desc") },
    { n: "3", title: t("landing.step3Title"), desc: t("landing.step3Desc") },
  ];

  const faq = [1, 2, 3, 4, 5].map((i) => ({
    q: t(`landing.faq.q${i}` as "landing.faq.q1"),
    a: t(`landing.faq.a${i}` as "landing.faq.a1"),
  }));

  const plans = [
    {
      key: "free" as const,
      label: t("payment.planFree"),
      price: t("payment.priceFree"),
      period: t("payment.periodFree"),
    },
    {
      key: "yearly" as const,
      label: t("payment.planYearly"),
      price: t("payment.priceYearly"),
      period: t("payment.periodYearly"),
      featured: true,
    },
    {
      key: "monthly" as const,
      label: t("payment.planMonthly"),
      price: t("payment.priceMonthly"),
      period: t("payment.periodMonthly"),
    },
  ];

  return (
    <div className="min-h-screen bg-surface-base text-ink-primary">
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-surface-base/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-ink-secondary md:flex">
            <a href="#features" className="hover:text-ink-primary">
              {t("landing.navFeatures")}
            </a>
            <a href="#pricing" className="hover:text-ink-primary">
              {t("landing.navPricing")}
            </a>
            <a href="#faq" className="hover:text-ink-primary">
              {t("landing.navFaq")}
            </a>
          </nav>
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
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-6 py-20 text-center md:py-28">
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
            className="mx-auto mt-4 max-w-4xl text-4xl font-semibold tracking-tight md:text-6xl"
          >
            {t("landing.heroTitle")}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mx-auto mt-6 max-w-2xl text-lg text-ink-secondary md:text-xl"
          >
            {t("landing.heroSubtitle")}
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
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
          <ul className="mx-auto mt-8 flex max-w-xl flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-ink-tertiary">
            {[t("landing.trust1"), t("landing.trust2"), t("landing.trust3")].map(
              (line) => (
                <li key={line} className="flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5 text-state-success" />
                  {line}
                </li>
              ),
            )}
          </ul>
        </section>

        <section
          id="features"
          className="border-t border-white/[0.06] bg-white/[0.01] py-20"
        >
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center text-2xl font-semibold md:text-3xl">
              {t("landing.featuresTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-ink-secondary">
              {t("landing.featuresSubtitle")}
            </p>
            <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl border border-white/[0.06] bg-surface-card p-6 shadow-panel"
                >
                  <f.icon className="h-6 w-6 text-accent-400" />
                  <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
                    {f.desc}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-center text-2xl font-semibold">{t("landing.howTitle")}</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((s) => (
              <div key={s.n} className="text-center">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-brand-gradient text-sm font-bold text-white">
                  {s.n}
                </span>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-ink-secondary">{s.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section
          id="pricing"
          className="border-t border-white/[0.06] bg-white/[0.01] py-20"
        >
          <div className="mx-auto max-w-6xl px-6">
            <h2 className="text-center text-2xl font-semibold md:text-3xl">
              {t("landing.pricingTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-center text-sm text-ink-secondary">
              {t("landing.pricingSubtitle")}
            </p>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {plans.map((p) => (
                <div
                  key={p.key}
                  className={`rounded-xl border p-6 ${
                    "featured" in p && p.featured
                      ? "border-violet-400/40 bg-violet-500/5 shadow-[0_0_40px_-12px_rgba(139,92,246,0.4)]"
                      : "border-white/[0.06] bg-surface-card"
                  }`}
                >
                  {"featured" in p && p.featured ? (
                    <span className="text-2xs font-semibold uppercase tracking-wider text-violet-300">
                      {t("payment.bestValue")}
                    </span>
                  ) : null}
                  <p className="mt-2 text-lg font-semibold">{p.label}</p>
                  <p className="mt-2 text-3xl font-bold">{p.price}</p>
                  <p className="text-xs text-ink-tertiary">{p.period}</p>
                  <ul className="mt-4 space-y-2">
                    {t(`payment.features.${p.key}` as "payment.features.free")
                      .split("|")
                      .map((line) => (
                        <li
                          key={line}
                          className="flex items-start gap-2 text-xs text-ink-secondary"
                        >
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-state-success" />
                          {line}
                        </li>
                      ))}
                  </ul>
                  <Button
                    variant={"featured" in p && p.featured ? "neon" : "secondary"}
                    className="mt-6 w-full"
                    asChild
                  >
                    <Link href="/sign-up">{t("landing.ctaPrimary")}</Link>
                  </Button>
                </div>
              ))}
            </div>
            <p className="mt-6 text-center text-xs text-ink-tertiary">
              {t("payment.footerNote")}
            </p>
          </div>
        </section>

        <section id="faq" className="mx-auto max-w-3xl px-6 py-20">
          <h2 className="text-center text-2xl font-semibold">{t("landing.faqTitle")}</h2>
          <div className="mt-10 space-y-4">
            {faq.map((item) => (
              <details
                key={item.q}
                className="group rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3"
              >
                <summary className="cursor-pointer text-sm font-medium text-ink-primary">
                  {item.q}
                </summary>
                <p className="mt-2 pb-1 text-sm leading-relaxed text-ink-secondary">
                  {item.a}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="border-t border-white/[0.06] py-16 text-center">
          <h2 className="text-2xl font-semibold">{t("landing.ctaBandTitle")}</h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-ink-secondary">
            {t("landing.ctaBandSubtitle")}
          </p>
          <Button variant="neon" size="lg" className="mt-6" asChild>
            <Link href="/sign-up">
              {t("landing.ctaPrimary")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </section>
      </main>

      <footer className="border-t border-white/[0.06] py-10">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 text-xs text-ink-tertiary md:flex-row">
          <Logo />
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-ink-primary">
              {t("legal.privacy")}
            </Link>
            <Link href="/terms" className="hover:text-ink-primary">
              {t("legal.terms")}
            </Link>
          </div>
          <p>© {new Date().getFullYear()} ProCV</p>
        </div>
      </footer>
    </div>
  );
}
