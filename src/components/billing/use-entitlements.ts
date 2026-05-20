"use client";

import * as React from "react";

import { useAuth } from "@/components/providers/auth-provider";
import {
  canUseFeature,
  canUseTemplate,
  getEntitlements,
  type PremiumFeature,
} from "@/lib/billing/entitlements";
import { fetchUsageSnapshot, type UsageSnapshot } from "@/lib/billing/usage-client";
import type { ResumeTemplateId } from "@/lib/types";

export function useEntitlements() {
  const { plan, isPro, subscriptionStatus } = useAuth();
  const planInfo = React.useMemo(
    () => ({ plan, subscriptionStatus }),
    [plan, subscriptionStatus],
  );
  const ent = React.useMemo(() => getEntitlements(planInfo), [planInfo]);
  const [usage, setUsage] = React.useState<UsageSnapshot | null>(null);

  const refreshUsage = React.useCallback(async () => {
    const snap = await fetchUsageSnapshot();
    setUsage(snap);
    return snap;
  }, []);

  React.useEffect(() => {
    void refreshUsage();
  }, [refreshUsage, plan]);

  const atsCount = usage?.ats.count ?? 0;

  return {
    ent,
    isPro,
    usage,
    refreshUsage,
    canUseTemplate: (id: ResumeTemplateId) => canUseTemplate(planInfo, id),
    canUse: (feature: PremiumFeature) =>
      canUseFeature(planInfo, feature, { atsCount }),
    atsRemaining: usage?.ats.remaining ?? ent.atsPerMonth,
    resumeRemaining: usage?.resumes.remaining ?? ent.maxResumes,
  };
}
