"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";

import { PricingPlans } from "@/components/billing/pricing-plans";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";
import { useT } from "@/components/providers/i18n-provider";
import { syncProPlanAfterPayment } from "@/lib/billing/checkout-client";
import { normalizePlan } from "@/lib/billing/plan";
import type { UserPlan } from "@/lib/billing/types";

function planLabelKey(plan: UserPlan): string {
  switch (normalizePlan(plan)) {
    case "monthly":
      return "payment.planMonthly";
    case "yearly":
      return "payment.planYearly";
    case "unlimited":
      return "payment.planUnlimited";
    default:
      return "payment.planFree";
  }
}

export function BillingSection() {
  const t = useT();
  const { plan, isPro, refreshProfile } = useAuth();
  const searchParams = useSearchParams();
  const handled = React.useRef(false);
  const [syncingPlan, setSyncingPlan] = React.useState(false);

  const current = normalizePlan(plan);

  React.useEffect(() => {
    if (handled.current) return;
    if (searchParams.get("billing") !== "success") return;
    handled.current = true;
    toast.success(t("payment.success"));
    setSyncingPlan(true);
    void (async () => {
      await syncProPlanAfterPayment();
      await refreshProfile();
    })();
  }, [searchParams, refreshProfile, t]);

  React.useEffect(() => {
    if (!syncingPlan || isPro) return;

    let cancelled = false;
    let tries = 0;
    const maxTries = 12;

    const interval = window.setInterval(() => {
      if (cancelled) return;
      tries += 1;
      void refreshProfile();
      if (tries >= maxTries) {
        setSyncingPlan(false);
        window.clearInterval(interval);
      }
    }, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [syncingPlan, isPro, refreshProfile]);

  React.useEffect(() => {
    if (isPro) setSyncingPlan(false);
  }, [isPro]);

  return (
    <Card glass className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-accent-400" />
          {t("payment.billingTitle")}
        </CardTitle>
        <p className="text-xs text-ink-tertiary">{t("payment.billingHint")}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between gap-4 rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
          <div>
            <p className="text-sm font-medium">{t("payment.currentPlan")}</p>
            <p className="text-xs text-ink-tertiary">
              {syncingPlan && !isPro
                ? t("common.loading")
                : t(planLabelKey(current))}
            </p>
          </div>
          {isPro ? (
            <span className="text-xs font-medium text-state-success">
              {t("payment.activeBadge")}
            </span>
          ) : null}
        </div>

        <PricingPlans />
      </CardContent>
    </Card>
  );
}
