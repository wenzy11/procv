"use client";

import * as React from "react";
import { Lock, LayoutTemplate } from "lucide-react";

import {
  RESUME_TEMPLATES,
  normalizeTemplateId,
} from "@/lib/templates";
import { useResumeStore } from "@/store/resume-store";
import { useT } from "@/components/providers/i18n-provider";
import { useEntitlements } from "@/components/billing/use-entitlements";
import { useUpgradePrompt } from "@/components/billing/upgrade-prompt";
import type { ResumeTemplateId } from "@/lib/types";
import { cn } from "@/lib/cn";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export function TemplatePicker() {
  const t = useT();
  const { prompt } = useUpgradePrompt();
  const { canUseTemplate } = useEntitlements();
  const resume = useResumeStore((s) => s.resume);
  const setTemplateId = useResumeStore((s) => s.setTemplateId);
  const [open, setOpen] = React.useState(false);

  if (!resume) return null;

  const active = normalizeTemplateId(resume.templateId);

  function selectTemplate(id: ResumeTemplateId) {
    if (!canUseTemplate(id)) {
      prompt("premium_templates");
      return;
    }
    setTemplateId(id);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-2xs">
          <LayoutTemplate className="h-3.5 w-3.5" />
          {t("templates.label")}
          <span className="text-ink-tertiary">
            · {t(RESUME_TEMPLATES.find((x) => x.id === active)?.i18nKey ?? "templates.classic")}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <h2 className="text-lg font-semibold text-ink-primary">
            {t("templates.chooseTitle")}
          </h2>
          <p className="text-xs text-ink-tertiary">{t("templates.chooseHint")}</p>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {RESUME_TEMPLATES.map((tpl) => {
            const locked = !canUseTemplate(tpl.id);
            const isActive = active === tpl.id;

            return (
              <button
                key={tpl.id}
                type="button"
                title={t(tpl.descriptionKey)}
                onClick={() => selectTemplate(tpl.id)}
                className={cn(
                  "relative flex flex-col items-start rounded-xl border p-3 text-left transition-all",
                  isActive
                    ? "border-violet-400/50 bg-violet-500/10 ring-1 ring-violet-400/30"
                    : "border-white/[0.08] bg-white/[0.02] hover:border-white/[0.14] hover:bg-white/[0.04]",
                  locked && "opacity-90",
                )}
              >
                <div
                  className={cn(
                    "mb-2 h-14 w-full rounded-md border border-white/[0.06]",
                    tpl.layout === "modern" && "bg-gradient-to-br from-indigo-50 to-white",
                    tpl.layout === "minimal" && "bg-zinc-50",
                    tpl.layout === "classic" && "bg-white",
                    tpl.id === "stripe" && "border-l-4 border-l-sky-500",
                    tpl.id === "bold" && "bg-rose-50/50",
                    tpl.id === "ats" && "bg-zinc-100",
                  )}
                />
                <span className="text-xs font-medium text-ink-primary">
                  {t(tpl.i18nKey)}
                </span>
                {tpl.tier === "free" ? (
                  <Badge tone="accent" size="sm" className="mt-1.5">
                    {t("templates.freeBadge")}
                  </Badge>
                ) : locked ? (
                  <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] text-ink-tertiary">
                    <Lock className="h-3 w-3" />
                    {t("templates.proBadge")}
                  </span>
                ) : (
                  <Badge tone="violet" size="sm" className="mt-1.5">
                    Pro
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
