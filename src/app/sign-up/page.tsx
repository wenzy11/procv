"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { useGoogleRedirect } from "@/components/auth/use-google-redirect";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n, useT } from "@/components/providers/i18n-provider";

export default function SignUpPage() {
  const t = useT();
  const { locale } = useI18n();
  const router = useRouter();
  const { user, initializing } = useAuth();
  const googleRedirectPending = useGoogleRedirect(locale);

  React.useEffect(() => {
    if (!initializing && user) router.replace("/dashboard");
  }, [initializing, user, router]);

  if (googleRedirectPending) {
    return (
      <AuthShell title={t("auth.createTitle")} subtitle={t("auth.googleFinishing")}>
        <p className="text-sm text-ink-secondary">{t("common.loading")}</p>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t("auth.createTitle")} subtitle={t("auth.createHint")}>
      <SignUpForm />
    </AuthShell>
  );
}
