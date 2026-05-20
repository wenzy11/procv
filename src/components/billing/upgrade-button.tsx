"use client";

import Link from "next/link";
import { Layers } from "lucide-react";

import { Button, type ButtonProps } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { useT } from "@/components/providers/i18n-provider";

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

  const href = user ? "/plans" : "/sign-in";

  return (
    <Button size={size} variant={variant} className={className} asChild {...props}>
      <Link href={href}>
        {showIcon ? <Layers className="h-3.5 w-3.5" /> : null}
        {t("nav.upgradePlan")}
      </Link>
    </Button>
  );
}
