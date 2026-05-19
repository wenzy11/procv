export type UserPlan = "free" | "pro";

export type SubscriptionStatus =
  | "none"
  | "active"
  | "on_trial"
  | "past_due"
  | "cancelled"
  | "expired"
  | "paused";
