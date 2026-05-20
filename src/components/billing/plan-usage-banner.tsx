"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";

import { useEntitlements } from "@/components/billing/use-entitlements";
import { useT } from "@/components/providers/i18n-provider";

export function PlanUsageBanner() {
  const t = useT();
  const { isPro, atsRemaining, resumeRemaining, ent } = useEntitlements();

  if (isPro) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-violet-500/20 bg-violet-500/10 px-4 py-3 text-sm">
      <div className="flex items-start gap-2 text-ink-secondary">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-violet-400" />
        <p className="text-xs leading-relaxed">
          {t("upgrade.freeBanner", {
            ats: atsRemaining,
            atsLimit: ent.atsPerMonth,
            resumes: resumeRemaining,
            resumeLimit: ent.maxResumes,
          })}
        </p>
      </div>
      <Link
        href="/plans"
        className="shrink-0 rounded-md bg-brand-gradient px-3 py-1.5 text-xs font-medium text-white shadow-glow"
      >
        {t("upgrade.cta")}
      </Link>
    </div>
  );
}
