"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowUpRight, Clock, Copy, FileText, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useEntitlements } from "@/components/billing/use-entitlements";
import { useUpgradePrompt } from "@/components/billing/upgrade-prompt";
import { useAuth } from "@/components/providers/auth-provider";
import { useT } from "@/components/providers/i18n-provider";
import {
  createResume,
  deleteResume,
  duplicateResume,
  subscribeToResumes,
} from "@/lib/firebase/resumes";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/i18n/format";
import { displayScore } from "@/lib/resume-score";
import type { ResumeDocument } from "@/lib/types";

/**
 * Live-updating list of the user's résumés (Firestore `onSnapshot`).
 * Includes the "create new" CTA and per-row delete.
 */
export function ResumeList() {
  const t = useT();
  const router = useRouter();
  const { user } = useAuth();
  const { resumeRemaining, refreshUsage } = useEntitlements();
  const { prompt } = useUpgradePrompt();

  const [resumes, setResumes] = React.useState<ResumeDocument[] | null>(null);
  const [creating, setCreating] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    const unsub = subscribeToResumes(
      user.uid,
      (list) => setResumes(list),
      () => setResumes([]),
    );
    return () => unsub();
  }, [user]);

  const handleCreate = async () => {
    if (!user) return;
    if (resumeRemaining <= 0) {
      prompt("unlimited_resumes");
      return;
    }
    setCreating(true);
    try {
      const id = await createResume(user.uid, user.displayName);
      void refreshUsage();
      router.push(`/editor/${id}`);
    } catch (err) {
      toast.error(t("common.error"), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setCreating(false);
    }
  };

  const handleDuplicate = async (id: string, title: string) => {
    if (!user) return;
    try {
      const copyTitle = `${title}${t("editor.duplicateSuffix")}`;
      const newId = await duplicateResume(user.uid, id, copyTitle);
      toast.success(t("editor.duplicated"));
      router.push(`/editor/${newId}`);
    } catch (err) {
      toast.error(t("common.error"), {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (!window.confirm(t("editor.deleteConfirm"))) return;
    try {
      await deleteResume(user.uid, id);
      toast.success(t("editor.deleted"));
    } catch (err) {
      toast.error(t("common.error"), {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  return (
    <Card glass>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{t("dashboard.myResumes")}</CardTitle>
            <p className="text-xs text-ink-tertiary">
              {t("dashboard.myResumesHint")}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleCreate}
            loading={creating}
          >
            <FileText className="h-3.5 w-3.5" />
            {t("dashboard.newResume")}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {resumes === null ? (
          <ListSkeleton />
        ) : resumes.length === 0 ? (
          <EmptyState onCreate={handleCreate} creating={creating} />
        ) : (
          <ul className="space-y-2">
            {resumes.map((r, idx) => (
              <motion.li
                key={r.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
              >
                <ResumeRow
                  resume={r}
                  onDuplicate={() =>
                    handleDuplicate(r.id, r.title || t("editor.titlePlaceholder"))
                  }
                  onDelete={() => handleDelete(r.id)}
                />
              </motion.li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function ResumeRow({
  resume,
  onDuplicate,
  onDelete,
}: {
  resume: ResumeDocument;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const t = useT();
  const completion = displayScore(resume);

  return (
    <div
      className={cn(
        "group flex items-center justify-between gap-4 rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2.5 transition-colors",
        "hover:border-white/[0.14] hover:bg-white/[0.04]",
      )}
    >
      <Link
        href={`/editor/${resume.id}`}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <CompletionChip value={completion} />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink-primary">
            {resume.title || t("editor.titlePlaceholder")}
          </p>
          <p className="truncate text-xs text-ink-tertiary">
            {resume.personal.headline || t("common.noHeadline")}
          </p>
        </div>
      </Link>
      <div className="flex shrink-0 items-center gap-2">
        <Badge tone="neutral" size="sm">
          {t("common.complete", { value: completion })}
        </Badge>
        <span className="hidden items-center gap-1 text-2xs text-ink-tertiary sm:inline-flex">
          <Clock className="h-3 w-3" />
          {formatRelative(t, resume.updatedAt)}
        </span>
        <button
          type="button"
          onClick={onDuplicate}
          aria-label={t("common.duplicate")}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-tertiary hover:bg-white/[0.06] hover:text-ink-primary"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>
        <Link
          href={`/editor/${resume.id}`}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-tertiary transition-colors hover:bg-white/[0.06] hover:text-ink-primary"
          aria-label={t("common.open")}
        >
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
        <button
          type="button"
          onClick={onDelete}
          aria-label={t("common.delete")}
          className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-tertiary hover:bg-state-danger/10 hover:text-state-danger"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

function CompletionChip({ value }: { value: number }) {
  const tone =
    value >= 80
      ? "from-emerald-400 to-emerald-500 text-emerald-50"
      : value >= 50
        ? "from-sky-400 to-violet-500 text-white"
        : "from-zinc-500 to-zinc-700 text-zinc-100";
  return (
    <span
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-md bg-gradient-to-br text-sm font-semibold tabular-nums shadow-[0_0_18px_-6px_rgba(99,102,241,0.45)]",
        tone,
      )}
    >
      {value}
    </span>
  );
}

function EmptyState({
  onCreate,
  creating,
}: {
  onCreate: () => void;
  creating: boolean;
}) {
  const t = useT();
  return (
    <div className="rounded-lg border border-dashed border-white/[0.1] bg-white/[0.02] p-10 text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-md border border-white/[0.08] bg-white/[0.03]">
        <FileText className="h-5 w-5 text-accent-300" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-ink-primary">
        {t("dashboard.emptyTitle")}
      </h3>
      <p className="mx-auto mt-1 max-w-md text-sm text-ink-secondary">
        {t("dashboard.emptyHint")}
      </p>
      <Button
        variant="neon"
        size="md"
        className="mt-5"
        onClick={onCreate}
        loading={creating}
      >
        <Plus className="h-3.5 w-3.5" />
        {t("dashboard.createFirst")}
      </Button>
    </div>
  );
}

function ListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 3 }).map((_, i) => (
        <Skeleton key={i} className="h-14 w-full rounded-md" />
      ))}
    </div>
  );
}

/**
 * Lightweight client-side completion %.  Mirrors the "completeness" rubric
 * the server-side analyzer uses, so dashboard chips stay roughly aligned
 * with the editor's ATS score without needing an extra round-trip.
 */
