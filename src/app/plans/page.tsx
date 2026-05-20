"use client";

import { Suspense } from "react";

import { AuthGuard } from "@/components/auth/auth-guard";
import { PricingPlans } from "@/components/billing/pricing-plans";
import { AppShell } from "@/components/layout/app-shell";
import { useT } from "@/components/providers/i18n-provider";

export default function PlansPage() {
  const t = useT();

  return (
    <AuthGuard>
      <AppShell>
        <div className="mx-auto max-w-6xl px-5 py-10 pb-16">
          <Suspense fallback={null}>
            <PricingPlans />
          </Suspense>
          <p className="mt-8 text-center text-xs text-ink-tertiary">
            {t("payment.billingHint")}
          </p>
        </div>
      </AppShell>
    </AuthGuard>
  );
}
