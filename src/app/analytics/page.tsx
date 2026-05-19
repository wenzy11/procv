"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/auth-provider";
import { useT } from "@/components/providers/i18n-provider";
import { subscribeToResumes } from "@/lib/firebase/resumes";
import { displayScore } from "@/lib/resume-score";
import type { ResumeDocument } from "@/lib/types";

export default function AnalyticsPage() {
  return (
    <AppShell>
      <AuthGuard>
        <Body />
      </AuthGuard>
    </AppShell>
  );
}

function Body() {
  const t = useT();
  const { user } = useAuth();
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

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-6">
      <header className="mb-5">
        <p className="text-2xs font-medium uppercase tracking-[0.14em] text-accent-300">
          ProCV
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight">
          {t("analytics.title")}
        </h1>
        <p className="mt-1 text-sm text-ink-secondary">{t("analytics.hint")}</p>
      </header>

      <StatsGrid />

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <ScoreTrendCard resumes={resumes} />
        <ScoreDistributionCard resumes={resumes} />
      </div>
    </div>
  );
}

function ScoreTrendCard({ resumes }: { resumes: ResumeDocument[] | null }) {
  const t = useT();

  if (resumes === null) {
    return (
      <Card glass>
        <CardHeader>
          <CardTitle>{t("analytics.trend")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (resumes.length === 0) {
    return (
      <Card glass>
        <CardHeader>
          <CardTitle>{t("analytics.trend")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="rounded-md border border-dashed border-white/[0.08] bg-white/[0.02] px-3 py-10 text-center text-xs text-ink-tertiary">
            {t("analytics.empty")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const data = [...resumes]
    .reverse()
    .map((r) => ({
      name: r.title.length > 22 ? r.title.slice(0, 22) + "…" : r.title || "—",
      score: displayScore(r),
    }));

  return (
    <Card glass>
      <CardHeader>
        <CardTitle>{t("analytics.trend")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="atsTrend" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#818cf8" stopOpacity={0.55} />
                  <stop offset="100%" stopColor="#818cf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: "#71717a", fontSize: 10 }}
                tickLine={false}
                axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
              />
              <YAxis
                tick={{ fill: "#52525b", fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                width={28}
                domain={[0, 100]}
              />
              <Tooltip
                cursor={{ stroke: "rgba(255,255,255,0.1)" }}
                contentStyle={{
                  background: "#13131a",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "#f4f4f5",
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#a78bfa"
                strokeWidth={2}
                fill="url(#atsTrend)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

function ScoreDistributionCard({
  resumes,
}: {
  resumes: ResumeDocument[] | null;
}) {
  const t = useT();

  if (resumes === null) {
    return (
      <Card glass>
        <CardHeader>
          <CardTitle>{t("analytics.distribution")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (resumes.length === 0) {
    return (
      <Card glass>
        <CardHeader>
          <CardTitle>{t("analytics.distribution")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="rounded-md border border-dashed border-white/[0.08] bg-white/[0.02] px-3 py-10 text-center text-xs text-ink-tertiary">
            {t("analytics.empty")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const buckets = [
    { range: "0–24", min: 0, max: 24, count: 0, color: "#ef4444" },
    { range: "25–49", min: 25, max: 49, count: 0, color: "#f59e0b" },
    { range: "50–74", min: 50, max: 74, count: 0, color: "#60a5fa" },
    { range: "75–100", min: 75, max: 100, count: 0, color: "#22c55e" },
  ];
  for (const r of resumes) {
    const s = displayScore(r);
    const b = buckets.find((x) => s >= x.min && s <= x.max);
    if (b) b.count++;
  }

  return (
    <Card glass>
      <CardHeader>
        <CardTitle>{t("analytics.distribution")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buckets}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis
                dataKey="range"
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
              />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {buckets.map((b, i) => (
                  <Cell key={i} fill={b.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}

