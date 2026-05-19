"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/layout/app-shell";
import { AuthGuard } from "@/components/auth/auth-guard";
import { ResumeList } from "@/components/dashboard/resume-list";
import { useAuth } from "@/components/providers/auth-provider";
import { listResumes, createResume } from "@/lib/firebase/resumes";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * /editor — routes the user to their most recent résumé, or creates a fresh
 * one on first visit. Acts as an inbox-zero style entry point.
 */
export default function EditorIndex() {
  return (
    <AppShell>
      <AuthGuard>
        <EditorRouter />
      </AuthGuard>
    </AppShell>
  );
}

function EditorRouter() {
  const router = useRouter();
  const { user } = useAuth();
  const [routing, setRouting] = React.useState(true);
  const [showList, setShowList] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    async function run() {
      if (!user) return;
      try {
        const list = await listResumes(user.uid);
        if (cancelled) return;
        if (list.length > 0) {
          // Multiple résumés → show the picker. Single → jump straight in.
          if (list.length === 1) {
            router.replace(`/editor/${list[0]!.id}`);
            return;
          }
          setShowList(true);
        } else {
          const id = await createResume(user.uid, user.displayName);
          router.replace(`/editor/${id}`);
        }
      } catch {
        setShowList(true);
      } finally {
        if (!cancelled) setRouting(false);
      }
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, [router, user]);

  if (routing) {
    return (
      <div className="mx-auto max-w-[1600px] px-5 py-6">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
        <Skeleton className="mt-6 h-96 w-full rounded-lg" />
      </div>
    );
  }

  if (showList) {
    return (
      <div className="mx-auto max-w-[1600px] px-5 py-6">
        <ResumeList />
      </div>
    );
  }
  return null;
}
