import type { SubscriptionStatus, UserPlan } from "./types";

export interface PlanInfo {
  plan: UserPlan;
  subscriptionStatus?: SubscriptionStatus;
}

/** Active paid access (subscription or trial). */
export function isProAccess(info: PlanInfo): boolean {
  if (info.plan === "pro") return true;
  const s = info.subscriptionStatus;
  return s === "active" || s === "on_trial";
}
