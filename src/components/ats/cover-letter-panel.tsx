"use client";

import * as React from "react";
import { Copy, FileSignature, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useResumeStore } from "@/store/resume-store";
import { useI18n, useT } from "@/components/providers/i18n-provider";
import { useEntitlements } from "@/components/billing/use-entitlements";
import { useUpgradePrompt } from "@/components/billing/upgrade-prompt";
import { generateCoverLetter } from "@/lib/scoring";

export function CoverLetterPanel({
  company: companyProp,
  role: roleProp,
  onLetterChange,
}: {
  company?: string;
  role?: string;
  onLetterChange?: (letter: string) => void;
}) {
  const t = useT();
  const { locale } = useI18n();
  const resume = useResumeStore((s) => s.resume);
  const jd = useResumeStore((s) => s.jobDescription);
  const { canUse } = useEntitlements();
  const { prompt } = useUpgradePrompt();

  const [company, setCompany] = React.useState(companyProp ?? "");
  const [role, setRole] = React.useState(roleProp ?? "");
  const [letter, setLetter] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (companyProp) setCompany(companyProp);
  }, [companyProp]);
  React.useEffect(() => {
    if (roleProp) setRole(roleProp);
  }, [roleProp]);

  const locked = !canUse("job_match");
  const hasJD = jd.trim().length > 24;

  const generate = async () => {
    if (!resume) return;
    if (!hasJD) {
      toast.warning(t("coverLetter.needJd"));
      return;
    }
    if (locked) {
      prompt("job_match");
      return;
    }
    setLoading(true);
    try {
      const text = await generateCoverLetter(resume, jd, locale, {
        company: company.trim() || undefined,
        role: role.trim() || undefined,
      });
      setLetter(text);
      onLetterChange?.(text);
      toast.success(t("coverLetter.ready"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg === "PLAN_UPGRADE_REQUIRED") {
        prompt("job_match");
        return;
      }
      toast.error(t("ats.failed"), { description: msg || undefined });
    } finally {
      setLoading(false);
    }
  };

  const copyLetter = async () => {
    if (!letter.trim()) return;
    await navigator.clipboard.writeText(letter);
    toast.success(t("coverLetter.copied"));
  };

  return (
    <Card glass className="overflow-hidden">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileSignature className="h-3.5 w-3.5 text-violet-400" />
          {t("coverLetter.title")}
        </CardTitle>
        <p className="text-xs text-ink-tertiary">{t("coverLetter.hint")}</p>
        {locked ? (
          <p className="text-2xs text-violet-300/90">{t("upgrade.proOnly")}</p>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-2xs uppercase tracking-[0.1em] text-ink-tertiary">
              {t("applications.company")}
            </label>
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder={t("applications.companyPlaceholder")}
            />
          </div>
          <div>
            <label className="mb-1 block text-2xs uppercase tracking-[0.1em] text-ink-tertiary">
              {t("applications.role")}
            </label>
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder={t("applications.rolePlaceholder")}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant={locked ? "neon" : "primary"}
            size="sm"
            onClick={generate}
            loading={loading && !locked}
            disabled={!resume}
          >
            <FileSignature className="h-3.5 w-3.5" />
            {locked ? t("upgrade.cta") : t("coverLetter.generate")}
          </Button>
          {letter ? (
            <>
              <Button variant="secondary" size="sm" onClick={() => void generate()}>
                <RefreshCw className="h-3.5 w-3.5" />
                {t("coverLetter.regenerate")}
              </Button>
              <Button variant="ghost" size="sm" onClick={() => void copyLetter()}>
                <Copy className="h-3.5 w-3.5" />
                {t("coverLetter.copy")}
              </Button>
            </>
          ) : null}
        </div>

        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : letter ? (
          <Textarea
            rows={12}
            value={letter}
            onChange={(e) => {
              setLetter(e.target.value);
              onLetterChange?.(e.target.value);
            }}
            className="font-serif text-sm leading-relaxed"
          />
        ) : (
          <p className="rounded-md border border-dashed border-white/[0.08] bg-white/[0.02] px-3 py-5 text-center text-xs text-ink-tertiary">
            {t("coverLetter.empty")}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
