"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import type { PremiumFeature } from "@/lib/billing/entitlements";
import { featureI18nKey } from "@/lib/billing/entitlements";
import { useT } from "@/components/providers/i18n-provider";

export function showUpgradePrompt(
  feature: PremiumFeature,
  t: (key: string, vars?: Record<string, string | number>) => string,
  router?: { push: (path: string) => void },
) {
  const featureName = t(featureI18nKey(feature));

  toast.error(t("upgrade.title"), {
    description: t("upgrade.description", { feature: featureName }),
    duration: 8000,
    action: {
      label: t("upgrade.cta"),
      onClick: () => {
        if (router) router.push("/plans");
        else window.location.href = "/plans";
      },
    },
  });
}

export function useUpgradePrompt() {
  const t = useT();
  const router = useRouter();

  return {
    prompt: (feature: PremiumFeature) =>
      showUpgradePrompt(feature, t, router),
    UpgradeLink: () => (
      <Link
        href="/plans"
        className="font-medium text-violet-400 underline-offset-2 hover:underline"
      >
        {t("upgrade.cta")}
      </Link>
    ),
  };
}
