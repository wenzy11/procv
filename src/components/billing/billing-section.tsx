"use client";

import * as React from "react";
import { useSearchParams } from "next/navigation";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";

import { UpgradeButton } from "@/components/billing/upgrade-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";
import { useT } from "@/components/providers/i18n-provider";

export function BillingSection() {
  const t = useT();
  const { isPro, refreshProfile } = useAuth();
  const searchParams = useSearchParams();
  const handled = React.useRef(false);

  React.useEffect(() => {
    if (handled.current) return;
    if (searchParams.get("billing") !== "success") return;
    handled.current = true;
    toast.success(t("payment.success"));
    void refreshProfile();
  }, [searchParams, refreshProfile, t]);

  return (
    <Card glass className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-accent-400" />
          {t("payment.billingTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-xs text-ink-tertiary">{t("payment.billingHint")}</p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium">{t("payment.currentPlan")}</p>
            <p className="text-xs text-ink-tertiary">
              {isPro ? t("payment.planPro") : t("payment.planFree")}
            </p>
          </div>
          {!isPro ? <UpgradeButton showIcon /> : null}
        </div>
      </CardContent>
    </Card>
  );
}
