"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { useAuth } from "@/components/providers/auth-provider";
import { useT } from "@/components/providers/i18n-provider";

export default function SignUpPage() {
  const t = useT();
  const router = useRouter();
  const { user, initializing } = useAuth();

  React.useEffect(() => {
    if (!initializing && user) router.replace("/dashboard");
  }, [initializing, user, router]);

  return (
    <AuthShell title={t("auth.createTitle")} subtitle={t("auth.createHint")}>
      <SignUpForm />
    </AuthShell>
  );
}
