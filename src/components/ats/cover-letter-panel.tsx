"use client";

import * as React from "react";
import { Copy, FileSignature, RefreshCw, Save } from "lucide-react";
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
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n, useT } from "@/components/providers/i18n-provider";
import { useEntitlements } from "@/components/billing/use-entitlements";
import { useUpgradePrompt } from "@/components/billing/upgrade-prompt";
import { generateCoverLetter } from "@/lib/scoring";
import { updateApplication } from "@/lib/firebase/applications";

const TONES = ["professional", "enthusiastic", "concise"] as const;

export function CoverLetterPanel({
  company: companyProp,
  role: roleProp,
  applicationId,
  initialLetter,
}: {
  company?: string;
  role?: string;
  applicationId?: string;
  initialLetter?: string;
}) {
  const t = useT();
  const { locale } = useI18n();
  const { user } = useAuth();
  const resume = useResumeStore((s) => s.resume);
  const jd = useResumeStore((s) => s.jobDescription);
  const { canUse } = useEntitlements();
  const { prompt } = useUpgradePrompt();

  const [company, setCompany] = React.useState(companyProp ?? "");
  const [role, setRole] = React.useState(roleProp ?? "");
  const [tone, setTone] = React.useState<(typeof TONES)[number]>("professional");
  const [letter, setLetter] = React.useState(initialLetter ?? "");
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (companyProp) setCompany(companyProp);
  }, [companyProp]);
  React.useEffect(() => {
    if (roleProp) setRole(roleProp);
  }, [roleProp]);
  React.useEffect(() => {
    if (initialLetter) setLetter(initialLetter);
  }, [initialLetter]);

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
        tone: t(`coverLetter.tones.${tone}`),
      });
      setLetter(text);
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

  const saveToApplication = async () => {
    if (!user || !applicationId || !letter.trim()) return;
    setSaving(true);
    try {
      await updateApplication(user.uid, applicationId, {
        coverLetter: letter,
        company: company.trim(),
        role: role.trim(),
        jobDescription: jd,
      });
      toast.success(t("coverLetter.savedToApp"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setSaving(false);
    }
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
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="sm:col-span-1">
            <label className="mb-1 block text-2xs uppercase tracking-[0.1em] text-ink-tertiary">
              {t("applications.company")}
            </label>
            <Input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder={t("applications.companyPlaceholder")}
            />
          </div>
          <div className="sm:col-span-1">
            <label className="mb-1 block text-2xs uppercase tracking-[0.1em] text-ink-tertiary">
              {t("applications.role")}
            </label>
            <Input
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder={t("applications.rolePlaceholder")}
            />
          </div>
          <div className="sm:col-span-1">
            <label className="mb-1 block text-2xs uppercase tracking-[0.1em] text-ink-tertiary">
              {t("coverLetter.toneLabel")}
            </label>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as (typeof TONES)[number])}
              className="w-full rounded-md border border-white/[0.06] bg-surface-card px-3 py-2 text-sm"
            >
              {TONES.map((tk) => (
                <option key={tk} value={tk}>
                  {t(`coverLetter.tones.${tk}`)}
                </option>
              ))}
            </select>
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
              {applicationId ? (
                <Button
                  variant="ghost"
                  size="sm"
                  loading={saving}
                  onClick={() => void saveToApplication()}
                >
                  <Save className="h-3.5 w-3.5" />
                  {t("coverLetter.saveToApp")}
                </Button>
              ) : null}
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
            onChange={(e) => setLetter(e.target.value)}
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
