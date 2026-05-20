"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowRight, Briefcase } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/components/providers/auth-provider";
import { useT } from "@/components/providers/i18n-provider";
import { subscribeToApplications } from "@/lib/firebase/applications";
import type { ApplicationStatus, JobApplication } from "@/lib/types";

const PREVIEW_STATUSES: ApplicationStatus[] = [
  "applied",
  "interview",
  "offer",
];

export function ApplicationsPreview() {
  const t = useT();
  const { user } = useAuth();
  const [apps, setApps] = React.useState<JobApplication[] | null>(null);

  React.useEffect(() => {
    if (!user) return;
    return subscribeToApplications(user.uid, setApps, () => setApps([]));
  }, [user]);

  const active =
    apps?.filter((a) => PREVIEW_STATUSES.includes(a.status)) ?? [];
  const recent = active.slice(0, 4);

  return (
    <Card glass>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <Briefcase className="h-4 w-4 text-accent-400" />
          {t("applications.previewTitle")}
        </CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link href="/applications">
            {t("applications.viewAll")}
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {apps === null ? (
          <Skeleton className="h-16 w-full" />
        ) : recent.length === 0 ? (
          <div className="rounded-md border border-dashed border-white/[0.08] px-4 py-6 text-center">
            <p className="text-sm text-ink-secondary">{t("applications.previewEmpty")}</p>
            <Button asChild variant="neon" size="sm" className="mt-3">
              <Link href="/applications">{t("applications.addFirst")}</Link>
            </Button>
          </div>
        ) : (
          <ul className="space-y-2">
            {recent.map((app) => (
              <li
                key={app.id}
                className="flex items-center justify-between rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2.5"
              >
                <div>
                  <p className="text-sm font-medium text-ink-primary">{app.company}</p>
                  <p className="text-xs text-ink-tertiary">{app.role}</p>
                </div>
                <Badge tone="accent" size="sm">
                  {t(`applications.status.${app.status}`)}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
