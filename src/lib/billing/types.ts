/** Kullanıcının Firestore’daki planı */
export type UserPlan = "free" | "monthly" | "yearly" | "unlimited";

/** Checkout’ta seçilen ücretli plan */
export type BillingTier = "monthly" | "yearly" | "unlimited";

export type SubscriptionStatus =
  | "none"
  | "active"
  | "on_trial"
  | "past_due"
  | "cancelled"
  | "expired"
  | "paused";
