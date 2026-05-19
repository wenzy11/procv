"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { FileSearch, Target } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useResumeStore } from "@/store/resume-store";
import { useI18n, useT } from "@/components/providers/i18n-provider";
import { matchJobDescription } from "@/lib/scoring";
import { cn } from "@/lib/cn";
import { translateMatchCategory } from "@/lib/i18n/match-category";
import type { KeywordMatchResult } from "@/lib/types";

/**
 * Job-description matching widget. Calls `/api/ai/match` with the current
 * résumé + pasted JD; renders match strength, keyword chips, and a
 * per-category bar chart.
 */
export function JobMatchPanel() {
  const t = useT();
  const { locale } = useI18n();
  const resume = useResumeStore((s) => s.resume);
  const jd = useResumeStore((s) => s.jobDescription);
  const setJD = useResumeStore((s) => s.setJobDescription);

  const [result, setResult] = React.useState<KeywordMatchResult | null>(null);
  const [loading, setLoading] = React.useState(false);

  const hasJD = jd.trim().length > 24;

  const runMatch = async () => {
    if (!resume) return;
    if (!hasJD) {
      toast.warning(t("match.paste"));
      return;
    }
    setLoading(true);
    try {
      const res = await matchJobDescription(resume, jd, locale);
      setResult(res);
      toast.success(t("match.successToast", { value: res.strength }), {
        description:
          res.missing.length === 0
            ? t("match.aligned")
            : t("match.consider", {
                keywords: res.missing.slice(0, 3).join(", "),
              }),
      });
    } catch (err) {
      toast.error(t("ats.failed"), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card glass className="overflow-hidden">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-3.5 w-3.5 text-accent-400" />
              {t("match.title")}
            </CardTitle>
            <p className="text-xs text-ink-tertiary">{t("match.hint")}</p>
          </div>
          <Badge tone={result ? "accent" : "neutral"} size="sm">
            {result
              ? t("match.matchPct", { value: result.strength })
              : t("match.awaiting")}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div>
          <label
            htmlFor="jd-textarea"
            className="mb-2 inline-block text-xs font-medium uppercase tracking-[0.08em] text-ink-tertiary"
          >
            {t("match.jdLabel")}
          </label>
          <Textarea
            id="jd-textarea"
            rows={5}
            value={jd}
            onChange={(e) => setJD(e.target.value)}
            placeholder={t("match.jdPlaceholder")}
          />
          <div className="mt-3 flex items-center justify-between">
            <span className="text-2xs text-ink-tertiary">
              {t("match.counter", {
                chars: jd.length,
                words: jd.split(/\s+/).filter(Boolean).length,
              })}
            </span>
            <Button
              variant="primary"
              size="sm"
              onClick={runMatch}
              loading={loading}
              disabled={!resume}
            >
              <FileSearch className="h-3.5 w-3.5" />
              {t("match.run")}
            </Button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {loading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-40 w-full" />
            </motion.div>
          ) : result ? (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.2, 0.7, 0.2, 1] }}
              className="space-y-4"
            >
              <StrengthBar strength={result.strength} />

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <KeywordList
                  title={t("match.matching")}
                  count={result.matched.length}
                  tone="success"
                  words={result.matched}
                />
                <KeywordList
                  title={t("match.missing")}
                  count={result.missing.length}
                  tone="warning"
                  words={result.missing}
                />
              </div>

              <CategoryChart data={result.categories} />
            </motion.div>
          ) : (
            <motion.p
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="rounded-md border border-dashed border-white/[0.08] bg-white/[0.02] px-3 py-6 text-center text-xs text-ink-tertiary"
            >
              {t("match.needsContent")}
            </motion.p>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}

function StrengthBar({ strength }: { strength: number }) {
  const t = useT();
  return (
    <div className="rounded-md border border-white/[0.06] bg-white/[0.03] p-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium text-ink-secondary">
          {t("match.strength")}
        </span>
        <span className="tabular-nums font-semibold text-ink-primary">
          {strength}%
        </span>
      </div>
      <div className="relative mt-2 h-2 overflow-hidden rounded-full bg-white/[0.05]">
        <motion.span
          initial={{ width: 0 }}
          animate={{ width: `${strength}%` }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-y-0 left-0 rounded-full bg-brand-gradient shadow-[0_0_16px_-2px_rgba(129,140,248,0.7)]"
        />
      </div>
    </div>
  );
}

function KeywordList({
  title,
  count,
  tone,
  words,
}: {
  title: string;
  count: number;
  tone: "success" | "warning";
  words: string[];
}) {
  const t = useT();
  return (
    <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-2xs font-semibold uppercase tracking-[0.12em] text-ink-tertiary">
          {title}
        </span>
        <Badge tone={tone} size="sm">
          {count}
        </Badge>
      </div>
      {words.length === 0 ? (
        <p className="text-xs text-ink-muted">{t("match.none")}</p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {words.map((w) => (
            <span
              key={w}
              className={cn(
                "inline-flex items-center rounded-full border px-2 py-0.5 text-2xs font-medium",
                tone === "success"
                  ? "border-state-success/30 bg-state-success/10 text-state-success shadow-[0_0_10px_-3px_rgba(34,197,94,0.55)]"
                  : "border-state-warn/30 bg-state-warn/10 text-state-warn",
              )}
            >
              {w}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryChart({
  data,
}: {
  data: KeywordMatchResult["categories"];
}) {
  const t = useT();
  if (data.length === 0) return null;

  const chartData = data.map((d) => ({
    category: translateMatchCategory(d.name, t),
    [t("match.matching")]: d.matched,
    [t("match.missing")]: d.missing,
  }));

  return (
    <div className="rounded-md border border-white/[0.06] bg-white/[0.02] p-3">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-2xs font-semibold uppercase tracking-[0.12em] text-ink-tertiary">
          {t("match.categories")}
        </span>
      </div>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} barGap={4}>
            <defs>
              <linearGradient id="bar-matched" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#10b981" stopOpacity={0.55} />
              </linearGradient>
              <linearGradient id="bar-missing" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.9} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.45} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="category"
              tick={{ fill: "#71717a", fontSize: 10 }}
              tickLine={false}
              axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
            />
            <YAxis
              tick={{ fill: "#52525b", fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              width={24}
              allowDecimals={false}
            />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.04)" }}
              contentStyle={{
                background: "#13131a",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 8,
                fontSize: 12,
                color: "#f4f4f5",
              }}
              labelStyle={{ color: "#a1a1aa", fontSize: 11 }}
            />
            <Bar dataKey={t("match.matching")} radius={[4, 4, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill="url(#bar-matched)" />
              ))}
            </Bar>
            <Bar dataKey={t("match.missing")} radius={[4, 4, 0, 0]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill="url(#bar-missing)" />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
