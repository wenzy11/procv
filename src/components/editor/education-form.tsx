"use client";

import { GraduationCap, Plus, Trash2 } from "lucide-react";

import { useResumeStore } from "@/store/resume-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/providers/i18n-provider";
import { SectionHeader } from "./section-header";

export function EducationForm() {
  const education = useResumeStore((s) => s.resume?.education ?? []);
  const add = useResumeStore((s) => s.addEducation);
  const update = useResumeStore((s) => s.updateEducation);
  const remove = useResumeStore((s) => s.removeEducation);
  const t = useT();

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="06"
        title={t("editor.education.title")}
        description={t("editor.education.hint")}
        action={
          <Button variant="secondary" size="sm" onClick={add}>
            <Plus className="h-3.5 w-3.5" />
            {t("editor.education.add")}
          </Button>
        }
      />

      {education.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/[0.1] bg-white/[0.02] p-8 text-center">
          <p className="text-sm text-ink-secondary">
            {t("editor.education.emptyTitle")} {t("editor.education.emptyHint")}
          </p>
          <Button variant="primary" size="sm" className="mt-3" onClick={add}>
            <Plus className="h-3.5 w-3.5" />
            {t("editor.education.addFirst")}
          </Button>
        </div>
      ) : null}

      <div className="space-y-3">
        {education.map((edu) => (
          <div
            key={edu.id}
            className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-4"
          >
            <div className="mb-3 flex items-center gap-2 text-ink-secondary">
              <GraduationCap className="h-4 w-4" />
              <span className="text-xs uppercase tracking-[0.12em]">
                {t("editor.steps.education")}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Stack label={t("editor.education.school")}>
                <Input
                  value={edu.school}
                  onChange={(e) => update(edu.id, { school: e.target.value })}
                />
              </Stack>
              <Stack label={t("editor.education.degree")}>
                <Input
                  value={edu.degree}
                  onChange={(e) => update(edu.id, { degree: e.target.value })}
                />
              </Stack>
              <Stack label={t("editor.education.field")}>
                <Input
                  value={edu.field ?? ""}
                  onChange={(e) => update(edu.id, { field: e.target.value })}
                />
              </Stack>
              <div className="grid grid-cols-2 gap-3">
                <Stack label={t("editor.education.start")}>
                  <Input
                    value={edu.startDate}
                    onChange={(e) =>
                      update(edu.id, { startDate: e.target.value })
                    }
                  />
                </Stack>
                <Stack label={t("editor.education.end")}>
                  <Input
                    value={edu.endDate}
                    onChange={(e) =>
                      update(edu.id, { endDate: e.target.value })
                    }
                  />
                </Stack>
              </div>
            </div>
            <div className="mt-3 space-y-1.5">
              <Label>{t("editor.education.notes")}</Label>
              <Textarea
                rows={2}
                value={edu.description ?? ""}
                onChange={(e) =>
                  update(edu.id, { description: e.target.value })
                }
              />
            </div>
            <div className="mt-3 flex items-center justify-end border-t border-white/[0.04] pt-3">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => remove(edu.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t("common.remove")}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Stack({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
