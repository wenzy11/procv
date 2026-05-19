"use client";

import { motion } from "framer-motion";

import { cn } from "@/lib/cn";
import { useResumeStore } from "@/store/resume-store";
import { useT } from "@/components/providers/i18n-provider";
import { EDITOR_STEPS } from "./editor-steps";

export function EditorStepper() {
  const active = useResumeStore((s) => s.activeSection);
  const setActive = useResumeStore((s) => s.setActiveSection);
  const t = useT();

  const currentIndex = EDITOR_STEPS.findIndex((s) => s.id === active);

  return (
    <nav
      aria-label={t("common.editorSectionsAria")}
      className="flex items-center gap-1 overflow-x-auto no-scrollbar"
    >
      {EDITOR_STEPS.map((step, idx) => {
        const isActive = active === step.id;
        const isPassed = idx < currentIndex;
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => setActive(step.id)}
            className={cn(
              "relative inline-flex shrink-0 items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              isActive
                ? "text-ink-primary"
                : "text-ink-tertiary hover:text-ink-primary",
            )}
            aria-current={isActive ? "step" : undefined}
          >
            {isActive ? (
              <motion.span
                layoutId="editor-step-active"
                transition={{ type: "spring", bounce: 0.2, duration: 0.45 }}
                className="absolute inset-0 -z-10 rounded-md bg-white/[0.06] ring-1 ring-white/[0.08]"
              />
            ) : null}
            <span
              className={cn(
                "inline-flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold transition-colors",
                isActive
                  ? "border-accent-400/60 bg-accent-400/20 text-accent-200"
                  : isPassed
                    ? "border-state-success/40 bg-state-success/15 text-state-success"
                    : "border-white/[0.08] bg-white/[0.03] text-ink-tertiary",
              )}
              aria-hidden
            >
              {idx + 1}
            </span>
            {t(step.labelKey)}
          </button>
        );
      })}
    </nav>
  );
}
