"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, ArrowRight } from "lucide-react";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { signInWithGoogle, signUpWithEmail } from "@/lib/firebase/auth";
import { useI18n, useT } from "@/components/providers/i18n-provider";
import { useAuth } from "@/components/providers/auth-provider";

export function SignUpForm() {
  const t = useT();
  const { locale } = useI18n();
  const { configured } = useAuth();
  const router = useRouter();

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState<"none" | "email" | "google">("none");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!configured) {
      toast.error(t("errors.firebase"));
      return;
    }
    setBusy("email");
    try {
      await signUpWithEmail(email, password, name, locale);
      toast.success(t("auth.accountCreated"), {
        description: t("auth.checkEmail"),
      });
      router.replace("/dashboard");
    } catch (err) {
      toast.error(t("common.error"), {
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
        {t("auth.continueWithGoogle")}
      </Button>

      <div className="flex items-center gap-3 py-1 text-2xs uppercase tracking-[0.18em] text-ink-tertiary">
        <Separator className="flex-1" />
        {t("auth.or")}
        <Separator className="flex-1" />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="name">{t("auth.name")}</Label>
        <Input
          id="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          leading={<User className="h-3.5 w-3.5" />}
          required
        />
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
        <Label htmlFor="password">{t("auth.password")}</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
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
        {t("auth.signUp")}
        <ArrowRight className="h-3.5 w-3.5" />
      </Button>

      <p className="text-center text-xs text-ink-tertiary">
        {t("auth.haveAccount")}{" "}
        <Link
          href="/sign-in"
          className="font-medium text-accent-300 hover:text-accent-200"
        >
          {t("auth.signIn")}
        </Link>
      </p>
    </form>
  );
}
