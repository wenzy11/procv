"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { useT } from "@/components/providers/i18n-provider";
import Link from "next/link";

export function UpgradeButton({
  className,
  size = "sm",
  variant = "neon",
  showIcon = true,
  ...props
}: ButtonProps & { showIcon?: boolean }) {
  const t = useT();
  const { user, isPro } = useAuth();

  if (isPro) return null;

  if (!user) {
    return (
      <Button size={size} variant={variant} className={className} asChild {...props}>
        <Link href="/sign-in">
          {showIcon ? <Sparkles className="h-3.5 w-3.5" /> : null}
          {t("nav.upgrade")}
        </Link>
      </Button>
    );
  }

  return (
    <Button size={size} variant={variant} className={className} asChild {...props}>
      <Link href="/settings">
        {showIcon ? <Sparkles className="h-3.5 w-3.5" /> : null}
        {t("nav.upgrade")}
      </Link>
    </Button>
  );
}
