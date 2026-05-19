"use client";

import { AuthGuard } from "@/components/auth/auth-guard";
import { AppShell } from "@/components/layout/app-shell";
import { ProfileView } from "@/components/account/profile-view";

export default function ProfilePage() {
  return (
    <AuthGuard>
      <AppShell>
        <ProfileView />
      </AppShell>
    </AuthGuard>
  );
}
