/**
 * ProCV — Domain Types
 * ---------------------------------------------------------------------------
 * Pure data contracts. Nothing in this file imports React or UI libraries so
 * the same shapes can be used both client-side and (eventually) by the
 * backend/LLM service.
 */

export type ID = string;

export type ISODate = string; // "YYYY-MM" or "YYYY-MM-DD"

export interface PersonalInfo {
  fullName: string;
  headline: string;
  email: string;
  phone: string;
  location: string;
  website?: string;
  linkedin?: string;
  github?: string;
  summary: string;
}

export interface WorkExperience {
  id: ID;
  role: string;
  company: string;
  location?: string;
  startDate: ISODate;
  endDate: ISODate | "Present";
  description: string;
  highlights: string[];
}

export interface Project {
  id: ID;
  name: string;
  url?: string;
  description: string;
  stack: string[];
}

export type SkillLevel = "Beginner" | "Intermediate" | "Advanced" | "Expert";

export interface Skill {
  id: ID;
  name: string;
  level: SkillLevel;
  category?: string;
}

export type LanguageProficiency =
  | "Native"
  | "Fluent"
  | "Professional"
  | "Conversational"
  | "Elementary";

export interface Language {
  id: ID;
  name: string;
  proficiency: LanguageProficiency;
}

export interface Education {
  id: ID;
  school: string;
  degree: string;
  field?: string;
  startDate: ISODate;
  endDate: ISODate | "Present";
  description?: string;
}

/** Visual layout used by the live preview and PDF export. */
export type ResumeTemplateId =
  | "classic"
  | "modern"
  | "minimal"
  | "executive"
  | "creative"
  | "compact"
  | "elegant"
  | "bold"
  | "stripe"
  | "ats";

export interface ResumeDocument {
  id: ID;
  title: string;
  updatedAt: string;
  /** Defaults to `classic` when absent in older Firestore docs. */
  templateId?: ResumeTemplateId;
  personal: PersonalInfo;
  experience: WorkExperience[];
  projects: Project[];
  skills: Skill[];
  languages: Language[];
  education: Education[];
  /** Persisted job description for matching (per résumé). */
  jobDescription?: string;
  /** Last LLM ATS score (0–100), written after analyze. */
  lastAtsScore?: number;
  /** ISO timestamp of the last ATS analyze run. */
  lastAtsScoredAt?: string;
}

/* -------------------------------------------------------------------------
 * ATS / Scoring contracts
 * --------------------------------------------------------------------- */

export type SuggestionSeverity = "critical" | "warning" | "info";

export interface AISuggestion {
  id: ID;
  title: string;
  description: string;
  severity: SuggestionSeverity;
  /** Which section this maps to so the UI can deep-link the user. */
  target:
    | "personal"
    | "summary"
    | "experience"
    | "projects"
    | "skills"
    | "languages"
    | "education"
    | "global";
  /** A short label shown on the Quick-Apply button. */
  actionLabel: string;
}

export interface ATSScore {
  total: number; // 0..100
  breakdown: {
    keywordCoverage: number;
    formatting: number;
    impactLanguage: number;
    completeness: number;
    readability: number;
  };
}

export interface KeywordMatchResult {
  matched: string[];
  missing: string[];
  /** 0..100 — overall strength of match. */
  strength: number;
  /** Category-bucketed matches, ready to feed a bar chart. */
  categories: Array<{ name: string; matched: number; missing: number }>;
}

/* -------------------------------------------------------------------------
 * Editor / UX state
 * --------------------------------------------------------------------- */

export type EditorSection =
  | "personal"
  | "summary"
  | "experience"
  | "projects"
  | "skills"
  | "languages"
  | "education";

export interface EditorStep {
  id: EditorSection;
  label: string;
  hint: string;
}
