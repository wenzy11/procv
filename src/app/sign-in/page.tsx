"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignInForm } from "@/components/auth/sign-in-form";
import { useGoogleRedirect } from "@/components/auth/use-google-redirect";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n, useT } from "@/components/providers/i18n-provider";

export default function SignInPage() {
  const t = useT();
  const { locale } = useI18n();
  const router = useRouter();
  const { user, initializing } = useAuth();
  const googleRedirectPending = useGoogleRedirect(locale);

  // If already authenticated, bounce straight to the dashboard.
  React.useEffect(() => {
    if (!initializing && user) router.replace("/dashboard");
  }, [initializing, user, router]);

  if (googleRedirectPending) {
    return (
      <AuthShell title={t("auth.welcomeBack")} subtitle={t("auth.googleFinishing")}>
        <p className="text-sm text-ink-secondary">{t("common.loading")}</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t("auth.welcomeBack")} subtitle={t("auth.welcomeBackHint")}>
      <SignInForm />
    </AuthShell>
  );
}
