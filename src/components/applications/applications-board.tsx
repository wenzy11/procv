"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  ExternalLink,
  MoreHorizontal,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/components/providers/auth-provider";
import { useT } from "@/components/providers/i18n-provider";
import {
  createApplication,
  deleteApplication,
  subscribeToApplications,
  updateApplication,
} from "@/lib/firebase/applications";
import { listResumes } from "@/lib/firebase/resumes";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/i18n/format";
import type { ApplicationStatus, JobApplication, ResumeDocument } from "@/lib/types";

const STATUSES: ApplicationStatus[] = [
  "saved",
  "applied",
  "interview",
  "offer",
  "rejected",
];

const STATUS_TONE: Record<
  ApplicationStatus,
  "neutral" | "accent" | "success" | "violet" | "danger"
> = {
  saved: "neutral",
  applied: "accent",
  interview: "violet",
  offer: "success",
  rejected: "danger",
};

export function ApplicationsBoard() {
  const t = useT();
  const router = useRouter();
  const { user } = useAuth();
  const [apps, setApps] = React.useState<JobApplication[] | null>(null);
  const [resumes, setResumes] = React.useState<ResumeDocument[]>([]);
  const [creating, setCreating] = React.useState(false);
  const [selected, setSelected] = React.useState<JobApplication | null>(null);

  const [formCompany, setFormCompany] = React.useState("");
  const [formRole, setFormRole] = React.useState("");

  React.useEffect(() => {
    if (!user) return;
    const unsub = subscribeToApplications(user.uid, setApps, () => setApps([]));
    listResumes(user.uid).then(setResumes).catch(() => setResumes([]));
    return () => unsub();
  }, [user]);

  const handleCreate = async () => {
    if (!user) return;
    if (!formCompany.trim() || !formRole.trim()) {
      toast.warning(t("applications.needFields"));
      return;
    }
    setCreating(true);
    try {
      await createApplication(user.uid, {
        company: formCompany,
        role: formRole,
        resumeId: resumes[0]?.id,
        resumeTitle: resumes[0]?.title,
      });
      setFormCompany("");
      setFormRole("");
      toast.success(t("applications.created"));
    } catch (err) {
      toast.error(t("common.error"), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setCreating(false);
    }
  };

  const moveStatus = async (app: JobApplication, status: ApplicationStatus) => {
    if (!user) return;
    try {
      const patch: Partial<JobApplication> = { status };
      if (status === "applied" && !app.appliedAt) {
        patch.appliedAt = new Date().toISOString().slice(0, 10);
      }
      await updateApplication(user.uid, app.id, patch);
      if (selected?.id === app.id) {
        setSelected({ ...app, ...patch });
      }
    } catch {
      toast.error(t("common.error"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    try {
      await deleteApplication(user.uid, id);
      if (selected?.id === id) setSelected(null);
      toast.success(t("applications.deleted"));
    } catch {
      toast.error(t("common.error"));
    }
  };

  if (apps === null) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const byStatus = (status: ApplicationStatus) =>
    apps.filter((a) => a.status === status);

  return (
    <div className="space-y-6">
      <Card glass>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="h-4 w-4 text-accent-400" />
            {t("applications.addNew")}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-2">
            <Input
              value={formCompany}
              onChange={(e) => setFormCompany(e.target.value)}
              placeholder={t("applications.companyPlaceholder")}
            />
            <Input
              value={formRole}
              onChange={(e) => setFormRole(e.target.value)}
              placeholder={t("applications.rolePlaceholder")}
            />
          </div>
          <Button variant="neon" onClick={handleCreate} loading={creating}>
            <Plus className="h-4 w-4" />
            {t("applications.add")}
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {STATUSES.map((status) => (
          <StatusColumn
            key={status}
            status={status}
            apps={byStatus(status)}
            onOpen={setSelected}
            onMove={moveStatus}
            onDelete={handleDelete}
          />
        ))}
      </div>

      <ApplicationDetailDialog
        app={selected}
        resumes={resumes}
        open={!!selected}
        onOpenChange={(open) => !open && setSelected(null)}
        onSave={async (patch) => {
          if (!user || !selected) return;
          await updateApplication(user.uid, selected.id, patch);
          setSelected({ ...selected, ...patch });
          toast.success(t("common.saved"));
        }}
        onMatch={() => router.push("/job-matching")}
      />
    </div>
  );
}

function StatusColumn({
  status,
  apps,
  onOpen,
  onMove,
  onDelete,
}: {
  status: ApplicationStatus;
  apps: JobApplication[];
  onOpen: (app: JobApplication) => void;
  onMove: (app: JobApplication, status: ApplicationStatus) => void;
  onDelete: (id: string) => void;
}) {
  const t = useT();

  return (
    <div className="flex min-h-[200px] flex-col rounded-lg border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2.5">
        <span className="text-2xs font-semibold uppercase tracking-[0.12em] text-ink-tertiary">
          {t(`applications.status.${status}`)}
        </span>
        <Badge tone={STATUS_TONE[status]} size="sm">
          {apps.length}
        </Badge>
      </div>
      <ul className="flex flex-1 flex-col gap-2 p-2">
        {apps.length === 0 ? (
          <li className="px-2 py-6 text-center text-2xs text-ink-muted">
            {t("applications.columnEmpty")}
          </li>
        ) : (
          apps.map((app) => (
            <li key={app.id}>
              <button
                type="button"
                onClick={() => onOpen(app)}
                className={cn(
                  "w-full rounded-md border border-white/[0.06] bg-surface-card p-3 text-left transition-colors",
                  "hover:border-white/[0.12] hover:bg-white/[0.04]",
                )}
              >
                <p className="text-sm font-medium text-ink-primary">{app.company}</p>
                <p className="mt-0.5 text-xs text-ink-secondary">{app.role}</p>
                {typeof app.matchStrength === "number" ? (
                  <p className="mt-2 text-2xs text-accent-300">
                    {t("applications.matchBadge", { value: app.matchStrength })}
                  </p>
                ) : null}
                <p className="mt-1 text-2xs text-ink-muted">
                  {formatRelative(t, app.updatedAt)}
                </p>
              </button>
              <div className="mt-1 flex justify-end gap-1 px-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-7 px-2">
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {STATUSES.filter((s) => s !== app.status).map((s) => (
                      <DropdownMenuItem
                        key={s}
                        onSelect={() => onMove(app, s)}
                      >
                        {t(`applications.moveTo`, {
                          status: t(`applications.status.${s}`),
                        })}
                      </DropdownMenuItem>
                    ))}
                    <DropdownMenuItem
                      className="text-state-danger"
                      onSelect={() => onDelete(app.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {t("common.delete")}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function ApplicationDetailDialog({
  app,
  resumes,
  open,
  onOpenChange,
  onSave,
  onMatch,
}: {
  app: JobApplication | null;
  resumes: ResumeDocument[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (patch: Partial<JobApplication>) => Promise<void>;
  onMatch: () => void;
}) {
  const t = useT();
  const [notes, setNotes] = React.useState("");
  const [resumeId, setResumeId] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!app) return;
    setNotes(app.notes ?? "");
    setResumeId(app.resumeId ?? "");
  }, [app]);

  if (!app) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <h2 className="text-base font-semibold text-ink-primary">
            {app.company} — {app.role}
          </h2>
        </DialogHeader>
        <div className="space-y-4">
          {app.url ? (
            <a
              href={app.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-accent-300 hover:underline"
            >
              {t("applications.viewPosting")}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}

          <div>
            <label className="mb-1 block text-2xs uppercase tracking-[0.1em] text-ink-tertiary">
              {t("nav.cvs")}
            </label>
            <select
              value={resumeId}
              onChange={(e) => setResumeId(e.target.value)}
              className="w-full rounded-md border border-white/[0.06] bg-surface-card px-3 py-2 text-sm"
            >
              <option value="">{t("applications.noResume")}</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-2xs uppercase tracking-[0.1em] text-ink-tertiary">
              {t("applications.notes")}
            </label>
            <Textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("applications.notesPlaceholder")}
            />
          </div>

          {app.coverLetter ? (
            <div>
              <p className="mb-1 text-2xs uppercase tracking-[0.1em] text-ink-tertiary">
                {t("coverLetter.title")}
              </p>
              <p className="max-h-32 overflow-y-auto whitespace-pre-wrap rounded-md border border-white/[0.06] bg-white/[0.02] p-3 text-xs text-ink-secondary">
                {app.coverLetter.slice(0, 400)}
                {app.coverLetter.length > 400 ? "…" : ""}
              </p>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              size="sm"
              loading={saving}
              onClick={async () => {
                setSaving(true);
                const r = resumes.find((x) => x.id === resumeId);
                await onSave({
                  notes,
                  resumeId: resumeId || undefined,
                  resumeTitle: r?.title,
                });
                setSaving(false);
              }}
            >
              {t("common.save")}
            </Button>
            <Button variant="neon" size="sm" asChild>
              <Link href={`/editor/${app.resumeId || resumes[0]?.id || ""}`}>
                {t("applications.openCv")}
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={onMatch}>
              {t("applications.runMatch")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
