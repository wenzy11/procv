"use client";

import * as React from "react";
import { UserCircle } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/components/providers/auth-provider";
import { useT } from "@/components/providers/i18n-provider";

export function ProfileView() {
  const t = useT();
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="mx-auto max-w-2xl px-5 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">{t("profile.title")}</h1>
      <p className="mt-1 text-sm text-ink-secondary">{t("profile.hint")}</p>

      <Card glass className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCircle className="h-4 w-4 text-accent-400" />
            {t("profile.account")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <Row label={t("auth.name")} value={user.displayName ?? "—"} />
          <Row label={t("auth.email")} value={user.email ?? "—"} />
          <Row
            label={t("profile.emailStatus")}
            value={
              user.emailVerified
                ? t("profile.verified")
                : t("profile.unverified")
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/[0.04] pb-3 last:border-0 last:pb-0">
      <span className="text-ink-tertiary">{label}</span>
      <span className="font-medium text-ink-primary">{value}</span>
    </div>
  );
}
