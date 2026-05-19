import type { EditorSection } from "@/lib/types";

/**
 * Ordered editor sections. Each maps to an i18n key (rendered by the
 * stepper) and an icon-less form component selected in `editor-frame.tsx`.
 */
export interface EditorStepDef {
  id: EditorSection;
  labelKey: string;
  hintKey: string;
}

export const EDITOR_STEPS: EditorStepDef[] = [
  {
    id: "personal",
    labelKey: "editor.steps.personal",
    hintKey: "editor.personal.hint",
  },
  {
    id: "experience",
    labelKey: "editor.steps.experience",
    hintKey: "editor.experience.hint",
  },
  {
    id: "projects",
    labelKey: "editor.steps.projects",
    hintKey: "editor.projects.hint",
  },
  {
    id: "skills",
    labelKey: "editor.steps.skills",
    hintKey: "editor.skills.hint",
  },
  {
    id: "languages",
    labelKey: "editor.steps.languages",
    hintKey: "editor.languages.hint",
  },
  {
    id: "education",
    labelKey: "editor.steps.education",
    hintKey: "editor.education.hint",
  },
];
