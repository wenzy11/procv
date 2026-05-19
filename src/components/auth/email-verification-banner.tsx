"use client";

import * as React from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { useT } from "@/components/providers/i18n-provider";
import { resendVerificationEmail } from "@/lib/firebase/auth";

export function EmailVerificationBanner() {
  const t = useT();
  const { user } = useAuth();
  const [sending, setSending] = React.useState(false);

  if (!user || user.emailVerified || !user.email) return null;

  const handleResend = async () => {
    setSending(true);
    try {
      await resendVerificationEmail();
      toast.success(t("verify.sent"));
    } catch (err) {
      toast.error(t("common.error"), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-b border-amber-500/20 bg-amber-500/10 px-5 py-2.5">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs text-amber-100/90">
          <Mail className="h-3.5 w-3.5 shrink-0" />
          {t("verify.banner")}
        </p>
        <Button
          variant="secondary"
          size="sm"
          loading={sending}
          onClick={() => void handleResend()}
        >
          {t("verify.resend")}
        </Button>
      </div>
    </div>
  );
}
