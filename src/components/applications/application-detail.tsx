"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, Save, Sparkles, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
} from "@/components/ui/dialog";
import { useT } from "@/components/providers/i18n-provider";
import { updateApplication, deleteApplication } from "@/lib/firebase/applications";
import type { ApplicationStatus, JobApplication, ResumeDocument } from "@/lib/types";

const STATUSES: ApplicationStatus[] = [
  "saved",
  "applied",
  "interview",
  "offer",
  "rejected",
];

export function ApplicationDetailDialog({
  app,
  uid,
  resumes,
  open,
  onOpenChange,
  onUpdated,
  onDeleted,
}: {
  app: JobApplication | null;
  uid: string;
  resumes: ResumeDocument[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: (app: JobApplication) => void;
  onDeleted: () => void;
}) {
  const t = useT();
  const router = useRouter();
  const [saving, setSaving] = React.useState(false);
  const [form, setForm] = React.useState<Partial<JobApplication>>({});

  React.useEffect(() => {
    if (!app) return;
    setForm({
      company: app.company,
      role: app.role,
      location: app.location ?? "",
      url: app.url ?? "",
      status: app.status,
      resumeId: app.resumeId,
      jobDescription: app.jobDescription ?? "",
      notes: app.notes ?? "",
      coverLetter: app.coverLetter ?? "",
      matchStrength: app.matchStrength,
    });
  }, [app]);

  if (!app) return null;

  const patch = (key: keyof JobApplication, value: string | number | undefined) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const resume = resumes.find((r) => r.id === form.resumeId);
      const payload = {
        company: form.company,
        role: form.role,
        location: form.location,
        url: form.url,
        status: form.status,
        resumeId: form.resumeId,
        resumeTitle: resume?.title,
        jobDescription: form.jobDescription,
        notes: form.notes,
        coverLetter: form.coverLetter,
        matchStrength: form.matchStrength,
        appliedAt:
          form.status === "applied" && !app.appliedAt
            ? new Date().toISOString().slice(0, 10)
            : app.appliedAt,
      };
      await updateApplication(uid, app.id, payload);
      onUpdated({
        ...app,
        company: payload.company ?? app.company,
        role: payload.role ?? app.role,
        location: payload.location,
        url: payload.url,
        status: payload.status ?? app.status,
        resumeId: payload.resumeId,
        resumeTitle: payload.resumeTitle,
        jobDescription: payload.jobDescription,
        notes: payload.notes,
        coverLetter: payload.coverLetter,
        matchStrength: payload.matchStrength,
        appliedAt: payload.appliedAt,
        updatedAt: new Date().toISOString(),
      });
      toast.success(t("common.saved"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const openMatch = () => {
    const params = new URLSearchParams({
      applicationId: app.id,
      company: form.company ?? app.company,
      role: form.role ?? app.role,
    });
    if (form.resumeId) params.set("resumeId", form.resumeId);
    router.push(`/job-matching?${params.toString()}`);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <h2 className="text-lg font-semibold text-ink-primary">
            {app.company} — {app.role}
          </h2>
        </DialogHeader>

        <div className="space-y-4 px-4 pb-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={t("applications.company")}>
              <Input
                value={form.company ?? ""}
                onChange={(e) => patch("company", e.target.value)}
              />
            </Field>
            <Field label={t("applications.role")}>
              <Input
                value={form.role ?? ""}
                onChange={(e) => patch("role", e.target.value)}
              />
            </Field>
            <Field label={t("applications.location")}>
              <Input
                value={form.location ?? ""}
                onChange={(e) => patch("location", e.target.value)}
                placeholder={t("applications.locationPlaceholder")}
              />
            </Field>
            <Field label={t("applications.url")}>
              <Input
                value={form.url ?? ""}
                onChange={(e) => patch("url", e.target.value)}
                placeholder="https://…"
              />
            </Field>
          </div>

          <Field label={t("applications.statusLabel")}>
            <select
              value={form.status ?? "saved"}
              onChange={(e) =>
                patch("status", e.target.value as ApplicationStatus)
              }
              className="w-full rounded-md border border-white/[0.06] bg-surface-card px-3 py-2 text-sm"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {t(`applications.status.${s}`)}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t("nav.cvs")}>
            <select
              value={form.resumeId ?? ""}
              onChange={(e) => patch("resumeId", e.target.value || undefined)}
              className="w-full rounded-md border border-white/[0.06] bg-surface-card px-3 py-2 text-sm"
            >
              <option value="">{t("applications.noResume")}</option>
              {resumes.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t("match.jdLabel")}>
            <Textarea
              rows={5}
              value={form.jobDescription ?? ""}
              onChange={(e) => patch("jobDescription", e.target.value)}
              placeholder={t("match.jdPlaceholder")}
            />
          </Field>

          <Field label={t("applications.notes")}>
            <Textarea
              rows={3}
              value={form.notes ?? ""}
              onChange={(e) => patch("notes", e.target.value)}
              placeholder={t("applications.notesPlaceholder")}
            />
          </Field>

          <Field label={t("coverLetter.title")}>
            <Textarea
              rows={8}
              value={form.coverLetter ?? ""}
              onChange={(e) => patch("coverLetter", e.target.value)}
              placeholder={t("coverLetter.empty")}
              className="font-serif text-sm leading-relaxed"
            />
          </Field>

          {form.url ? (
            <a
              href={form.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-accent-300 hover:underline"
            >
              {t("applications.viewPosting")}
              <ExternalLink className="h-3 w-3" />
            </a>
          ) : null}

          <div className="flex flex-wrap gap-2 border-t border-white/[0.06] pt-4">
            <Button variant="neon" size="sm" loading={saving} onClick={() => void save()}>
              <Save className="h-3.5 w-3.5" />
              {t("common.save")}
            </Button>
            <Button variant="secondary" size="sm" onClick={openMatch}>
              <Sparkles className="h-3.5 w-3.5" />
              {t("applications.runMatch")}
            </Button>
            {form.resumeId ? (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/editor/${form.resumeId}`}>{t("applications.openCv")}</Link>
              </Button>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto text-state-danger"
              onClick={async () => {
                await deleteApplication(uid, app.id);
                onDeleted();
                onOpenChange(false);
                toast.success(t("applications.deleted"));
              }}
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t("common.delete")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-2xs uppercase tracking-[0.1em] text-ink-tertiary">
        {label}
      </label>
      {children}
    </div>
  );
}
