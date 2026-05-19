"use client";

import { RESUME_TEMPLATES } from "@/lib/templates";
import { useResumeStore } from "@/store/resume-store";
import { useT } from "@/components/providers/i18n-provider";
import { normalizeTemplateId } from "@/lib/templates";
import type { ResumeTemplateId } from "@/lib/types";
import { cn } from "@/lib/cn";

export function TemplatePicker() {
  const t = useT();
  const resume = useResumeStore((s) => s.resume);
  const setTemplateId = useResumeStore((s) => s.setTemplateId);

  if (!resume) return null;

  const active = normalizeTemplateId(resume.templateId);

  return (
    <div className="flex items-center gap-1.5">
      <span className="hidden text-2xs text-ink-tertiary sm:inline">
        {t("preview.template")}
      </span>
      <div className="flex rounded-md border border-white/[0.06] bg-white/[0.02] p-0.5">
        {RESUME_TEMPLATES.map((tpl) => (
          <button
            key={tpl.id}
            type="button"
            title={t(tpl.descriptionKey)}
            onClick={() => setTemplateId(tpl.id as ResumeTemplateId)}
            className={cn(
              "rounded-[5px] px-2 py-1 text-2xs font-medium transition-colors",
              active === tpl.id
                ? "bg-white/[0.08] text-ink-primary"
                : "text-ink-tertiary hover:text-ink-primary",
            )}
          >
            {t(tpl.i18nKey)}
          </button>
        ))}
      </div>
    </div>
  );
}
