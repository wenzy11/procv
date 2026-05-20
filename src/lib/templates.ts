import { hasPaidAccess, type PlanInfo } from "@/lib/billing/plan";
import type { ResumeTemplateId } from "@/lib/types";

export type TemplateTier = "free" | "premium";

export interface ResumeTemplateMeta {
  id: ResumeTemplateId;
  i18nKey: string;
  descriptionKey: string;
  tier: TemplateTier;
  /** PDF / önizleme layout ailesi */
  layout: "classic" | "modern" | "minimal";
}

export const RESUME_TEMPLATES: ResumeTemplateMeta[] = [
  {
    id: "classic",
    i18nKey: "templates.classic",
    descriptionKey: "templates.classicHint",
    tier: "free",
    layout: "classic",
  },
  {
    id: "modern",
    i18nKey: "templates.modern",
    descriptionKey: "templates.modernHint",
    tier: "free",
    layout: "modern",
  },
  {
    id: "minimal",
    i18nKey: "templates.minimal",
    descriptionKey: "templates.minimalHint",
    tier: "free",
    layout: "minimal",
  },
  {
    id: "executive",
    i18nKey: "templates.executive",
    descriptionKey: "templates.executiveHint",
    tier: "premium",
    layout: "classic",
  },
  {
    id: "creative",
    i18nKey: "templates.creative",
    descriptionKey: "templates.creativeHint",
    tier: "premium",
    layout: "modern",
  },
  {
    id: "compact",
    i18nKey: "templates.compact",
    descriptionKey: "templates.compactHint",
    tier: "premium",
    layout: "classic",
  },
  {
    id: "elegant",
    i18nKey: "templates.elegant",
    descriptionKey: "templates.elegantHint",
    tier: "premium",
    layout: "minimal",
  },
  {
    id: "bold",
    i18nKey: "templates.bold",
    descriptionKey: "templates.boldHint",
    tier: "premium",
    layout: "modern",
  },
  {
    id: "stripe",
    i18nKey: "templates.stripe",
    descriptionKey: "templates.stripeHint",
    tier: "premium",
    layout: "classic",
  },
  {
    id: "ats",
    i18nKey: "templates.ats",
    descriptionKey: "templates.atsHint",
    tier: "premium",
    layout: "classic",
  },
];

export const FREE_TEMPLATE_IDS = RESUME_TEMPLATES.filter(
  (t) => t.tier === "free",
).map((t) => t.id) as readonly ResumeTemplateId[];

export const DEFAULT_TEMPLATE_ID: ResumeTemplateId = "classic";

const VALID_IDS = new Set(RESUME_TEMPLATES.map((t) => t.id));

export function normalizeTemplateId(
  value: string | undefined | null,
): ResumeTemplateId {
  if (value && VALID_IDS.has(value as ResumeTemplateId)) {
    return value as ResumeTemplateId;
  }
  return DEFAULT_TEMPLATE_ID;
}

export function getTemplateMeta(id: ResumeTemplateId): ResumeTemplateMeta {
  return (
    RESUME_TEMPLATES.find((t) => t.id === id) ??
    RESUME_TEMPLATES[0]!
  );
}

export function isFreeTemplate(id: ResumeTemplateId): boolean {
  return getTemplateMeta(id).tier === "free";
}

export function getPdfLayoutFamily(
  id: ResumeTemplateId,
): "classic" | "modern" | "minimal" {
  return getTemplateMeta(id).layout;
}

/** Free kullanıcı premium şablonda ise klasik'e düşür */
export function coerceTemplateForPlan(
  templateId: ResumeTemplateId,
  planInfo: PlanInfo,
): ResumeTemplateId {
  if (hasPaidAccess(planInfo)) return templateId;
  return isFreeTemplate(templateId) ? templateId : DEFAULT_TEMPLATE_ID;
}
