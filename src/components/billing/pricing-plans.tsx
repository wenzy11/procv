"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Check,
  Crown,
  Infinity,
  Sparkles,
  Zap,
} from "lucide-react";
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

const PLAN_STYLE: Record<
  UserPlan,
  {
    icon: React.ComponentType<{ className?: string }>;
    ring: string;
    glow: string;
    iconWrap: string;
    priceGradient: string;
  }
> = {
  free: {
    icon: Zap,
    ring: "border-white/[0.08]",
    glow: "",
    iconWrap: "bg-white/[0.06] text-ink-secondary",
    priceGradient: "text-ink-primary",
  },
  monthly: {
    icon: Calendar,
    ring: "border-sky-500/25",
    glow: "hover:shadow-[0_0_40px_-12px_rgba(56,189,248,0.35)]",
    iconWrap: "bg-sky-500/15 text-sky-300",
    priceGradient: "bg-gradient-to-r from-sky-200 to-cyan-200 bg-clip-text text-transparent",
  },
  yearly: {
    icon: Sparkles,
    ring: "border-violet-400/50",
    glow: "shadow-[0_0_48px_-10px_rgba(139,92,246,0.45)] hover:shadow-[0_0_56px_-8px_rgba(168,85,247,0.55)]",
    iconWrap: "bg-violet-500/20 text-violet-300",
    priceGradient: "bg-gradient-to-r from-violet-200 to-fuchsia-200 bg-clip-text text-transparent",
  },
  unlimited: {
    icon: Crown,
    ring: "border-amber-400/30",
    glow: "hover:shadow-[0_0_40px_-12px_rgba(251,191,36,0.3)]",
    iconWrap: "bg-amber-500/15 text-amber-200",
    priceGradient: "bg-gradient-to-r from-amber-200 to-orange-200 bg-clip-text text-transparent",
  },
};

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

function planDescKey(plan: UserPlan): string {
  return `payment.planDesc.${plan}`;
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

function parseFeatures(raw: string): string[] {
  return raw.split("|").map((s) => s.trim()).filter(Boolean);
}

interface PricingPlansProps {
  /** Compact layout for embedded settings */
  compact?: boolean;
  showHeader?: boolean;
}

export function PricingPlans({
  compact = false,
  showHeader = true,
}: PricingPlansProps) {
  const t = useT();
  const { locale } = useI18n();
  const { user, plan, configured } = useAuth();
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
    <section className={cn("relative", compact ? "space-y-6" : "space-y-10")}>
      {showHeader ? (
        <div className={cn("text-center", compact ? "text-left" : "mx-auto max-w-2xl")}>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-violet-400">
            {t("payment.sectionEyebrow")}
          </p>
          <h2
            className={cn(
              "mt-2 font-semibold tracking-tight text-ink-primary",
              compact ? "text-xl" : "text-3xl sm:text-4xl",
            )}
          >
            {t("payment.sectionTitle")}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-secondary">
            {t("payment.sectionSubtitle")}
          </p>
        </div>
      ) : null}

      <div
        className={cn(
          "relative grid gap-5",
          compact
            ? "sm:grid-cols-2 xl:grid-cols-4"
            : "md:grid-cols-2 xl:grid-cols-4",
        )}
      >
        {!compact ? (
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-x-8 top-1/2 h-64 -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.12),transparent_70%)]"
          />
        ) : null}

        {CARDS.map((card, index) => {
          const style = PLAN_STYLE[card.id];
          const Icon = style.icon;
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
          const showBest = card.featured && card.id === "yearly";

          return (
            <motion.article
              key={card.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.4 }}
              className={cn(
                "relative flex flex-col rounded-2xl border p-5 transition-all duration-300",
                style.ring,
                style.glow,
                isCurrent
                  ? "border-accent-400/50 bg-gradient-to-b from-accent-500/12 to-transparent"
                  : "bg-surface-elevated/80 backdrop-blur-sm",
                card.featured &&
                  !isCurrent &&
                  "scale-[1.02] border-violet-400/40 bg-gradient-to-b from-violet-500/10 via-transparent to-transparent",
              )}
            >
              {showBest ? (
                <Badge
                  tone="violet"
                  size="sm"
                  className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap shadow-lg"
                >
                  {t("payment.bestValue")}
                </Badge>
              ) : null}

              {isCurrent ? (
                <span className="absolute right-4 top-4 rounded-full bg-accent-500/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-accent-300">
                  {t("payment.currentBadge")}
                </span>
              ) : null}

              <div className="mb-4 flex items-start gap-3">
                <span
                  className={cn(
                    "grid h-10 w-10 shrink-0 place-items-center rounded-xl",
                    style.iconWrap,
                  )}
                >
                  {card.id === "unlimited" ? (
                    <Infinity className="h-5 w-5" />
                  ) : (
                    <Icon className="h-5 w-5" />
                  )}
                </span>
                <div className="min-w-0 pr-8">
                  <h3 className="text-base font-semibold text-ink-primary">
                    {t(planLabelKey(card.id))}
                  </h3>
                  <p className="mt-0.5 text-xs leading-snug text-ink-tertiary">
                    {t(planDescKey(card.id))}
                  </p>
                </div>
              </div>

              <div className="mb-5">
                <p
                  className={cn(
                    "text-3xl font-bold tabular-nums tracking-tight",
                    style.priceGradient,
                  )}
                >
                  {t(priceKey(card.id))}
                </p>
                <p className="mt-1 text-xs text-ink-tertiary">
                  {t(periodKey(card.id))}
                </p>
              </div>

              <ul className="mb-6 flex-1 space-y-2.5 border-t border-white/[0.06] pt-5">
                {parseFeatures(t(featuresKey(card.id)) as string).map((line) => (
                  <li key={line} className="flex gap-2.5 text-sm text-ink-secondary">
                    <span
                      className={cn(
                        "mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full",
                        card.id === "free"
                          ? "bg-white/[0.06] text-ink-tertiary"
                          : "bg-emerald-500/15 text-emerald-400",
                      )}
                    >
                      <Check className="h-3 w-3" />
                    </span>
                    <span className="leading-snug">{line}</span>
                  </li>
                ))}
              </ul>

              {card.id === "free" ? (
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full"
                  disabled={isCurrent}
                >
                  {isCurrent ? t("payment.currentBadge") : t("payment.stayOnFree")}
                </Button>
              ) : isPaidCurrent ? (
                <Button variant="secondary" size="lg" className="w-full" disabled>
                  {t("payment.currentBadge")}
                </Button>
              ) : canBuy ? (
                <Button
                  variant={card.featured ? "neon" : "primary"}
                  size="lg"
                  className="w-full"
                  loading={loadingTier === card.tier}
                  onClick={() => void onSelect(card.tier!)}
                >
                  {t("payment.ctaUpgrade", {
                    plan: t(planLabelKey(card.id)),
                  })}
                </Button>
              ) : isDowngrade ? (
                <Button variant="ghost" size="lg" className="w-full" disabled>
                  {t("payment.included")}
                </Button>
              ) : (
                <Button variant="ghost" size="lg" className="w-full" disabled>
                  {!tierAvailable
                    ? t("payment.notAvailable")
                    : t("payment.currentBadge")}
                </Button>
              )}
            </motion.article>
          );
        })}
      </div>

      <p className="text-center text-xs text-ink-tertiary">
        {t("payment.footerNote")}
      </p>
    </section>
  );
}
