"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { PricingPlans } from "@/components/billing/pricing-plans";
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
    <div id="plans" className="mt-10 scroll-mt-24">
      {syncingPlan && !isPro ? (
        <p className="mb-4 text-center text-sm text-ink-tertiary">
          {t("common.loading")} — {t("payment.syncingPlan")}
        </p>
      ) : (
        <p className="mb-6 text-sm text-ink-secondary">
          {t("payment.currentPlanLabel")}{" "}
          <span className="font-medium text-ink-primary">
            {t(planLabelKey(current))}
          </span>
          {isPro ? (
            <span className="ml-2 text-state-success">({t("payment.activeBadge")})</span>
          ) : null}
        </p>
      )}
      <PricingPlans compact showHeader />
    </div>
  );
}
