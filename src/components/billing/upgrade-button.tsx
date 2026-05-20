"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n, useT } from "@/components/providers/i18n-provider";
import { startProCheckout } from "@/lib/billing/checkout-client";

export function UpgradeButton({
  className,
  size = "sm",
  variant = "neon",
  showIcon = true,
  ...props
}: ButtonProps & { showIcon?: boolean }) {
  const t = useT();
  const { locale } = useI18n();
  const { user, isPro, configured } = useAuth();
  const [loading, setLoading] = React.useState(false);

  if (isPro) return null;

  async function onUpgrade() {
    if (!user) {
      toast.error(t("payment.signInRequired"));
      return;
    }
    if (!configured) {
      toast.error(t("errors.firebase"));
      return;
    }
    setLoading(true);
    try {
      toast.info(t("payment.redirecting"));
      await startProCheckout(user.email, locale);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("payment.error");
      const is503 =
        err instanceof Error && message.includes("not configured");
      toast.error(is503 ? t("payment.notConfigured") : message, {
        description: is503
          ? undefined
          : message.length > 80
            ? message.slice(0, 120)
            : undefined,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      size={size}
      variant={variant}
      className={className}
      disabled={loading}
      onClick={() => void onUpgrade()}
      {...props}
    >
      {showIcon ? <Sparkles className="h-3.5 w-3.5" /> : null}
      {loading ? t("payment.redirecting") : t("nav.upgrade")}
    </Button>
  );
}
