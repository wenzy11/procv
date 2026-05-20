"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { JobMatchPanel } from "@/components/ats/job-match-panel";
import { CoverLetterPanel } from "@/components/ats/cover-letter-panel";
import { ATSPanel } from "@/components/ats/ats-panel";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/components/providers/auth-provider";
import { toast } from "sonner";
import { useT } from "@/components/providers/i18n-provider";
import { useResumeStore } from "@/store/resume-store";
import { listResumes, subscribeToResume } from "@/lib/firebase/resumes";
import type { ResumeDocument } from "@/lib/types";

export default function JobMatchingPage() {
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
  const router = useRouter();
  const { user } = useAuth();
  const hydrate = useResumeStore((s) => s.hydrate);
  const replaceResume = useResumeStore((s) => s.replaceResume);
  const reset = useResumeStore((s) => s.reset);
  const resume = useResumeStore((s) => s.resume);

  const [resumes, setResumes] = React.useState<ResumeDocument[] | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);

  // Pull the user's résumé list to drive the selector.
  React.useEffect(() => {
    if (!user) return;
    listResumes(user.uid)
      .then((list) => {
        setResumes(list);
        const first = list[0];
        if (first) setSelectedId((cur) => cur ?? first.id);
      })
      .catch(() => setResumes([]));
  }, [user]);

  // Live subscribe to the selected résumé. Same pattern as /editor/[id]:
  // hydrate on first snapshot, replace on subsequent ones (preserves any
  // pasted job-description text and other transient UI state).
  React.useEffect(() => {
    if (!user || !selectedId) return;
    let firstLoad = true;
    const unsub = subscribeToResume(user.uid, selectedId, (r) => {
      if (!r) return;
      if (firstLoad) {
        hydrate(user.uid, r);
        firstLoad = false;
      } else {
        const state = useResumeStore.getState();
        if (!state.dirty) {
          replaceResume(r);
        } else if (state.resume && r.updatedAt > state.resume.updatedAt) {
          toast.warning(t("editor.remoteNewer"), {
            description: t("editor.remoteNewerHint"),
          });
        }
      }
    });
    return () => {
      unsub();
      reset();
    };
  }, [user, selectedId, hydrate, replaceResume, reset]);

  if (resumes === null) {
    return (
      <div className="mx-auto max-w-[1600px] px-5 py-6">
        <Skeleton className="h-24 w-full rounded-xl" />
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]">
          <Skeleton className="h-96 w-full rounded-lg" />
          <Skeleton className="h-96 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  if (resumes.length === 0) {
    return (
      <div className="mx-auto max-w-[1600px] px-5 py-6">
        <Card glass>
          <CardContent className="py-12 text-center">
            <h2 className="text-lg font-semibold">{t("dashboard.emptyTitle")}</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-ink-secondary">
              {t("dashboard.emptyHint")}
            </p>
            <Button asChild variant="neon" size="md" className="mt-5">
              <Link href="/dashboard">{t("dashboard.createFirst")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[1600px] px-5 py-6">
      <header className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-2xs font-medium uppercase tracking-[0.14em] text-accent-300">
            ProCV
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            {t("match.title")}
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-ink-secondary">
            {t("match.hint")}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-2xs uppercase tracking-[0.12em] text-ink-tertiary">
            {t("nav.cvs")}
          </label>
          <select
            value={selectedId ?? ""}
            onChange={(e) => setSelectedId(e.target.value)}
            className="rounded-md border border-white/[0.06] bg-surface-card px-3 py-2 text-sm text-ink-primary focus:outline-none focus:ring-2 focus:ring-accent-400/40"
          >
            {resumes.map((r) => (
              <option key={r.id} value={r.id}>
                {r.title || t("editor.titlePlaceholder")}
              </option>
            ))}
          </select>
          {resume ? (
            <Badge tone="accent" size="sm">
              {resume.personal.fullName || resume.title}
            </Badge>
          ) : null}
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(360px,400px)]">
        <div className="space-y-4">
          <JobMatchPanel />
          <CoverLetterPanel />
        </div>
        <ATSPanel />
      </div>
    </div>
  );
}
