"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";

import { uid } from "@/lib/id";
import { patchResume } from "@/lib/firebase/resumes";
import { hashResumeContent } from "@/lib/ats/resume-content-hash";
import type {
  AISuggestion,
  ATSScore,
  EditorSection,
  Language,
  Project,
  ResumeDocument,
  ResumeTemplateId,
  Skill,
  WorkExperience,
} from "@/lib/types";

/**
 * Editor store — single source of truth for the *currently open* résumé.
 *
 * Persistence is delegated to a debounced effect that writes back to
 * Firestore whenever the in-memory document changes (see `usePersistResume`
 * in `components/editor/use-persist-resume.ts`).
 *
 * Components select narrow slices via stable selectors to minimise re-renders.
 */

interface ResumeStoreState {
  /** UID of the signed-in user that owns the loaded resume. */
  ownerUid: string | null;
  resume: ResumeDocument | null;
  activeSection: EditorSection;
  jobDescription: string;
  busy: Record<string, boolean>;
  /** Local "dirty" flag so the autosave hook knows when to write back. */
  dirty: boolean;
}

interface ResumeStoreActions {
  /**
   * Initial mount only — sets the owner, the resume, and resets all
   * transient UI state (active section, JD, busy flags). Use exactly once
   * per editor open.
   */
  hydrate: (ownerUid: string, resume: ResumeDocument) => void;

  /**
   * Apply a *remote* version of the same resume without resetting UI state.
   * Used by the Firestore subscription on every snapshot AFTER the initial
   * load. Crucially preserves `activeSection` so the user stays on the step
   * they were editing while autosave round-trips happen in the background.
   */
  replaceResume: (resume: ResumeDocument) => void;

  reset: () => void;

  setActiveSection: (s: EditorSection) => void;
  setJobDescription: (jd: string) => void;
  setBusy: (key: string, value: boolean) => void;

  setTitle: (title: string) => void;
  setTemplateId: (templateId: ResumeTemplateId) => void;
  setAtsScore: (total: number) => void;
  setAtsAnalysisResult: (
    score: ATSScore,
    suggestions: AISuggestion[],
    locale: string,
  ) => void;

  updatePersonal: (patch: Partial<ResumeDocument["personal"]>) => void;
  setSummary: (text: string) => void;

  addExperience: () => void;
  updateExperience: (id: string, patch: Partial<WorkExperience>) => void;
  removeExperience: (id: string) => void;
  reorderExperience: (orderedIds: string[]) => void;
  updateHighlight: (expId: string, index: number, text: string) => void;
  addHighlight: (expId: string) => void;
  removeHighlight: (expId: string, index: number) => void;

  addProject: () => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  removeProject: (id: string) => void;
  reorderProjects: (orderedIds: string[]) => void;

  addSkill: (name: string) => void;
  updateSkill: (id: string, patch: Partial<Skill>) => void;
  removeSkill: (id: string) => void;

  addLanguage: (name: string) => void;
  updateLanguage: (id: string, patch: Partial<Language>) => void;
  removeLanguage: (id: string) => void;

  addEducation: () => void;
  updateEducation: (id: string, patch: Partial<ResumeDocument["education"][number]>) => void;
  removeEducation: (id: string) => void;

  /** Persist the current resume to Firestore. */
  flush: () => Promise<void>;
}

type Store = ResumeStoreState & ResumeStoreActions;

function touch<T extends ResumeDocument>(r: T): T {
  return { ...r, updatedAt: new Date().toISOString() };
}

export const useResumeStore = create<Store>()(
  subscribeWithSelector((set, get) => ({
    ownerUid: null,
    resume: null,
    activeSection: "personal",
    jobDescription: "",
    busy: {},
    dirty: false,

    hydrate: (ownerUid, resume) =>
      set({
        ownerUid,
        resume,
        activeSection: "personal",
        jobDescription: resume.jobDescription ?? "",
        busy: {},
        dirty: false,
      }),

    /**
     * Replace just the resume payload — never touch UI state.
     * Skips the update if the incoming `updatedAt` is the same as what we
     * already have, so our own autosave echo doesn't trigger an unnecessary
     * re-render of every form field.
     */
    replaceResume: (resume) =>
      set((state) => {
        if (state.resume?.updatedAt === resume.updatedAt) return state;
        return {
          resume,
          jobDescription: resume.jobDescription ?? "",
          dirty: false,
        };
      }),

    reset: () =>
      set({
        ownerUid: null,
        resume: null,
        activeSection: "personal",
        jobDescription: "",
        busy: {},
        dirty: false,
      }),

    setActiveSection: (s) => set({ activeSection: s }),
    setJobDescription: (jd) =>
      set((state) =>
        state.resume
          ? {
              jobDescription: jd,
              resume: touch({ ...state.resume, jobDescription: jd }),
              dirty: true,
            }
          : { jobDescription: jd },
      ),

    setAtsScore: (total) =>
      set((state) =>
        state.resume
          ? {
              resume: touch({
                ...state.resume,
                lastAtsScore: total,
                lastAtsScoredAt: new Date().toISOString(),
              }),
              dirty: true,
            }
          : state,
      ),

    setAtsAnalysisResult: (score, suggestions, locale) =>
      set((state) =>
        state.resume
          ? {
              resume: touch({
                ...state.resume,
                lastAtsScore: score.total,
                lastAtsBreakdown: score.breakdown,
                lastAtsSuggestions: suggestions,
                lastAtsScoredAt: new Date().toISOString(),
                atsContentHash: hashResumeContent(state.resume),
                atsScoredLocale: locale,
              }),
              dirty: true,
            }
          : state,
      ),
    setBusy: (key, value) =>
      set((state) => ({ busy: { ...state.busy, [key]: value } })),

    setTitle: (title) =>
      set((state) =>
        state.resume
          ? { resume: touch({ ...state.resume, title }), dirty: true }
          : state,
      ),

    setTemplateId: (templateId) =>
      set((state) =>
        state.resume
          ? { resume: touch({ ...state.resume, templateId }), dirty: true }
          : state,
      ),

    updatePersonal: (patch) =>
      set((state) =>
        state.resume
          ? {
              resume: touch({
                ...state.resume,
                personal: { ...state.resume.personal, ...patch },
              }),
              dirty: true,
            }
          : state,
      ),

    setSummary: (text) =>
      set((state) =>
        state.resume
          ? {
              resume: touch({
                ...state.resume,
                personal: { ...state.resume.personal, summary: text },
              }),
              dirty: true,
            }
          : state,
      ),

    addExperience: () =>
      set((state) =>
        state.resume
          ? {
              resume: touch({
                ...state.resume,
                experience: [
                  {
                    id: uid("exp"),
                    role: "",
                    company: "",
                    location: "",
                    startDate: "",
                    endDate: "Present",
                    description: "",
                    highlights: [""],
                  },
                  ...state.resume.experience,
                ],
              }),
              dirty: true,
            }
          : state,
      ),

    updateExperience: (id, patch) =>
      set((state) =>
        state.resume
          ? {
              resume: touch({
                ...state.resume,
                experience: state.resume.experience.map((e) =>
                  e.id === id ? { ...e, ...patch } : e,
                ),
              }),
              dirty: true,
            }
          : state,
      ),

    removeExperience: (id) =>
      set((state) =>
        state.resume
          ? {
              resume: touch({
                ...state.resume,
                experience: state.resume.experience.filter((e) => e.id !== id),
              }),
              dirty: true,
            }
          : state,
      ),

    reorderExperience: (orderedIds) =>
      set((state) => {
        if (!state.resume) return state;
        const lookup = new Map(state.resume.experience.map((e) => [e.id, e]));
        const next = orderedIds
          .map((id) => lookup.get(id))
          .filter((e): e is WorkExperience => Boolean(e));
        return {
          resume: touch({ ...state.resume, experience: next }),
          dirty: true,
        };
      }),

    updateHighlight: (expId, index, text) =>
      set((state) => {
        if (!state.resume) return state;
        return {
          resume: touch({
            ...state.resume,
            experience: state.resume.experience.map((e) => {
              if (e.id !== expId) return e;
              const highlights = [...e.highlights];
              highlights[index] = text;
              return { ...e, highlights };
            }),
          }),
          dirty: true,
        };
      }),

    addHighlight: (expId) =>
      set((state) =>
        state.resume
          ? {
              resume: touch({
                ...state.resume,
                experience: state.resume.experience.map((e) =>
                  e.id === expId
                    ? { ...e, highlights: [...e.highlights, ""] }
                    : e,
                ),
              }),
              dirty: true,
            }
          : state,
      ),

    removeHighlight: (expId, index) =>
      set((state) =>
        state.resume
          ? {
              resume: touch({
                ...state.resume,
                experience: state.resume.experience.map((e) => {
                  if (e.id !== expId) return e;
                  return {
                    ...e,
                    highlights: e.highlights.filter((_, i) => i !== index),
                  };
                }),
              }),
              dirty: true,
            }
          : state,
      ),

    addProject: () =>
      set((state) =>
        state.resume
          ? {
              resume: touch({
                ...state.resume,
                projects: [
                  {
                    id: uid("proj"),
                    name: "",
                    url: "",
                    description: "",
                    stack: [],
                  },
                  ...state.resume.projects,
                ],
              }),
              dirty: true,
            }
          : state,
      ),

    updateProject: (id, patch) =>
      set((state) =>
        state.resume
          ? {
              resume: touch({
                ...state.resume,
                projects: state.resume.projects.map((p) =>
                  p.id === id ? { ...p, ...patch } : p,
                ),
              }),
              dirty: true,
            }
          : state,
      ),

    removeProject: (id) =>
      set((state) =>
        state.resume
          ? {
              resume: touch({
                ...state.resume,
                projects: state.resume.projects.filter((p) => p.id !== id),
              }),
              dirty: true,
            }
          : state,
      ),

    reorderProjects: (orderedIds) =>
      set((state) => {
        if (!state.resume) return state;
        const lookup = new Map(state.resume.projects.map((p) => [p.id, p]));
        const next = orderedIds
          .map((id) => lookup.get(id))
          .filter((p): p is Project => Boolean(p));
        return { resume: touch({ ...state.resume, projects: next }), dirty: true };
      }),

    addSkill: (name) =>
      set((state) => {
        if (!state.resume) return state;
        const cleaned = name.trim();
        if (!cleaned) return state;
        if (
          state.resume.skills.some(
            (s) => s.name.toLowerCase() === cleaned.toLowerCase(),
          )
        )
          return state;
        return {
          resume: touch({
            ...state.resume,
            skills: [
              ...state.resume.skills,
              { id: uid("sk"), name: cleaned, level: "Intermediate" },
            ],
          }),
          dirty: true,
        };
      }),

    updateSkill: (id, patch) =>
      set((state) =>
        state.resume
          ? {
              resume: touch({
                ...state.resume,
                skills: state.resume.skills.map((s) =>
                  s.id === id ? { ...s, ...patch } : s,
                ),
              }),
              dirty: true,
            }
          : state,
      ),

    removeSkill: (id) =>
      set((state) =>
        state.resume
          ? {
              resume: touch({
                ...state.resume,
                skills: state.resume.skills.filter((s) => s.id !== id),
              }),
              dirty: true,
            }
          : state,
      ),

    addLanguage: (name) =>
      set((state) => {
        if (!state.resume) return state;
        const cleaned = name.trim();
        if (!cleaned) return state;
        return {
          resume: touch({
            ...state.resume,
            languages: [
              ...state.resume.languages,
              {
                id: uid("ln"),
                name: cleaned,
                proficiency: "Professional",
              },
            ],
          }),
          dirty: true,
        };
      }),

    updateLanguage: (id, patch) =>
      set((state) =>
        state.resume
          ? {
              resume: touch({
                ...state.resume,
                languages: state.resume.languages.map((l) =>
                  l.id === id ? { ...l, ...patch } : l,
                ),
              }),
              dirty: true,
            }
          : state,
      ),

    removeLanguage: (id) =>
      set((state) =>
        state.resume
          ? {
              resume: touch({
                ...state.resume,
                languages: state.resume.languages.filter((l) => l.id !== id),
              }),
              dirty: true,
            }
          : state,
      ),

    addEducation: () =>
      set((state) =>
        state.resume
          ? {
              resume: touch({
                ...state.resume,
                education: [
                  {
                    id: uid("edu"),
                    school: "",
                    degree: "",
                    field: "",
                    startDate: "",
                    endDate: "Present",
                    description: "",
                  },
                  ...state.resume.education,
                ],
              }),
              dirty: true,
            }
          : state,
      ),

    updateEducation: (id, patch) =>
      set((state) =>
        state.resume
          ? {
              resume: touch({
                ...state.resume,
                education: state.resume.education.map((e) =>
                  e.id === id ? { ...e, ...patch } : e,
                ),
              }),
              dirty: true,
            }
          : state,
      ),

    removeEducation: (id) =>
      set((state) =>
        state.resume
          ? {
              resume: touch({
                ...state.resume,
                education: state.resume.education.filter((e) => e.id !== id),
              }),
              dirty: true,
            }
          : state,
      ),

    flush: async () => {
      const { ownerUid, resume } = get();
      if (!ownerUid || !resume) return;
      const { id, updatedAt: _u, ...rest } = resume;
      await patchResume(ownerUid, id, rest);
      set({ dirty: false });
    },
  })),
);
