"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  BarChart3,
  Briefcase,
  FileText,
  LayoutDashboard,
  LogOut,
  Layers,
  Plus,
  Settings,
  UserCircle,
} from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { useAuth } from "@/components/providers/auth-provider";
import { useI18n, useT } from "@/components/providers/i18n-provider";
import { createResume } from "@/lib/firebase/resumes";
import { LOCALES, LOCALE_LABELS } from "@/lib/i18n";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const t = useT();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const { locale, setLocale } = useI18n();
  const [creating, setCreating] = React.useState(false);

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  const handleNewResume = async () => {
    if (!user) {
      go("/sign-in");
      return;
    }
    setCreating(true);
    try {
      const id = await createResume(user.uid, user.displayName);
      onOpenChange(false);
      router.push(`/editor/${id}`);
    } catch (err) {
      toast.error(t("common.error"), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 max-w-xl">
        <Command
          className="rounded-lg bg-surface-elevated"
          label={t("command.title")}
        >
          <div className="border-b border-white/[0.06] px-3">
            <Command.Input
              placeholder={t("command.placeholder")}
              className="h-12 w-full bg-transparent text-sm text-ink-primary outline-none placeholder:text-ink-tertiary"
            />
          </div>
          <Command.List className="max-h-[360px] overflow-y-auto p-2">
            <Command.Empty className="py-6 text-center text-sm text-ink-tertiary">
              {t("command.empty")}
            </Command.Empty>

            <Command.Group heading={t("command.navigation")}>
              <CommandItem
                icon={LayoutDashboard}
                onSelect={() => go("/dashboard")}
              >
                {t("nav.dashboard")}
              </CommandItem>
              <CommandItem icon={FileText} onSelect={() => go("/editor")}>
                {t("nav.cvs")}
              </CommandItem>
              <CommandItem icon={Briefcase} onSelect={() => go("/applications")}>
                {t("nav.applications")}
              </CommandItem>
              <CommandItem icon={Briefcase} onSelect={() => go("/job-matching")}>
                {t("nav.jobMatching")}
              </CommandItem>
              <CommandItem icon={BarChart3} onSelect={() => go("/analytics")}>
                {t("nav.analytics")}
              </CommandItem>
            </Command.Group>

            <Command.Group heading={t("command.actions")}>
              <CommandItem
                icon={Plus}
                disabled={creating}
                onSelect={() => void handleNewResume()}
              >
                {t("dashboard.newResume")}
              </CommandItem>
              <CommandItem icon={UserCircle} onSelect={() => go("/profile")}>
                {t("nav.profile")}
              </CommandItem>
              <CommandItem icon={Layers} onSelect={() => go("/plans")}>
                {t("nav.upgradePlan")}
              </CommandItem>
              <CommandItem icon={Settings} onSelect={() => go("/settings")}>
                {t("nav.preferences")}
              </CommandItem>
            </Command.Group>

            <Command.Group heading={t("command.language")}>
              {LOCALES.map((loc) => (
                <CommandItem
                  key={loc}
                  onSelect={() => {
                    setLocale(loc);
                    onOpenChange(false);
                  }}
                >
                  {LOCALE_LABELS[loc]}
                  {loc === locale ? (
                    <span className="ml-auto text-2xs text-accent-300">
                      {t("command.active")}
                    </span>
                  ) : null}
                </CommandItem>
              ))}
            </Command.Group>

            {user ? (
              <Command.Group heading={t("command.account")}>
                <CommandItem
                  icon={LogOut}
                  onSelect={() => {
                    onOpenChange(false);
                    void signOut();
                  }}
                >
                  {t("auth.signOut")}
                </CommandItem>
              </Command.Group>
            ) : null}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function CommandItem({
  children,
  onSelect,
  icon: Icon,
  disabled,
}: {
  children: React.ReactNode;
  onSelect: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  disabled?: boolean;
}) {
  return (
    <Command.Item
      disabled={disabled}
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm text-ink-primary aria-selected:bg-white/[0.06] data-[disabled=true]:opacity-50"
    >
      {Icon ? <Icon className="h-4 w-4 text-ink-tertiary" /> : null}
      {children}
    </Command.Item>
  );
}
