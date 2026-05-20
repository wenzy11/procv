"use client";

import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ApplicationsBoard } from "@/components/applications/applications-board";
import { useT } from "@/components/providers/i18n-provider";

export default function ApplicationsPage() {
  return (
    <AppShell>
      <AuthGuard>
        <ApplicationsBody />
      </AuthGuard>
    </AppShell>
  );
}

function ApplicationsBody() {
  const t = useT();

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-6">
      <header className="mb-6">
        <p className="text-2xs font-medium uppercase tracking-[0.14em] text-accent-300">
          ProCV
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {t("applications.title")}
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-ink-secondary">
          {t("applications.subtitle")}
        </p>
      </header>
      <ApplicationsBoard />
    </div>
  );
}
