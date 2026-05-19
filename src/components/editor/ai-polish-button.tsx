"use client";

import * as React from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

import { cn } from "@/lib/cn";
import { polishText } from "@/lib/scoring";
import { useI18n, useT } from "@/components/providers/i18n-provider";

interface AIPolishButtonProps {
  value: string;
  onPolished: (next: string) => void;
  label?: string;
  className?: string;
  disabled?: boolean;
}

/**
 * "AI Polish" button — calls the authenticated `/api/ai/polish` endpoint and
 * replaces the textarea contents with the OpenAI-generated rewrite.
 */
export function AIPolishButton({
  value,
  onPolished,
  label,
  className,
  disabled,
}: AIPolishButtonProps) {
  const t = useT();
  const { locale } = useI18n();
  const [loading, setLoading] = React.useState(false);

  const actionLabel = label ?? t("editor.aiPolish");

  const handleClick = async () => {
    if (!value.trim()) {
      toast.warning(t("editor.nothingToPolish"), {
        description: t("editor.nothingToPolishHint"),
      });
      return;
    }
    try {
      setLoading(true);
      const next = await polishText(value, locale);
      if (next) {
        onPolished(next);
        toast.success(t("editor.polishedToast"), {
          description: t("editor.polishedToastHint"),
        });
      } else {
        toast.error(t("common.error"));
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast.error(
        msg === "EMAIL_NOT_VERIFIED" ? t("errors.emailNotVerified") : t("ats.failed"),
        { description: msg === "EMAIL_NOT_VERIFIED" ? undefined : msg || undefined },
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className={cn(
        "group inline-flex h-7 items-center gap-1.5 rounded-md border border-violet-500/30 bg-violet-500/10 px-2 text-2xs font-medium text-violet-300 transition-all",
        "hover:border-violet-400/60 hover:bg-violet-500/15 hover:text-violet-200 hover:shadow-[0_0_18px_-6px_rgba(168,85,247,0.6)]",
        "disabled:cursor-wait disabled:opacity-60",
        className,
      )}
      aria-busy={loading || undefined}
    >
      <motion.span
        animate={loading ? { rotate: 360 } : { rotate: 0 }}
        transition={
          loading
            ? { repeat: Infinity, duration: 1.4, ease: "linear" }
            : { duration: 0.2 }
        }
        className="inline-flex"
        aria-hidden
      >
        <Sparkles className="h-3 w-3" />
      </motion.span>
      <span>{loading ? t("editor.polishing") : actionLabel}</span>
    </button>
  );
}
