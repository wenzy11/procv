import type { ResumeTemplateId } from "@/lib/types";

export interface ResumeTemplateMeta {
  id: ResumeTemplateId;
  i18nKey: string;
  descriptionKey: string;
}

export const RESUME_TEMPLATES: ResumeTemplateMeta[] = [
  {
    id: "classic",
    i18nKey: "templates.classic",
    descriptionKey: "templates.classicHint",
  },
  {
    id: "modern",
    i18nKey: "templates.modern",
    descriptionKey: "templates.modernHint",
  },
  {
    id: "minimal",
    i18nKey: "templates.minimal",
    descriptionKey: "templates.minimalHint",
  },
];

export const DEFAULT_TEMPLATE_ID: ResumeTemplateId = "classic";

export function normalizeTemplateId(
  value: string | undefined | null,
): ResumeTemplateId {
  if (value === "modern" || value === "minimal" || value === "classic") {
    return value;
  }
  return DEFAULT_TEMPLATE_ID;
}
