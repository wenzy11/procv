"use client";

import * as React from "react";
import { Plus, Briefcase } from "lucide-react";
import { toast } from "sonner";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/auth-provider";
import { useT } from "@/components/providers/i18n-provider";
import {
  createApplication,
  subscribeToApplications,
  updateApplication,
} from "@/lib/firebase/applications";
import { listResumes } from "@/lib/firebase/resumes";
import { ApplicationKanban } from "./application-kanban";
import { ApplicationDetailDialog } from "./application-detail";
import type { ApplicationStatus, JobApplication, ResumeDocument } from "@/lib/types";

export function ApplicationsBoard() {
  const t = useT();
  const { user } = useAuth();
  const [apps, setApps] = React.useState<JobApplication[] | null>(null);
  const [resumes, setResumes] = React.useState<ResumeDocument[]>([]);
  const [creating, setCreating] = React.useState(false);
  const [selected, setSelected] = React.useState<JobApplication | null>(null);

  const [formCompany, setFormCompany] = React.useState("");
  const [formRole, setFormRole] = React.useState("");
  const [formUrl, setFormUrl] = React.useState("");

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
        url: formUrl,
        resumeId: resumes[0]?.id,
        resumeTitle: resumes[0]?.title,
      });
      setFormCompany("");
      setFormRole("");
      setFormUrl("");
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
      toast.success(t("applications.statusMoved", {
        status: t(`applications.status.${status}`),
      }));
    } catch {
      toast.error(t("common.error"));
    }
  };

  if (apps === null) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  const counts = {
    total: apps.length,
    active: apps.filter((a) =>
      ["applied", "interview", "offer"].includes(a.status),
    ).length,
    interviews: apps.filter((a) => a.status === "interview").length,
    offers: apps.filter((a) => a.status === "offer").length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MiniStat label={t("applications.statsTotal")} value={counts.total} />
        <MiniStat label={t("applications.statsActive")} value={counts.active} />
        <MiniStat label={t("applications.statsInterviews")} value={counts.interviews} />
        <MiniStat label={t("applications.statsOffers")} value={counts.offers} />
      </div>

      <Card glass>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Briefcase className="h-4 w-4 text-accent-400" />
            {t("applications.addNew")}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
          <Input
            value={formUrl}
            onChange={(e) => setFormUrl(e.target.value)}
            placeholder={t("applications.urlPlaceholder")}
          />
          <Button variant="neon" onClick={handleCreate} loading={creating}>
            <Plus className="h-4 w-4" />
            {t("applications.add")}
          </Button>
        </CardContent>
      </Card>

      <ApplicationKanban
        apps={apps}
        onOpen={setSelected}
        onStatusChange={moveStatus}
      />

      {user ? (
        <ApplicationDetailDialog
          app={selected}
          uid={user.uid}
          resumes={resumes}
          open={!!selected}
          onOpenChange={(open) => !open && setSelected(null)}
          onUpdated={(updated) => {
            setSelected(updated);
            setApps((prev) =>
              prev ? prev.map((a) => (a.id === updated.id ? updated : a)) : prev,
            );
          }}
          onDeleted={() => {
            setApps((prev) =>
              prev ? prev.filter((a) => a.id !== selected?.id) : prev,
            );
            setSelected(null);
          }}
        />
      ) : null}
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-white/[0.02] px-4 py-3">
      <p className="text-2xs uppercase tracking-[0.12em] text-ink-tertiary">{label}</p>
      <p className="mt-1 text-2xl font-semibold tabular-nums text-ink-primary">{value}</p>
    </div>
  );
}
