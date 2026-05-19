"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { useAuth } from "@/components/providers/auth-provider";
import { useT } from "@/components/providers/i18n-provider";

export default function SignInPage() {
  const t = useT();
  const router = useRouter();
  const { user, initializing } = useAuth();

  // If already authenticated, bounce straight to the dashboard.
  React.useEffect(() => {
    if (!initializing && user) router.replace("/dashboard");
  }, [initializing, user, router]);

  return (
    <AuthShell title={t("auth.welcomeBack")} subtitle={t("auth.welcomeBackHint")}>
      <SignInForm />
    </AuthShell>
  );
}
