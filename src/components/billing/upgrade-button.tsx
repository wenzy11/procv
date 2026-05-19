"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { useT } from "@/components/providers/i18n-provider";
import { startProCheckout } from "@/lib/billing/checkout-client";

export function UpgradeButton({
  className,
  size = "sm",
  variant = "neon",
  showIcon = true,
  ...props
}: ButtonProps & { showIcon?: boolean }) {
  const t = useT();
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
      await startProCheckout(user.email);
    } catch (err) {
      const message = err instanceof Error ? err.message : t("payment.error");
      toast.error(message);
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
