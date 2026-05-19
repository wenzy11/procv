"use client";

import { Mail, MapPin, Phone, Globe, Linkedin, Github } from "lucide-react";

import { useResumeStore } from "@/store/resume-store";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useT } from "@/components/providers/i18n-provider";
import { AIPolishButton } from "./ai-polish-button";
import { SectionHeader } from "./section-header";

export function PersonalForm() {
  const personal = useResumeStore((s) => s.resume?.personal);
  const update = useResumeStore((s) => s.updatePersonal);
  const setSummary = useResumeStore((s) => s.setSummary);
  const t = useT();

  if (!personal) return null;

  return (
    <div className="space-y-7">
      <SectionHeader
        eyebrow="01"
        title={t("editor.personal.title")}
        description={t("editor.personal.hint")}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Field label={t("editor.personal.fullName")}>
          <Input
            value={personal.fullName}
            onChange={(e) => update({ fullName: e.target.value })}
          />
        </Field>
        <Field label={t("editor.personal.headline")}>
          <Input
            value={personal.headline}
            onChange={(e) => update({ headline: e.target.value })}
          />
        </Field>
        <Field label={t("editor.personal.email")}>
          <Input
            type="email"
            value={personal.email}
            leading={<Mail className="h-3.5 w-3.5" />}
            onChange={(e) => update({ email: e.target.value })}
          />
        </Field>
        <Field label={t("editor.personal.phone")}>
          <Input
            value={personal.phone}
            leading={<Phone className="h-3.5 w-3.5" />}
            onChange={(e) => update({ phone: e.target.value })}
          />
        </Field>
        <Field label={t("editor.personal.location")}>
          <Input
            value={personal.location}
            leading={<MapPin className="h-3.5 w-3.5" />}
            onChange={(e) => update({ location: e.target.value })}
          />
        </Field>
        <Field label={t("editor.personal.website")}>
          <Input
            value={personal.website ?? ""}
            leading={<Globe className="h-3.5 w-3.5" />}
            onChange={(e) => update({ website: e.target.value })}
          />
        </Field>
        <Field label={t("editor.personal.linkedin")}>
          <Input
            value={personal.linkedin ?? ""}
            leading={<Linkedin className="h-3.5 w-3.5" />}
            onChange={(e) => update({ linkedin: e.target.value })}
          />
        </Field>
        <Field label={t("editor.personal.github")}>
          <Input
            value={personal.github ?? ""}
            leading={<Github className="h-3.5 w-3.5" />}
            onChange={(e) => update({ github: e.target.value })}
          />
        </Field>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t("editor.personal.summary")}</Label>
          <div className="flex items-center gap-2">
            <Badge tone="neutral" size="sm">
              {personal.summary.length}/420
            </Badge>
            <AIPolishButton
              value={personal.summary}
              onPolished={(next) => setSummary(next)}
            />
          </div>
        </div>
        <Textarea
          rows={5}
          maxLength={420}
          value={personal.summary}
          placeholder={t("editor.personal.summaryPlaceholder")}
          onChange={(e) => setSummary(e.target.value)}
        />
      </div>
    </div>
  );
}

function Field({
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
