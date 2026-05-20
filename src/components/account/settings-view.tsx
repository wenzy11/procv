"use client";

import * as React from "react";
import { Suspense } from "react";
import { Settings } from "lucide-react";

import { BillingSection } from "@/components/billing/billing-section";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { useT } from "@/components/providers/i18n-provider";

export function SettingsView() {
  const t = useT();

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t("settings.title")}</h1>
      <p className="mt-1 text-sm text-ink-secondary">{t("settings.hint")}</p>

      <Card glass className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-4 w-4 text-accent-400" />
            {t("settings.preferences")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">{t("nav.language")}</p>
              <p className="text-xs text-ink-tertiary">{t("settings.languageHint")}</p>
            </div>
            <LocaleSwitcher />
          </div>
        </CardContent>
      </Card>

      <Suspense fallback={null}>
        <BillingSection />
      </Suspense>
    </div>
  );
}
