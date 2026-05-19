"use client";

import * as React from "react";
import {
  Mail,
  Phone,
  MapPin,
  Globe,
  Linkedin,
  Github,
  Download,
  Printer,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { formatResumeDate } from "@/lib/i18n/dates";
import { downloadResumePdf } from "@/lib/pdf/download-resume-pdf";
import { normalizeTemplateId } from "@/lib/templates";
import { useResumeStore } from "@/store/resume-store";
import { useI18n, useT } from "@/components/providers/i18n-provider";
import { TemplatePicker } from "./template-picker";
import type { LanguageProficiency } from "@/lib/types";

const PROFICIENCY_DOTS: Record<LanguageProficiency, number> = {
  Elementary: 1,
  Conversational: 2,
  Professional: 3,
  Fluent: 4,
  Native: 5,
};

/**
 * Live PDF-style preview pane.
 *
 * Visual goals:
 *   - The white paper *floats* over a calm, contemplative dark canvas — no
 *     busy grid behind it. Visual hierarchy: editor (busy) → preview (calm).
 *   - Typography uses Georgia + system-sans pairing to feel paper-like and
 *     stay legible at any zoom level.
 *   - Multi-layered shadow (`.paper-sheet` in globals.css) gives depth
 *     without competing with the editor's neon accents.
 */
export function CVPreview() {
  const t = useT();
  const { locale } = useI18n();
  const dirty = useResumeStore((s) => s.dirty);
  const resume = useResumeStore((s) => s.resume);
  const [zoom, setZoom] = React.useState(0.84);
  const [exporting, setExporting] = React.useState(false);

  const handleExport = async () => {
    if (!resume) return;
    setExporting(true);
    toast.info(t("preview.exportToast"), {
      description: t("preview.exportToastHint"),
    });
    try {
      const { id: _id, updatedAt: _u, ...payload } = resume;
      await downloadResumePdf(
        {
          ...payload,
          templateId: normalizeTemplateId(resume.templateId),
        },
        locale,
        {
        summary: t("preview.summary"),
        experience: t("preview.experience"),
        projects: t("preview.projects"),
        skills: t("preview.skills"),
        languages: t("preview.languages"),
        education: t("preview.education"),
        present: t("preview.present"),
        stack: t("preview.stack"),
        },
      );
      toast.success(t("preview.exportReady"));
    } catch (err) {
      toast.error(t("preview.exportFailed"), {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setExporting(false);
    }
  };

  if (!resume) return null;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex items-center justify-between gap-3 border-b border-white/[0.06] bg-surface-base/40 px-5 py-3 backdrop-blur">
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium uppercase tracking-[0.12em] text-ink-tertiary">
            {t("preview.title")}
          </span>
          {dirty ? (
            <Badge tone="warning" size="sm">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-state-warn animate-pulse" />
              {t("preview.syncing")}
            </Badge>
          ) : (
            <Badge tone="success" size="sm">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-state-success animate-pulse" />
              {t("preview.synced")}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <TemplatePicker />
          <div className="flex items-center gap-1 rounded-md border border-white/[0.06] bg-white/[0.02] p-0.5">
            <button
              type="button"
              onClick={() =>
                setZoom((z) => Math.max(0.5, +(z - 0.08).toFixed(2)))
              }
              className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] text-ink-tertiary hover:bg-white/[0.06] hover:text-ink-primary"
              aria-label={t("preview.zoomOut")}
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[42px] text-center text-xs text-ink-secondary tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() =>
                setZoom((z) => Math.min(1.4, +(z + 0.08).toFixed(2)))
              }
              className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] text-ink-tertiary hover:bg-white/[0.06] hover:text-ink-primary"
              aria-label={t("preview.zoomIn")}
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => typeof window !== "undefined" && window.print()}
            aria-label={t("preview.print")}
          >
            <Printer className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={exporting}
            onClick={() => void handleExport()}
          >
            <Download className="h-3.5 w-3.5" />
            {t("preview.exportPdf")}
          </Button>
        </div>
      </header>

      <div className="relative flex-1 overflow-auto bg-preview-canvas">
        <div className="flex min-h-full items-start justify-center px-8 py-10">
          <div
            className="origin-top transition-transform duration-200"
            style={{ transform: `scale(${zoom})` }}
          >
            <ResumeSheet />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------------
 * The "paper". Two-column layout:
 *  - Left rail (sidebar):   contact + skills + languages + education
 *  - Right column (main):   summary + experience + projects
 *
 * This mirrors the layout most modern ATS-friendly templates use — keeps
 * dense, scannable detail to the left, narrative content on the right.
 * ------------------------------------------------------------------------- */
function ResumeSheet() {
  const resume = useResumeStore((s) => s.resume);
  const t = useT();
  const { locale } = useI18n();

  if (!resume) return null;
  const p = resume.personal;
  const template = normalizeTemplateId(resume.templateId);
  const present = t("preview.present");
  const fmt = (v: string) => formatResumeDate(v, locale, present);

  return (
    <article
      aria-label={t("common.resumePreviewAria")}
      className={cn(
        "paper-sheet relative w-[816px] min-h-[1056px] text-[#1f2937]",
        template === "modern" && "bg-gradient-to-br from-white to-indigo-50/30",
        template === "minimal" && "bg-white",
      )}
      style={{
        // Pair a humanist sans-serif with a soft serif for headings — gives
        // the document a print-ready feel without sacrificing legibility on
        // screen. Browser falls back gracefully if Inter / Georgia missing.
        fontFamily:
          'Inter, ui-sans-serif, -apple-system, "Segoe UI", Roboto, sans-serif',
      }}
    >
      <header className="px-12 pt-12 pb-7">
        <h1
          className="text-[32px] font-semibold leading-tight tracking-tight text-zinc-900"
          style={{
            fontFamily:
              '"Iowan Old Style", Georgia, "Times New Roman", serif',
          }}
        >
          {p.fullName || "—"}
        </h1>
        {p.headline ? (
          <p className="mt-1.5 text-[14.5px] font-medium text-indigo-700">
            {p.headline}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[12px] text-zinc-600">
          {p.email ? <ContactLine icon={Mail}>{p.email}</ContactLine> : null}
          {p.phone ? <ContactLine icon={Phone}>{p.phone}</ContactLine> : null}
          {p.location ? (
            <ContactLine icon={MapPin}>{p.location}</ContactLine>
          ) : null}
          {p.website ? (
            <ContactLine icon={Globe}>{p.website}</ContactLine>
          ) : null}
          {p.linkedin ? (
            <ContactLine icon={Linkedin}>{p.linkedin}</ContactLine>
          ) : null}
          {p.github ? (
            <ContactLine icon={Github}>{p.github}</ContactLine>
          ) : null}
        </div>
      </header>

      <div
        className={cn(
          "px-12 pb-14",
          template === "minimal"
            ? "flex flex-col gap-7"
            : "grid grid-cols-[2fr_1fr] gap-x-10",
        )}
      >
        {/* ----- MAIN COLUMN ------------------------------------------------ */}
        <main className="space-y-7">
          {p.summary ? (
            <Section title={t("preview.summary")}>
              <p className="text-[13px] leading-[1.7] text-zinc-700">
                {p.summary}
              </p>
            </Section>
          ) : null}

          {resume.experience.length > 0 ? (
            <Section title={t("preview.experience")}>
              <div className="space-y-5">
                {resume.experience.map((exp) => (
                  <article key={exp.id} className="break-inside-avoid">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-[14px] font-semibold text-zinc-900">
                        {exp.role || "—"}
                      </h3>
                      {exp.startDate || exp.endDate ? (
                        <span className="shrink-0 text-[11.5px] tabular-nums font-medium text-zinc-500">
                          {fmt(exp.startDate)}
                          {exp.startDate || exp.endDate ? " – " : ""}
                          {fmt(exp.endDate)}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-0.5 text-[12.5px] font-medium text-indigo-700">
                      {exp.company}
                      {exp.location ? (
                        <span className="font-normal text-zinc-500">
                          {" · "}
                          {exp.location}
                        </span>
                      ) : null}
                    </p>
                    {exp.description ? (
                      <p className="mt-1.5 text-[12.5px] leading-[1.65] text-zinc-700">
                        {exp.description}
                      </p>
                    ) : null}
                    {exp.highlights.some((h) => h.trim()) ? (
                      <ul className="mt-2 space-y-1.5 text-[12.5px] leading-[1.6] text-zinc-700">
                        {exp.highlights.map(
                          (h, i) =>
                            h.trim() && (
                              <li
                                key={i}
                                className="relative pl-4 before:absolute before:left-0 before:top-[10px] before:h-1 before:w-1 before:rounded-full before:bg-indigo-500"
                              >
                                {h}
                              </li>
                            ),
                        )}
                      </ul>
                    ) : null}
                  </article>
                ))}
              </div>
            </Section>
          ) : null}

          {resume.projects.length > 0 ? (
            <Section title={t("preview.projects")}>
              <div className="space-y-4">
                {resume.projects.map((proj) => (
                  <article key={proj.id} className="break-inside-avoid">
                    <div className="flex items-baseline justify-between gap-3">
                      <h3 className="text-[14px] font-semibold text-zinc-900">
                        {proj.name || "—"}
                      </h3>
                      {proj.url ? (
                        <span className="shrink-0 text-[11.5px] text-zinc-500">
                          {proj.url}
                        </span>
                      ) : null}
                    </div>
                    {proj.description ? (
                      <p className="mt-1 text-[12.5px] leading-[1.65] text-zinc-700">
                        {proj.description}
                      </p>
                    ) : null}
                    {proj.stack.length > 0 ? (
                      <p className="mt-1.5 text-[11.5px] text-zinc-500">
                        <span className="font-medium text-zinc-600">
                          {t("preview.stack")}:
                        </span>{" "}
                        {proj.stack.join(" · ")}
                      </p>
                    ) : null}
                  </article>
                ))}
              </div>
            </Section>
          ) : null}
        </main>

        {/* ----- SIDEBAR ---------------------------------------------------- */}
        <aside
          className={cn(
            "space-y-6",
            template === "modern" &&
              "rounded-lg bg-indigo-600/5 p-4 border border-indigo-100",
            template !== "minimal" && template !== "modern" && "pl-7 border-l border-zinc-100",
            template === "minimal" && "mt-6 border-t border-zinc-100 pt-6",
          )}
        >
          {resume.skills.length > 0 ? (
            <Section title={t("preview.skills")}>
              <div className="flex flex-wrap gap-1.5">
                {resume.skills.map((s) => (
                  <span
                    key={s.id}
                    className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-[11.5px] font-medium text-zinc-700"
                  >
                    {s.name}
                  </span>
                ))}
              </div>
            </Section>
          ) : null}

          {resume.languages.length > 0 ? (
            <Section title={t("preview.languages")}>
              <ul className="space-y-1.5">
                {resume.languages.map((l) => (
                  <li
                    key={l.id}
                    className="flex items-center justify-between gap-2 text-[12.5px] text-zinc-700"
                  >
                    <span className="font-medium">{l.name}</span>
                    <span className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={
                            i < PROFICIENCY_DOTS[l.proficiency]
                              ? "h-1.5 w-1.5 rounded-full bg-indigo-500"
                              : "h-1.5 w-1.5 rounded-full bg-zinc-300"
                          }
                        />
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </Section>
          ) : null}

          {resume.education.length > 0 ? (
            <Section title={t("preview.education")}>
              <div className="space-y-3">
                {resume.education.map((edu) => (
                  <div key={edu.id}>
                    <h3 className="text-[12.5px] font-semibold text-zinc-900">
                      {edu.school || "—"}
                    </h3>
                    {edu.degree || edu.field ? (
                      <p className="mt-0.5 text-[11.5px] text-zinc-600">
                        {edu.degree}
                        {edu.field ? `, ${edu.field}` : ""}
                      </p>
                    ) : null}
                    {edu.startDate || edu.endDate ? (
                      <p className="mt-0.5 text-[10.5px] tabular-nums text-zinc-500">
                        {fmt(edu.startDate)}
                        {edu.startDate || edu.endDate ? " – " : ""}
                        {fmt(edu.endDate)}
                      </p>
                    ) : null}
                  </div>
                ))}
              </div>
            </Section>
          ) : null}
        </aside>
      </div>
    </article>
  );
}

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("relative", className)}>
      <h2 className="mb-2.5 text-[10.5px] font-bold uppercase tracking-[0.18em] text-indigo-600">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ContactLine({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon className="h-3 w-3 text-indigo-600" />
      <span className="text-zinc-700">{children}</span>
    </span>
  );
}

