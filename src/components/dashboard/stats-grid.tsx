"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  Clock,
  FileText,
  Sparkles,
  Trophy,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/auth-provider";
import { useT } from "@/components/providers/i18n-provider";
import { subscribeToResumes } from "@/lib/firebase/resumes";
import { cn } from "@/lib/cn";
import { formatRelativeShort } from "@/lib/i18n/format";
import { displayScore } from "@/lib/resume-score";
import type { ResumeDocument } from "@/lib/types";

/**
 * Dashboard stats — derived from the user's actual resumes. No demo numbers.
 *
 * `avgScore` / `bestScore` use persisted `lastAtsScore` when available,
 * otherwise the client-side completion heuristic.
 */
interface Stat {
  id: string;
  labelKey: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
}

export function StatsGrid() {
  const { user } = useAuth();
  const t = useT();
  const [resumes, setResumes] = React.useState<ResumeDocument[] | null>(null);

  React.useEffect(() => {
    if (!user) return;
    const unsub = subscribeToResumes(
      user.uid,
      (list) => setResumes(list),
      () => setResumes([]),
    );
    return () => unsub();
  }, [user]);

  const stats: Stat[] = React.useMemo(() => {
    const completions = (resumes ?? []).map(displayScore);
    const avg =
      completions.length === 0
        ? 0
        : Math.round(
            completions.reduce((a, b) => a + b, 0) / completions.length,
          );
    const best = completions.length === 0 ? 0 : Math.max(...completions);
    const lastIso = resumes?.[0]?.updatedAt;
    const lastUpdated = lastIso ? formatRelativeShort(t, lastIso) : "—";

    return [
      {
        id: "count",
        labelKey: "dashboard.stats.resumes",
        value: String(resumes?.length ?? 0),
        icon: FileText,
      },
      {
        id: "avg",
        labelKey: "dashboard.stats.avgScore",
        value: avg ? `${avg}` : "—",
        icon: Sparkles,
      },
      {
        id: "best",
        labelKey: "dashboard.stats.bestScore",
        value: best ? `${best}` : "—",
        icon: Trophy,
      },
      {
        id: "last",
        labelKey: "dashboard.stats.lastUpdated",
        value: lastUpdated,
        icon: Clock,
      },
    ];
  }, [resumes, t]);

  const loading = resumes === null;

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((s, idx) => (
        <motion.div
          key={s.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05, duration: 0.35 }}
        >
          <StatCard stat={s} loading={loading} />
        </motion.div>
      ))}
    </div>
  );
}

function StatCard({ stat, loading }: { stat: Stat; loading: boolean }) {
  const t = useT();
  const Icon = stat.icon;
  return (
    <Card glass className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-brand-gradient-soft blur-2xl"
      />
      <CardContent className="relative">
        <div className="flex items-start justify-between">
          <span
            className={cn(
              "grid h-9 w-9 place-items-center rounded-md border border-white/[0.08] bg-white/[0.03]",
            )}
          >
            <Icon className="h-4 w-4 text-accent-300" />
          </span>
        </div>
        <div className="mt-4">
          <p className="text-2xs uppercase tracking-[0.12em] text-ink-tertiary">
            {t(stat.labelKey)}
          </p>
          {loading ? (
            <Skeleton className="mt-1 h-7 w-16" />
          ) : (
            <p className="mt-1 text-2xl font-semibold tabular-nums text-ink-primary">
              {stat.value}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
