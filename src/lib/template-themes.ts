import type { ResumeTemplateId } from "@/lib/types";

export interface TemplateTheme {
  sheet: string;
  headline: string;
  accent: string;
  bullet: string;
  sidebar: string;
  skillChip: string;
}

export const TEMPLATE_THEMES: Record<ResumeTemplateId, TemplateTheme> = {
  classic: {
    sheet: "bg-white",
    headline: "text-indigo-700",
    accent: "text-indigo-700",
    bullet: "before:bg-indigo-500",
    sidebar: "pl-7 border-l border-zinc-100",
    skillChip: "border-zinc-200 bg-zinc-50 text-zinc-700",
  },
  modern: {
    sheet: "bg-gradient-to-br from-white to-indigo-50/30",
    headline: "text-indigo-800",
    accent: "text-indigo-700",
    bullet: "before:bg-violet-500",
    sidebar:
      "rounded-lg bg-indigo-600/5 p-4 border border-indigo-100",
    skillChip: "border-indigo-200 bg-indigo-50 text-indigo-800",
  },
  minimal: {
    sheet: "bg-white",
    headline: "text-zinc-800",
    accent: "text-zinc-600",
    bullet: "before:bg-zinc-400",
    sidebar: "mt-6 border-t border-zinc-100 pt-6",
    skillChip: "border-zinc-200 bg-white text-zinc-700",
  },
  executive: {
    sheet: "bg-white",
    headline: "text-slate-800",
    accent: "text-slate-700",
    bullet: "before:bg-slate-600",
    sidebar: "pl-7 border-l-2 border-slate-200",
    skillChip: "border-slate-200 bg-slate-50 text-slate-800",
  },
  creative: {
    sheet: "bg-gradient-to-br from-white via-fuchsia-50/20 to-violet-50/40",
    headline: "text-fuchsia-800",
    accent: "text-violet-700",
    bullet: "before:bg-fuchsia-500",
    sidebar: "rounded-lg bg-fuchsia-500/5 p-4 border border-fuchsia-100",
    skillChip: "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-900",
  },
  compact: {
    sheet: "bg-white text-[15px]",
    headline: "text-zinc-800",
    accent: "text-zinc-700",
    bullet: "before:bg-zinc-500",
    sidebar: "pl-5 border-l border-zinc-200",
    skillChip: "border-zinc-300 bg-zinc-100 text-zinc-800 text-[10px]",
  },
  elegant: {
    sheet: "bg-[#faf9f7]",
    headline: "text-stone-700",
    accent: "text-stone-600",
    bullet: "before:bg-stone-400",
    sidebar: "mt-8 border-t border-stone-200 pt-8",
    skillChip: "border-stone-200 bg-stone-50 text-stone-700",
  },
  bold: {
    sheet: "bg-white",
    headline: "text-rose-800",
    accent: "text-rose-700",
    bullet: "before:bg-rose-500",
    sidebar: "rounded-md bg-rose-500/5 p-4 border border-rose-100",
    skillChip: "border-rose-200 bg-rose-50 text-rose-900",
  },
  stripe: {
    sheet: "bg-white border-l-[6px] border-l-sky-600",
    headline: "text-sky-800",
    accent: "text-sky-700",
    bullet: "before:bg-sky-500",
    sidebar: "pl-6 border-l border-sky-100",
    skillChip: "border-sky-200 bg-sky-50 text-sky-900",
  },
  ats: {
    sheet: "bg-white",
    headline: "text-zinc-900",
    accent: "text-zinc-800",
    bullet: "before:bg-zinc-700",
    sidebar: "pl-6 border-l border-zinc-300",
    skillChip: "border-zinc-300 bg-zinc-100 text-zinc-900 rounded-sm",
  },
};

export function getTemplateTheme(id: ResumeTemplateId): TemplateTheme {
  return TEMPLATE_THEMES[id] ?? TEMPLATE_THEMES.classic;
}
