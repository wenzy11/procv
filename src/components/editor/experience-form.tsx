"use client";

import * as React from "react";
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useResumeStore } from "@/store/resume-store";
import { useT } from "@/components/providers/i18n-provider";
import { AIPolishButton } from "./ai-polish-button";
import { SortableCard } from "./sortable-card";
import { SectionHeader } from "./section-header";

export function ExperienceForm() {
  const experience = useResumeStore((s) => s.resume?.experience ?? []);
  const addExperience = useResumeStore((s) => s.addExperience);
  const reorderExperience = useResumeStore((s) => s.reorderExperience);
  const t = useT();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = experience.findIndex((e) => e.id === active.id);
    const newIndex = experience.findIndex((e) => e.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    reorderExperience(arrayMove(experience, oldIndex, newIndex).map((e) => e.id));
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="02"
        title={t("editor.experience.title")}
        description={t("editor.experience.hint")}
        action={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              addExperience();
              toast.success(t("editor.experience.added"));
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            {t("editor.experience.addRole")}
          </Button>
        }
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={experience.map((e) => e.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {experience.map((exp) => (
              <SortableCard key={exp.id} id={exp.id}>
                <ExperienceCard id={exp.id} />
              </SortableCard>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {experience.length === 0 ? <EmptyState onAdd={addExperience} /> : null}
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  const t = useT();
  return (
    <div className="rounded-lg border border-dashed border-white/[0.1] bg-white/[0.02] p-8 text-center">
      <p className="text-sm text-ink-secondary">
        {t("editor.experience.emptyTitle")} {t("editor.experience.emptyHint")}
      </p>
      <Button variant="primary" size="sm" className="mt-3" onClick={onAdd}>
        <Plus className="h-3.5 w-3.5" />
        {t("editor.experience.addFirst")}
      </Button>
    </div>
  );
}

function ExperienceCard({ id }: { id: string }) {
  const exp = useResumeStore((s) =>
    s.resume?.experience.find((e) => e.id === id),
  );
  const update = useResumeStore((s) => s.updateExperience);
  const remove = useResumeStore((s) => s.removeExperience);
  const updateHighlight = useResumeStore((s) => s.updateHighlight);
  const addHighlight = useResumeStore((s) => s.addHighlight);
  const removeHighlight = useResumeStore((s) => s.removeHighlight);
  const t = useT();

  if (!exp) return null;

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <FieldStack label={t("editor.experience.role")}>
          <Input
            value={exp.role}
            onChange={(e) => update(exp.id, { role: e.target.value })}
          />
        </FieldStack>
        <FieldStack label={t("editor.experience.company")}>
          <Input
            value={exp.company}
            onChange={(e) => update(exp.id, { company: e.target.value })}
          />
        </FieldStack>
        <FieldStack label={t("editor.experience.location")}>
          <Input
            value={exp.location ?? ""}
            onChange={(e) => update(exp.id, { location: e.target.value })}
          />
        </FieldStack>
        <div className="grid grid-cols-2 gap-3">
          <FieldStack label={t("editor.experience.start")}>
            <Input
              value={exp.startDate}
              onChange={(e) => update(exp.id, { startDate: e.target.value })}
              placeholder="2024-01"
            />
          </FieldStack>
          <FieldStack label={t("editor.experience.end")}>
            <Input
              value={exp.endDate}
              onChange={(e) => update(exp.id, { endDate: e.target.value })}
              placeholder={t("preview.present")}
            />
          </FieldStack>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t("editor.experience.overview")}</Label>
          <AIPolishButton
            value={exp.description}
            onPolished={(next) => update(exp.id, { description: next })}
          />
        </div>
        <Textarea
          rows={2}
          value={exp.description}
          onChange={(e) => update(exp.id, { description: e.target.value })}
          placeholder={t("editor.experience.overviewPlaceholder")}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t("editor.experience.achievements")}</Label>
          <Button size="sm" variant="ghost" onClick={() => addHighlight(exp.id)}>
            <Plus className="h-3.5 w-3.5" />
            {t("editor.experience.bullet")}
          </Button>
        </div>

        <ul className="space-y-2">
          {exp.highlights.map((h, idx) => (
            <li key={idx} className="flex items-start gap-2">
              <span
                aria-hidden
                className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-accent-400/70"
              />
              <Textarea
                rows={1}
                value={h}
                placeholder={t("editor.experience.bulletPlaceholder")}
                onChange={(e) => updateHighlight(exp.id, idx, e.target.value)}
                className="min-h-[40px] flex-1"
              />
              <div className="mt-1 flex flex-col gap-1">
                <AIPolishButton
                  value={h}
                  onPolished={(next) => updateHighlight(exp.id, idx, next)}
                  label={t("editor.polishLabel")}
                />
                <button
                  type="button"
                  onClick={() => removeHighlight(exp.id, idx)}
                  className="inline-flex h-6 items-center justify-center rounded-md border border-white/[0.06] bg-white/[0.02] px-1.5 text-ink-tertiary transition-colors hover:border-state-danger/40 hover:text-state-danger"
                  aria-label={t("editor.experience.removeBullet")}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-white/[0.04] pt-3">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            remove(exp.id);
            toast.message(t("editor.experience.removed"));
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {t("editor.experience.removeRole")}
        </Button>
      </div>
    </div>
  );
}

function FieldStack({
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
