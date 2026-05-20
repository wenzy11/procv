"use client";

import * as React from "react";
import { Check, Infinity, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n, useT } from "@/components/providers/i18n-provider";
import {
  fetchBillingConfig,
  startProCheckout,
  type BillingConfig,
} from "@/lib/billing/checkout-client";
import { isUpgrade, normalizePlan, planRank } from "@/lib/billing/plan";
import type { BillingTier, UserPlan } from "@/lib/billing/types";

const TIER_ORDER: BillingTier[] = ["monthly", "yearly", "unlimited"];

type TierCard = {
  id: UserPlan;
  tier?: BillingTier;
  featured?: boolean;
};

const CARDS: TierCard[] = [
  { id: "free" },
  { id: "monthly", tier: "monthly" },
  { id: "yearly", tier: "yearly", featured: true },
  { id: "unlimited", tier: "unlimited" },
];

function planLabelKey(plan: UserPlan): string {
  switch (plan) {
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

function priceKey(plan: UserPlan): string {
  switch (plan) {
    case "monthly":
      return "payment.priceMonthly";
    case "yearly":
      return "payment.priceYearly";
    case "unlimited":
      return "payment.priceUnlimited";
    default:
      return "payment.priceFree";
  }
}

function periodKey(plan: UserPlan): string {
  switch (plan) {
    case "monthly":
      return "payment.periodMonthly";
    case "yearly":
      return "payment.periodYearly";
    case "unlimited":
      return "payment.periodUnlimited";
    default:
      return "payment.periodFree";
  }
}

function featuresKey(plan: UserPlan): string {
  return `payment.features.${plan}`;
}

export function PricingPlans() {
  const t = useT();
  const { locale } = useI18n();
  const { user, plan, isPro, configured } = useAuth();
  const [config, setConfig] = React.useState<BillingConfig | null>(null);
  const [loadingTier, setLoadingTier] = React.useState<BillingTier | null>(null);

  const current = normalizePlan(plan);

  React.useEffect(() => {
    void fetchBillingConfig().then(setConfig);
  }, []);

  async function onSelect(tier: BillingTier) {
    if (!user) {
      toast.error(t("payment.signInRequired"));
      return;
    }
    if (!configured) {
      toast.error(t("errors.firebase"));
      return;
    }
    setLoadingTier(tier);
    try {
      toast.info(t("payment.redirecting"));
      await startProCheckout(tier, user.email, locale);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("payment.error");
      toast.error(message);
    } finally {
      setLoadingTier(null);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {CARDS.map((card) => {
        const isCurrent = current === card.id;
        const tierAvailable =
          card.tier && (config?.tiers.includes(card.tier) ?? false);
        const isDowngrade =
          card.tier !== undefined && planRank(card.id) < planRank(current);
        const canBuy =
          card.tier &&
          tierAvailable &&
          !isCurrent &&
          !isDowngrade &&
          isUpgrade(current, card.id);
        const isPaidCurrent = isCurrent && card.id !== "free";
        const showBest =
          card.featured && card.id === "yearly" && !isPro;

        return (
          <div
            key={card.id}
            className={cn(
              "relative flex flex-col rounded-xl border p-4 transition-colors",
              isCurrent
                ? "border-accent-400/40 bg-accent-500/10"
                : "border-white/[0.08] bg-white/[0.02]",
              card.featured && "ring-1 ring-violet-500/30",
            )}
          >
            {showBest ? (
              <Badge
                tone="violet"
                size="sm"
                className="absolute -top-2.5 left-4"
              >
                {t("payment.bestValue")}
              </Badge>
            ) : null}

            <div className="mb-3 flex items-center gap-2">
              {card.id === "unlimited" ? (
                <Infinity className="h-4 w-4 text-violet-400" />
              ) : card.id !== "free" ? (
                <Sparkles className="h-4 w-4 text-violet-400" />
              ) : null}
              <h3 className="text-sm font-semibold">{t(planLabelKey(card.id))}</h3>
            </div>

            <p className="text-2xl font-bold tabular-nums text-ink-primary">
              {t(priceKey(card.id))}
            </p>
            <p className="mb-4 text-xs text-ink-tertiary">
              {t(periodKey(card.id))}
            </p>

            <ul className="mb-4 flex-1 space-y-2 text-xs text-ink-secondary">
              {(t(featuresKey(card.id)) as string)
                .split("|")
                .map((line) => (
                  <li key={line} className="flex gap-2">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-state-success" />
                    <span>{line.trim()}</span>
                  </li>
                ))}
            </ul>

            {card.id === "free" ? (
              <Button variant="secondary" size="sm" disabled={isCurrent}>
                {isCurrent ? t("payment.currentBadge") : t("payment.planFree")}
              </Button>
            ) : isPaidCurrent ? (
              <Button variant="secondary" size="sm" disabled>
                {t("payment.currentBadge")}
              </Button>
            ) : canBuy ? (
              <Button
                variant={card.featured ? "neon" : "secondary"}
                size="sm"
                loading={loadingTier === card.tier}
                onClick={() => void onSelect(card.tier!)}
              >
                {planRank(card.id) > planRank(current)
                  ? t("payment.upgradeTo", {
                      plan: t(planLabelKey(card.id)),
                    })
                  : t("payment.choosePlan")}
              </Button>
            ) : isDowngrade ? (
              <Button variant="ghost" size="sm" disabled>
                {t("payment.included")}
              </Button>
            ) : (
              <Button variant="ghost" size="sm" disabled>
                {!tierAvailable
                  ? t("payment.notAvailable")
                  : t("payment.currentBadge")}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
