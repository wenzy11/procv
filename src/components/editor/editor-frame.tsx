"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  Save,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useResumeStore } from "@/store/resume-store";
import { useAuth } from "@/components/providers/auth-provider";
import { useT } from "@/components/providers/i18n-provider";
import { deleteResume } from "@/lib/firebase/resumes";
import { EDITOR_STEPS } from "./editor-steps";
import { EditorStepper } from "./editor-stepper";
import { PersonalForm } from "./personal-form";
import { ExperienceForm } from "./experience-form";
import { ProjectsForm } from "./projects-form";
import { SkillsForm } from "./skills-form";
import { LanguagesForm } from "./languages-form";
import { EducationForm } from "./education-form";
import { usePersistResume } from "./use-persist-resume";

/**
 * EditorFrame — left pane. Owns the stepper, the title input, the active
 * section's form, and the navigation footer.
 *
 * Autosave is managed by `usePersistResume`; the indicator next to the title
 * reflects its state.
 */
export function EditorFrame() {
  const router = useRouter();
  const t = useT();
  const { user } = useAuth();

  const resume = useResumeStore((s) => s.resume);
  const active = useResumeStore((s) => s.activeSection);
  const setActive = useResumeStore((s) => s.setActiveSection);
  const setTitle = useResumeStore((s) => s.setTitle);
  const flush = useResumeStore((s) => s.flush);
  const dirty = useResumeStore((s) => s.dirty);

  const { saving, lastSavedAt } = usePersistResume();

  const idx = EDITOR_STEPS.findIndex((s) => s.id === active);
  const safeIdx = idx === -1 ? 0 : idx;
  const isFirst = safeIdx === 0;
  const isLast = safeIdx === EDITOR_STEPS.length - 1;

  const goBack = () => {
    if (isFirst) return;
    const prev = EDITOR_STEPS[safeIdx - 1];
    if (prev) setActive(prev.id);
  };
  const goNext = () => {
    if (isLast) return;
    const next = EDITOR_STEPS[safeIdx + 1];
    if (next) setActive(next.id);
  };

  const handleManualSave = async () => {
    try {
      await flush();
      toast.success(t("common.saved"));
    } catch (err) {
      toast.error(t("common.error"), {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const handleDelete = async () => {
    if (!user || !resume) return;
    if (!window.confirm(t("editor.deleteConfirm"))) return;
    try {
      await deleteResume(user.uid, resume.id);
      toast.success(t("editor.deleted"));
      router.replace("/dashboard");
    } catch (err) {
      toast.error(t("common.error"), {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  if (!resume) return null;

  return (
    <section
      aria-label={t("common.resumeEditorAria")}
      className="flex h-full min-h-0 flex-col"
    >
      <div className="flex flex-col gap-3 border-b border-white/[0.06] px-5 py-3.5">
        <div className="flex items-center gap-2">
          <Input
            value={resume.title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t("editor.titlePlaceholder")}
            className="flex-1 h-9"
          />
          <SaveIndicator saving={saving} dirty={dirty} lastSavedAt={lastSavedAt} />
        </div>
        <EditorStepper />
      </div>

      <div className="relative min-h-0 flex-1 overflow-y-auto px-5 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: [0.2, 0.7, 0.2, 1] }}
            className="mx-auto max-w-2xl"
          >
            <ActiveForm />
          </motion.div>
        </AnimatePresence>
      </div>

      <footer className="flex items-center justify-between gap-3 border-t border-white/[0.06] bg-surface-base/40 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={goBack} disabled={isFirst}>
            <ArrowLeft className="h-3.5 w-3.5" />
            {t("common.back")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDelete}
            className="text-state-danger hover:bg-state-danger/10 hover:text-state-danger"
          >
            <Trash2 className="h-3.5 w-3.5" />
            {t("editor.deleteResume")}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleManualSave}
            loading={saving}
          >
            <Save className="h-3.5 w-3.5" />
            {t("editor.saveDraft")}
          </Button>
          {isLast ? (
            <Button
              variant="primary"
              size="sm"
              onClick={async () => {
                try {
                  await flush();
                } catch {
                  // flush already surfaces a toast in handleManualSave; the
                  // dashboard works fine even if save is pending.
                }
                router.push("/dashboard");
              }}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {t("editor.finish")}
            </Button>
          ) : (
            <Button variant="primary" size="sm" onClick={goNext}>
              {t("common.next")}
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </footer>
    </section>
  );
}

function ActiveForm() {
  const active = useResumeStore((s) => s.activeSection);
  switch (active) {
    case "personal":
      return <PersonalForm />;
    case "experience":
      return <ExperienceForm />;
    case "projects":
      return <ProjectsForm />;
    case "skills":
      return <SkillsForm />;
    case "languages":
      return <LanguagesForm />;
    case "education":
      return <EducationForm />;
    default:
      return <PersonalForm />;
  }
}

function SaveIndicator({
  saving,
  dirty,
  lastSavedAt,
}: {
  saving: boolean;
  dirty: boolean;
  lastSavedAt: number | null;
}) {
  const t = useT();
  if (saving) {
    return (
      <span className="inline-flex items-center gap-1.5 text-2xs text-ink-tertiary">
        <Loader2 className="h-3 w-3 animate-spin" />
        {t("common.saving")}
      </span>
    );
  }
  if (dirty) {
    return (
      <span className="inline-flex items-center gap-1.5 text-2xs text-state-warn">
        ●
      </span>
    );
  }
  if (lastSavedAt) {
    return (
      <span className="inline-flex items-center gap-1.5 text-2xs text-state-success">
        <Check className="h-3 w-3" />
        {t("editor.autosaved")}
      </span>
    );
  }
  return null;
}
