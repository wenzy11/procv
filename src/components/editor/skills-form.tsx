"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useResumeStore } from "@/store/resume-store";
import { useT } from "@/components/providers/i18n-provider";
import { SectionHeader } from "./section-header";
import type { SkillLevel } from "@/lib/types";

const LEVELS: SkillLevel[] = ["Beginner", "Intermediate", "Advanced", "Expert"];

const LEVEL_TONE: Record<SkillLevel, "neutral" | "accent" | "violet" | "success"> = {
  Beginner: "neutral",
  Intermediate: "accent",
  Advanced: "violet",
  Expert: "success",
};

export function SkillsForm() {
  const skills = useResumeStore((s) => s.resume?.skills ?? []);
  const addSkill = useResumeStore((s) => s.addSkill);
  const updateSkill = useResumeStore((s) => s.updateSkill);
  const removeSkill = useResumeStore((s) => s.removeSkill);
  const t = useT();

  const [draft, setDraft] = React.useState("");

  const submit = () => {
    if (!draft.trim()) return;
    addSkill(draft);
    setDraft("");
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="04"
        title={t("editor.skills.title")}
        description={t("editor.skills.hint")}
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
          placeholder={t("editor.skills.placeholder")}
        />
        <Button variant="secondary" size="md" onClick={submit}>
          <Plus className="h-3.5 w-3.5" />
          {t("common.add")}
        </Button>
      </div>

      <div className="space-y-3">
        <Label>
          {t("editor.skills.matrix")} · {skills.length}
        </Label>
        <div className="flex flex-wrap gap-2">
          <AnimatePresence initial={false}>
            {skills.map((skill) => (
              <motion.div
                key={skill.id}
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.18 }}
                className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.03] py-1 pl-2.5 pr-1"
              >
                <span className="text-sm text-ink-primary">{skill.name}</span>
                <select
                  value={skill.level}
                  onChange={(e) =>
                    updateSkill(skill.id, {
                      level: e.target.value as SkillLevel,
                    })
                  }
                  className="rounded-full border-0 bg-transparent text-xs text-ink-tertiary focus:outline-none focus:ring-0"
                  aria-label={`Level for ${skill.name}`}
                >
                  {LEVELS.map((l) => (
                    <option
                      key={l}
                      value={l}
                      className="bg-surface-elevated text-ink-primary"
                    >
                      {t(`editor.skills.levels.${l}`)}
                    </option>
                  ))}
                </select>
                <Badge tone={LEVEL_TONE[skill.level]} size="sm">
                  {skill.level[0]}
                </Badge>
                <button
                  type="button"
                  onClick={() => removeSkill(skill.id)}
                  className="ml-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-ink-tertiary transition-colors hover:bg-white/[0.06] hover:text-state-danger"
                  aria-label={t("common.removeAria", { name: skill.name })}
                >
                  <X className="h-3 w-3" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
