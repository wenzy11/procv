import type { SubscriptionStatus, UserPlan } from "./types";

export interface PlanInfo {
  plan: UserPlan;
  subscriptionStatus?: SubscriptionStatus;
}

const PAID_PLANS = new Set<UserPlan>(["monthly", "yearly", "unlimited"]);

/** Eski `pro` kayıtlarını aylık say */
export function normalizePlan(raw?: string | null): UserPlan {
  if (raw === "monthly" || raw === "yearly" || raw === "unlimited") return raw;
  if (raw === "pro") return "monthly";
  return "free";
}

export function isPaidPlan(plan: UserPlan): boolean {
  return PAID_PLANS.has(plan);
}

/** Ücretli özelliklere erişim (AI, PDF, sınırsız ATS vb.) */
export function hasPaidAccess(info: PlanInfo): boolean {
  const plan = normalizePlan(info.plan);
  if (isPaidPlan(plan)) {
    if (plan === "unlimited") return true;
    const s = info.subscriptionStatus;
    return s === "active" || s === "on_trial";
  }
  const s = info.subscriptionStatus;
  return s === "active" || s === "on_trial";
}

/** @deprecated use hasPaidAccess */
export const isProAccess = hasPaidAccess;

export function planRank(plan: UserPlan): number {
  switch (normalizePlan(plan)) {
    case "unlimited":
      return 3;
    case "yearly":
      return 2;
    case "monthly":
      return 1;
    default:
      return 0;
  }
}

/** Yükseltme: mevcut plandan daha yüksek tier mı? */
export function isUpgrade(from: UserPlan, to: UserPlan): boolean {
  return planRank(to) > planRank(from);
}
