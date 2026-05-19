"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useResumeStore } from "@/store/resume-store";
import { useT } from "@/components/providers/i18n-provider";
import { SectionHeader } from "./section-header";
import type { LanguageProficiency } from "@/lib/types";

const PROFICIENCIES: LanguageProficiency[] = [
  "Elementary",
  "Conversational",
  "Professional",
  "Fluent",
  "Native",
];

const PROFICIENCY_DOTS: Record<LanguageProficiency, number> = {
  Elementary: 1,
  Conversational: 2,
  Professional: 3,
  Fluent: 4,
  Native: 5,
};

export function LanguagesForm() {
  const languages = useResumeStore((s) => s.resume?.languages ?? []);
  const addLanguage = useResumeStore((s) => s.addLanguage);
  const updateLanguage = useResumeStore((s) => s.updateLanguage);
  const removeLanguage = useResumeStore((s) => s.removeLanguage);
  const t = useT();

  const [draft, setDraft] = React.useState("");

  const submit = () => {
    if (!draft.trim()) return;
    addLanguage(draft);
    setDraft("");
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="05"
        title={t("editor.languages.title")}
        description={t("editor.languages.hint")}
      />

      <div className="flex items-center gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={t("editor.languages.placeholder")}
        />
        <Button variant="secondary" onClick={submit}>
          <Plus className="h-3.5 w-3.5" />
          {t("common.add")}
        </Button>
      </div>

      <div className="space-y-3">
        <Label>
          {t("editor.languages.your")} · {languages.length}
        </Label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <AnimatePresence initial={false}>
            {languages.map((lang) => (
              <motion.div
                key={lang.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="flex items-center justify-between rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2"
              >
                <div className="flex items-center gap-3">
                  <span className="text-sm text-ink-primary">{lang.name}</span>
                  <ProficiencyDots level={PROFICIENCY_DOTS[lang.proficiency]} />
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={lang.proficiency}
                    onChange={(e) =>
                      updateLanguage(lang.id, {
                        proficiency: e.target.value as LanguageProficiency,
                      })
                    }
                    className="rounded-md border border-white/[0.06] bg-surface-elevated px-2 py-1 text-xs text-ink-secondary focus:outline-none focus:ring-2 focus:ring-accent-400/30"
                  >
                    {PROFICIENCIES.map((p) => (
                      <option key={p} value={p}>
                        {t(`editor.languages.levels.${p}`)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => removeLanguage(lang.id)}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-ink-tertiary transition-colors hover:bg-white/[0.06] hover:text-state-danger"
                    aria-label={t("common.removeAria", { name: lang.name })}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function ProficiencyDots({ level }: { level: number }) {
  return (
    <span
      className="inline-flex items-center gap-1"
      aria-label={`Level ${level} of 5`}
    >
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={
            i < level
              ? "h-1.5 w-1.5 rounded-full bg-accent-400 shadow-[0_0_8px_-1px_rgba(99,102,241,0.55)]"
              : "h-1.5 w-1.5 rounded-full bg-white/10"
          }
        />
      ))}
    </span>
  );
}
