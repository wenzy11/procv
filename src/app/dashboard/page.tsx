"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { PlanUsageBanner } from "@/components/billing/plan-usage-banner";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { ResumeList } from "@/components/dashboard/resume-list";
import { ApplicationsPreview } from "@/components/dashboard/applications-preview";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/auth-provider";
import { useT } from "@/components/providers/i18n-provider";

export default function DashboardPage() {
  return (
    <AppShell>
      <AuthGuard>
        <DashboardBody />
      </AuthGuard>
    </AppShell>
  );
}

function DashboardBody() {
  return (
    <div className="mx-auto max-w-[1600px] px-5 py-6">
      <HeroBanner />
      <div className="mt-4">
        <PlanUsageBanner />
      </div>
      <div className="mt-6">
        <StatsGrid />
      </div>
      <div className="mt-6">
        <ApplicationsPreview />
      </div>
      <div className="mt-6">
        <ResumeList />
      </div>
    </div>
  );
}

function HeroBanner() {
  const t = useT();
  const { user } = useAuth();
  const firstName = (user?.displayName ?? user?.email ?? "").split(" ")[0] ?? "";

  return (
    <section
      aria-label={t("common.welcomeAria")}
      className="relative overflow-hidden rounded-xl border border-white/[0.07] bg-surface-card p-6 shadow-panel"
    >
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-grid opacity-70" />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-20 h-72 w-72 rounded-full bg-brand-gradient-soft blur-3xl"
      />

      <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="max-w-2xl">
          <Badge tone="violet" size="md">
            <Sparkles className="h-3 w-3" />
            ProCV
          </Badge>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            {firstName ? (
              <>
                {t("dashboard.welcome")},{" "}
                <span className="text-brand-gradient">{firstName}</span>.
              </>
            ) : (
              t("dashboard.welcomeAnon")
            )}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-ink-secondary">
            {t("dashboard.subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button asChild variant="neon" size="lg">
            <Link href="/editor">
              {t("dashboard.openEditor")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg">
            <Link href="/applications">{t("nav.applications")}</Link>
          </Button>
          <Button asChild variant="ghost" size="lg">
            <Link href="/job-matching">{t("dashboard.matchJD")}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
