"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Info,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/cn";

import { useResumeStore } from "@/store/resume-store";
import { useI18n, useT } from "@/components/providers/i18n-provider";
import { contactQuickFixPatch } from "@/lib/ats/contact-quick-fix";
import { analyzeResume } from "@/lib/scoring";
import { ATSGauge } from "./ats-gauge";
import type {
  AISuggestion,
  ATSScore,
  EditorSection,
} from "@/lib/types";

const BREAKDOWN_KEYS: Array<keyof ATSScore["breakdown"]> = [
  "keywordCoverage",
  "formatting",
  "impactLanguage",
  "completeness",
  "readability",
];

function isResumeEmpty(resume: ReturnType<typeof useResumeStore.getState>["resume"]) {
  if (!resume) return true;
  const p = resume.personal;
  const hasText = (
    p.fullName.trim() ||
    p.summary.trim() ||
    p.headline.trim()
  ).length;
  return (
    !hasText &&
    resume.experience.length === 0 &&
    resume.projects.length === 0 &&
    resume.skills.length === 0
  );
}

/**
 * Right-rail ATS panel. Requests `/api/ai/analyze` on demand (and once on
 * mount when the resume has content) and renders the score + suggestions.
 */
export function ATSPanel() {
  const t = useT();
  const { locale } = useI18n();

  const resume = useResumeStore((s) => s.resume);
  const setActiveSection = useResumeStore((s) => s.setActiveSection);
  const setAtsScore = useResumeStore((s) => s.setAtsScore);

  const [score, setScore] = React.useState<ATSScore | null>(null);
  const [suggestions, setSuggestions] = React.useState<AISuggestion[]>([]);
  const [loading, setLoading] = React.useState(false);

  const empty = isResumeEmpty(resume);

  const runAnalysis = React.useCallback(async () => {
    if (!resume) return;
    if (empty) return;
    setLoading(true);
    try {
      const result = await analyzeResume(resume, locale);
      setScore(result.score);
      setSuggestions(result.suggestions);
      setAtsScore(result.score.total);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(
        msg === "EMAIL_NOT_VERIFIED" ? t("errors.emailNotVerified") : t("ats.failed"),
        {
          description:
            msg === "EMAIL_NOT_VERIFIED" ? undefined : msg || undefined,
        },
      );
    } finally {
      setLoading(false);
    }
  }, [resume, empty, locale, t, setAtsScore]);

  // Auto-run once on first meaningful content. Also re-run when the user
  // switches locale so the suggestions appear in the new language without
  // requiring a manual click on "Re-score".
  const didAutoRun = React.useRef(false);
  const lastLocale = React.useRef(locale);
  React.useEffect(() => {
    if (!resume || empty) return;
    if (!didAutoRun.current) {
      didAutoRun.current = true;
      void runAnalysis();
      return;
    }
    if (lastLocale.current !== locale) {
      lastLocale.current = locale;
      void runAnalysis();
    }
  }, [resume, empty, locale, runAnalysis]);

  return (
    <Card glass className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-3.5 w-3.5 text-violet-400" />
              {t("ats.title")}
            </CardTitle>
            <p className="text-xs text-ink-tertiary">{t("ats.hint")}</p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              await runAnalysis();
              if (!empty)
                toast.success(t("ats.reScoredToast"), {
                  description: t("ats.reScoredToastHint"),
                });
            }}
            loading={loading}
            disabled={empty}
          >
            <Wand2 className="h-3.5 w-3.5" />
            {t("ats.reScore")}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-5 pt-1">
        {empty ? (
          <EmptyState />
        ) : (
          <>
            <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-stretch">
              <div className="relative shrink-0">
                {loading || !score ? (
                  <Skeleton className="h-[200px] w-[200px] rounded-full" />
                ) : (
                  <ATSGauge value={score.total} label={t("ats.scoreLabel")} />
                )}
              </div>

              <div className="grid flex-1 grid-cols-1 gap-2.5">
                {BREAKDOWN_KEYS.map((key) => (
                  <BreakdownRow
                    key={key}
                    label={t(`ats.breakdown.${key}`)}
                    value={score?.breakdown[key] ?? 0}
                    loading={loading || !score}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-tertiary">
                  {t("ats.suggestions")}
                </h4>
                <Badge tone="violet" size="sm">
                  {t("ats.insights", { count: suggestions.length })}
                </Badge>
              </div>

              {loading ? (
                <SuggestionsSkeleton />
              ) : suggestions.length === 0 ? (
                <p className="rounded-md border border-dashed border-white/[0.08] bg-white/[0.02] px-3 py-4 text-center text-xs text-ink-tertiary">
                  {t("common.empty")}
                </p>
              ) : (
                <Accordion type="multiple" className="space-y-2">
                  {suggestions.map((s) => (
                    <SuggestionItem
                      key={s.id}
                      suggestion={s}
                      onFocus={() => {
                        const target: EditorSection =
                          s.target === "global" || s.target === "summary"
                            ? "personal"
                            : s.target;
                        setActiveSection(target);
                      }}
                      onReScore={() => void runAnalysis()}
                    />
                  ))}
                </Accordion>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  const t = useT();
  return (
    <div className="rounded-md border border-dashed border-white/[0.08] bg-white/[0.02] px-3 py-6 text-center">
      <p className="text-sm text-ink-secondary">{t("ats.needsContent")}</p>
      <p className="mt-1 text-xs text-ink-tertiary">
        {t("ats.needsContentHint")}
      </p>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  loading,
}: {
  label: string;
  value: number;
  loading?: boolean;
}) {
  const tone =
    value >= 80
      ? "from-emerald-400 to-emerald-500"
      : value >= 60
        ? "from-sky-400 to-violet-500"
        : value >= 40
          ? "from-amber-400 to-orange-500"
          : "from-rose-400 to-rose-500";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="text-ink-secondary">{label}</span>
        {loading ? (
          <Skeleton className="h-3 w-7" />
        ) : (
          <span className="font-medium tabular-nums text-ink-primary">
            {value}
          </span>
        )}
      </div>
      <div className="relative h-1.5 overflow-hidden rounded-full bg-white/[0.05]">
        {!loading ? (
          <motion.span
            initial={{ width: 0 }}
            animate={{ width: `${value}%` }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className={cn(
              "block h-full rounded-full bg-gradient-to-r shadow-[0_0_12px_-2px_rgba(99,102,241,0.5)]",
              tone,
            )}
          />
        ) : null}
      </div>
    </div>
  );
}

function SuggestionsSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-md" />
      ))}
    </div>
  );
}

const SEVERITY_META: Record<
  AISuggestion["severity"],
  {
    icon: React.ComponentType<{ className?: string }>;
    tone: string;
    chip: "danger" | "warning" | "accent";
  }
> = {
  critical: { icon: AlertTriangle, tone: "text-state-danger", chip: "danger" },
  warning: { icon: AlertTriangle, tone: "text-state-warn", chip: "warning" },
  info: { icon: Info, tone: "text-accent-300", chip: "accent" },
};

function SuggestionItem({
  suggestion,
  onFocus,
  onReScore,
}: {
  suggestion: AISuggestion;
  onFocus: () => void;
  onReScore: () => void;
}) {
  const t = useT();
  const resume = useResumeStore((s) => s.resume);
  const updatePersonal = useResumeStore((s) => s.updatePersonal);
  const [guidanceOpen, setGuidanceOpen] = React.useState(false);
  const [autoFixed, setAutoFixed] = React.useState(false);
  const meta = SEVERITY_META[suggestion.severity];
  const Icon = meta.icon;

  const handleGuidance = () => {
    onFocus();
    setGuidanceOpen(true);

    const isContact =
      suggestion.target === "personal" ||
      suggestion.target === "global" ||
      suggestion.target === "summary";

    if (isContact && resume) {
      const patch = contactQuickFixPatch(resume.personal);
      if (patch) {
        updatePersonal(patch);
        setAutoFixed(true);
        onReScore();
      }
    }
  };

  return (
    <AccordionItem value={suggestion.id}>
      <AccordionTrigger>
        <span className="flex items-center gap-2.5">
          <Icon className={cn("h-3.5 w-3.5", meta.tone)} />
          <span className="text-sm text-ink-primary">{suggestion.title}</span>
          <Badge tone={meta.chip} size="sm" className="ml-1">
            {t(`ats.severity.${suggestion.severity}`)}
          </Badge>
        </span>
      </AccordionTrigger>
      <AccordionContent>
        <p className="text-xs leading-relaxed text-ink-secondary">
          {suggestion.description}
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button
            variant={guidanceOpen ? "secondary" : "neon"}
            size="sm"
            onClick={handleGuidance}
          >
            <Zap className="h-3.5 w-3.5" />
            {t("ats.showGuidance")}
          </Button>
          <Button variant="ghost" size="sm" onClick={onFocus}>
            {t("ats.jumpTo")}
          </Button>
        </div>

        {guidanceOpen ? (
          <div
            role="status"
            className="mt-3 space-y-2 rounded-md border border-accent-400/25 bg-accent-500/10 px-3 py-3"
          >
            <p className="text-xs font-semibold text-ink-primary">
              {suggestion.title}
            </p>
            <p className="text-xs leading-relaxed text-ink-secondary">
              {suggestion.description}
            </p>
            {autoFixed ? (
              <p className="text-xs font-medium text-state-success">
                {t("ats.autoFixedHint")}
              </p>
            ) : null}
            <p className="text-2xs leading-relaxed text-ink-tertiary">
              {t("ats.manualFixHint")}
            </p>
          </div>
        ) : null}
      </AccordionContent>
    </AccordionItem>
  );
}
