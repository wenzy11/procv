import {
  hasPaidAccess,
  normalizePlan,
  type PlanInfo,
} from "@/lib/billing/plan";
import { FREE_TEMPLATE_IDS, isFreeTemplate } from "@/lib/templates";
import type { UserPlan } from "@/lib/billing/types";
import type { ResumeTemplateId } from "@/lib/types";

export type PremiumFeature =
  | "ai_polish"
  | "job_match"
  | "pdf_export"
  | "premium_templates"
  | "unlimited_resumes"
  | "unlimited_ats";

export interface Entitlements {
  plan: UserPlan;
  paid: boolean;
  maxResumes: number;
  atsPerMonth: number;
  freeTemplateIds: readonly ResumeTemplateId[];
}

const FREE_LIMITS = {
  maxResumes: 2,
  atsPerMonth: 5,
} as const;

const PAID_LIMITS = {
  maxResumes: 50,
  atsPerMonth: 500,
} as const;

const PAID_ONLY: PremiumFeature[] = [
  "ai_polish",
  "job_match",
  "pdf_export",
  "premium_templates",
  "unlimited_resumes",
];

export function getEntitlements(info: PlanInfo): Entitlements {
  const plan = normalizePlan(info.plan);
  const paid = hasPaidAccess(info);

  return {
    plan,
    paid,
    maxResumes: paid ? PAID_LIMITS.maxResumes : FREE_LIMITS.maxResumes,
    atsPerMonth: paid ? PAID_LIMITS.atsPerMonth : FREE_LIMITS.atsPerMonth,
    freeTemplateIds: FREE_TEMPLATE_IDS,
  };
}

export function canUseTemplate(
  info: PlanInfo,
  templateId: ResumeTemplateId,
): boolean {
  if (hasPaidAccess(info)) return true;
  return isFreeTemplate(templateId);
}

export function canUseFeature(
  info: PlanInfo,
  feature: PremiumFeature,
  usage?: { atsCount: number },
): boolean {
  const ent = getEntitlements(info);
  if (ent.paid) return true;

  if (PAID_ONLY.includes(feature)) return false;

  if (feature === "unlimited_ats") {
    const used = usage?.atsCount ?? 0;
    return used < ent.atsPerMonth;
  }

  return true;
}

export function featureI18nKey(feature: PremiumFeature): string {
  return `upgrade.features.${feature}`;
}
