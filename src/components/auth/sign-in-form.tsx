"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  sendPasswordReset,
  signInWithEmail,
  signInWithGoogle,
} from "@/lib/firebase/auth";
import { useI18n, useT } from "@/components/providers/i18n-provider";
import { useAuth } from "@/components/providers/auth-provider";

export function SignInForm() {
  const t = useT();
  const { locale } = useI18n();
  const { configured } = useAuth();
  const router = useRouter();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState<"none" | "email" | "google" | "reset">(
    "none",
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured) {
      toast.error(t("errors.firebase"));
      return;
    }
    setBusy("email");
    try {
      await signInWithEmail(email, password);
      router.replace("/dashboard");
    } catch (err) {
      toast.error(t("auth.invalidCredentials"), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy("none");
    }
  };

  const handleGoogle = async () => {
    if (!configured) {
      toast.error(t("errors.firebase"));
      return;
    }
    setBusy("google");
    try {
      await signInWithGoogle(locale);
      router.replace("/dashboard");
    } catch (err) {
      toast.error(t("common.error"), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy("none");
    }
  };

  const handleReset = async () => {
    if (!email.trim()) {
      toast.warning(t("auth.emailRequired"));
      return;
    }
    setBusy("reset");
    try {
      await sendPasswordReset(email);
      toast.success(t("auth.resetSent"));
    } catch (err) {
      toast.error(t("common.error"), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setBusy("none");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Button
        type="button"
        variant="secondary"
        size="lg"
        onClick={handleGoogle}
        loading={busy === "google"}
        disabled={!configured}
        className="w-full"
      >
        <GoogleIcon />
        {t("auth.continueWithGoogle")}
      </Button>

      <div className="flex items-center gap-3 py-1 text-2xs uppercase tracking-[0.18em] text-ink-tertiary">
        <Separator className="flex-1" />
        {t("auth.or")}
        <Separator className="flex-1" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">{t("auth.email")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          leading={<Mail className="h-3.5 w-3.5" />}
          required
        />
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">{t("auth.password")}</Label>
          <button
            type="button"
            onClick={handleReset}
            disabled={busy === "reset"}
            className="text-xs text-ink-tertiary transition-colors hover:text-accent-300"
          >
            {t("auth.forgotPassword")}
          </button>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          leading={<Lock className="h-3.5 w-3.5" />}
          required
          minLength={6}
        />
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        className="w-full"
        loading={busy === "email"}
        disabled={!configured}
      >
        {t("auth.signIn")}
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>

      <p className="text-center text-xs text-ink-tertiary">
        {t("auth.needAccount")}{" "}
        <Link
          href="/sign-up"
          className="font-medium text-accent-300 hover:text-accent-200"
        >
          {t("auth.signUp")}
        </Link>
      </p>
    </form>
  );
}

function GoogleIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 18 18"
      aria-hidden
      className="shrink-0"
    >
      <path
        fill="#EA4335"
        d="M9 3.48c1.69 0 2.85.73 3.5 1.34l2.56-2.5C13.46.92 11.43 0 9 0 5.48 0 2.44 2.02.96 4.96l2.91 2.26C4.6 5.05 6.62 3.48 9 3.48z"
      />
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.74-.06-1.28-.19-1.84H9v3.34h4.96c-.1.83-.64 2.08-1.84 2.92l2.84 2.2c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#FBBC05"
        d="M3.88 10.78A5.54 5.54 0 0 1 3.58 9c0-.62.11-1.22.29-1.78L.96 4.96A9 9 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.92-2.26z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.84-2.2c-.76.53-1.78.9-3.12.9-2.38 0-4.4-1.57-5.12-3.74L.97 13.04C2.45 15.98 5.48 18 9 18z"
      />
    </svg>
  );
}
