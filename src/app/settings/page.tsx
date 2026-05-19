"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { SettingsView } from "@/components/account/settings-view";

export default function SettingsPage() {
  return (
    <AuthGuard>
      <AppShell>
        <SettingsView />
      </AppShell>
    </AuthGuard>
  );
}
