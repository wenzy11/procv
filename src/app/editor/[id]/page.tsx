"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";

import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { EditorFrame } from "@/components/editor/editor-frame";
import { CVPreview } from "@/components/preview/cv-preview";
import { ATSPanel } from "@/components/ats/ats-panel";
import { JobMatchPanel } from "@/components/ats/job-match-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/auth-provider";
import { useT } from "@/components/providers/i18n-provider";
import { useResumeStore } from "@/store/resume-store";
import { subscribeToResume } from "@/lib/firebase/resumes";

export default function EditorByIdPage() {
  return (
    <AppShell>
      <AuthGuard>
        <EditorWorkspace />
      </AuthGuard>
    </AppShell>
  );
}

function EditorWorkspace() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const t = useT();
  const { user } = useAuth();
  const hydrate = useResumeStore((s) => s.hydrate);
  const replaceResume = useResumeStore((s) => s.replaceResume);
  const reset = useResumeStore((s) => s.reset);
  const dirty = useResumeStore((s) => s.dirty);
  const [ready, setReady] = React.useState(false);

  // Live subscription to the doc so multi-tab / multi-device edits stay in
  // sync. We deliberately differentiate first-mount (full hydrate) from
  // subsequent snapshots (`replaceResume`) so that our own autosave echo
  // doesn't reset the user's active editor section.
  React.useEffect(() => {
    if (!user || !params?.id) return;
    let firstLoad = true;
    const unsub = subscribeToResume(
      user.uid,
      params.id,
      (resume) => {
        if (!resume) {
          toast.error(t("editor.notFound"));
          router.replace("/dashboard");
          return;
        }
        if (firstLoad) {
          hydrate(user.uid, resume);
          firstLoad = false;
        } else {
          const state = useResumeStore.getState();
          if (!state.dirty) {
            replaceResume(resume);
          } else if (
            state.resume &&
            resume.updatedAt > state.resume.updatedAt
          ) {
            toast.warning(t("editor.remoteNewer"), {
              description: t("editor.remoteNewerHint"),
            });
          }
        }
        setReady(true);
      },
      (err) => {
        toast.error(t("common.error"), { description: err.message });
        router.replace("/dashboard");
      },
    );

    return () => {
      unsub();
      reset();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, params?.id]);

  // Warn before unload if there are unsaved changes.
  React.useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  if (!ready) return <WorkspaceSkeleton />;

  return (
    <div className="mx-auto h-[calc(100vh-3.5rem)] max-w-[1600px] px-5 py-4">
      <div className="grid h-full min-h-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(420px,520px)_minmax(560px,1fr)_minmax(380px,460px)]">
        <section className="glass min-h-0 overflow-hidden rounded-lg">
          <EditorFrame />
        </section>
        <section className="glass min-h-0 overflow-hidden rounded-lg">
          <CVPreview />
        </section>
        <aside className="min-h-0 overflow-y-auto pr-1">
          <div className="flex flex-col gap-4">
            <ATSPanel />
            <JobMatchPanel />
          </div>
        </aside>
      </div>
    </div>
  );
}

function WorkspaceSkeleton() {
  return (
    <div className="mx-auto h-[calc(100vh-3.5rem)] max-w-[1600px] px-5 py-4">
      <div className="grid h-full min-h-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(420px,520px)_minmax(560px,1fr)_minmax(380px,460px)]">
        <Skeleton className="h-full w-full rounded-lg" />
        <Skeleton className="h-full w-full rounded-lg" />
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    </div>
  );
}
