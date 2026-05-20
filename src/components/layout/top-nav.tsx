"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  BarChart3,
  Briefcase,
  ChevronDown,
  Command,
  FileText,
  LayoutDashboard,
  Layers,
  LogOut,
  Search,
  Settings,
  UserCircle,
} from "lucide-react";

import { cn } from "@/lib/cn";
import { UpgradeButton } from "@/components/billing/upgrade-button";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LocaleSwitcher } from "./locale-switcher";
import { useCommandPalette } from "@/components/command/command-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { useT } from "@/components/providers/i18n-provider";

interface NavItem {
  href: string;
  i18nKey: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", i18nKey: "nav.dashboard", icon: LayoutDashboard },
  { href: "/editor", i18nKey: "nav.cvs", icon: FileText },
  { href: "/job-matching", i18nKey: "nav.jobMatching", icon: Briefcase },
  { href: "/analytics", i18nKey: "nav.analytics", icon: BarChart3 },
];

export function TopNav() {
  const pathname = usePathname();
  const t = useT();

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full",
        "border-b border-white/[0.06]",
        "bg-surface-base/70 backdrop-blur-xl",
      )}
    >
      <div className="mx-auto flex h-14 max-w-[1600px] items-center gap-4 px-5">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="shrink-0">
            <Logo />
          </Link>

          <nav aria-label={t("common.primaryNavAria")} className="hidden md:block">
            <ul className="relative flex items-center gap-1">
              {NAV_ITEMS.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/" && pathname?.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <li key={item.href} className="relative">
                    <Link
                      href={item.href}
                      className={cn(
                        "relative inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                        active
                          ? "text-ink-primary"
                          : "text-ink-tertiary hover:text-ink-primary",
                      )}
                    >
                      {active ? (
                        <motion.span
                          layoutId="top-nav-active"
                          transition={{
                            type: "spring",
                            bounce: 0.18,
                            duration: 0.5,
                          }}
                          className="absolute inset-0 -z-10 rounded-md bg-white/[0.05] ring-1 ring-white/[0.07]"
                          aria-hidden
                        />
                      ) : null}
                      <Icon className="h-3.5 w-3.5" />
                      {t(item.i18nKey)}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2">
          <MobileSearchTrigger />
          <GlobalSearchTrigger />
          <LocaleSwitcher />
          <UpgradePill />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}

function MobileSearchTrigger() {
  const t = useT();
  const { setOpen } = useCommandPalette();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "inline-flex lg:hidden h-8 w-8 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.03] text-ink-tertiary",
        "transition-colors hover:border-white/[0.12] hover:text-ink-primary",
      )}
      aria-label={t("common.openCommandPaletteAria")}
    >
      <Search className="h-4 w-4" />
    </button>
  );
}

function GlobalSearchTrigger() {
  const t = useT();
  const { setOpen } = useCommandPalette();
  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className={cn(
        "hidden lg:inline-flex items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.03] px-2.5 py-1.5 text-xs text-ink-tertiary",
        "transition-colors hover:border-white/[0.12] hover:text-ink-primary",
      )}
      aria-label={t("common.openCommandPaletteAria")}
    >
      <Search className="h-3.5 w-3.5" />
      <span>{t("nav.search")}</span>
      <span className="ml-2 inline-flex items-center gap-0.5 rounded border border-white/[0.08] bg-white/[0.04] px-1 py-0.5 text-[10px] font-medium text-ink-tertiary">
        <Command className="h-3 w-3" />K
      </span>
    </button>
  );
}

function UpgradePill() {
  return (
    <UpgradeButton
      size="sm"
      variant="neon"
      className="hidden sm:inline-flex"
    />
  );
}

function initialsOf(name: string | null | undefined, email: string | null): string {
  const source = (name ?? email ?? "U").trim();
  const parts = source.split(/\s+/);
  if (parts.length === 1) return source.slice(0, 2).toUpperCase();
  const first = parts[0]?.[0] ?? "";
  const last = parts[parts.length - 1]?.[0] ?? "";
  return (first + last).toUpperCase();
}

function UserMenu() {
  const { user, signOut } = useAuth();
  const t = useT();

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "group flex items-center gap-2 rounded-md border border-white/[0.06] bg-white/[0.03] py-1 pl-1 pr-2 transition-colors hover:bg-white/[0.06]",
          )}
        >
          <span
            className="grid h-7 w-7 place-items-center rounded-[6px] bg-brand-gradient text-xs font-semibold text-white shadow-[0_0_18px_-6px_rgba(129,140,248,0.55)]"
            aria-hidden
          >
            {initialsOf(user.displayName, user.email)}
          </span>
          <span className="hidden text-left leading-tight md:block">
            <span className="block text-xs font-medium text-ink-primary">
              {user.displayName ?? user.email}
            </span>
            <span className="block text-[10px] text-ink-tertiary">
              {user.email}
            </span>
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-ink-tertiary transition-transform group-data-[state=open]:rotate-180" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>{t("nav.profile")}</DropdownMenuLabel>
        <DropdownMenuItem className="cursor-default focus:bg-transparent">
          <div className="flex flex-col">
            <span className="text-sm text-ink-primary">
              {user.displayName ?? user.email}
            </span>
            <span className="text-xs text-ink-tertiary">{user.email}</span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="flex cursor-pointer items-center gap-2">
            <UserCircle className="h-4 w-4 text-ink-tertiary" />
            {t("nav.profile")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/plans" className="flex cursor-pointer items-center gap-2">
            <Layers className="h-4 w-4 text-ink-tertiary" />
            {t("nav.upgradePlan")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="flex cursor-pointer items-center gap-2">
            <Settings className="h-4 w-4 text-ink-tertiary" />
            {t("nav.preferences")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-state-danger focus:bg-state-danger/10"
          onSelect={() => {
            void signOut();
          }}
        >
          <LogOut className="h-4 w-4" />
          {t("auth.signOut")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
