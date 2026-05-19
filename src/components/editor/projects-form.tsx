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
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useResumeStore } from "@/store/resume-store";
import { useT } from "@/components/providers/i18n-provider";
import { AIPolishButton } from "./ai-polish-button";
import { SortableCard } from "./sortable-card";
import { SectionHeader } from "./section-header";

export function ProjectsForm() {
  const projects = useResumeStore((s) => s.resume?.projects ?? []);
  const addProject = useResumeStore((s) => s.addProject);
  const reorderProjects = useResumeStore((s) => s.reorderProjects);
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
    const oldIndex = projects.findIndex((p) => p.id === active.id);
    const newIndex = projects.findIndex((p) => p.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    reorderProjects(arrayMove(projects, oldIndex, newIndex).map((p) => p.id));
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        eyebrow="03"
        title={t("editor.projects.title")}
        description={t("editor.projects.hint")}
        action={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              addProject();
              toast.success(t("editor.projects.added"));
            }}
          >
            <Plus className="h-3.5 w-3.5" />
            {t("editor.projects.addProject")}
          </Button>
        }
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={projects.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-3">
            {projects.map((proj) => (
              <SortableCard key={proj.id} id={proj.id}>
                <ProjectCard id={proj.id} />
              </SortableCard>
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-white/[0.1] bg-white/[0.02] p-8 text-center">
          <p className="text-sm text-ink-secondary">{t("common.empty")}</p>
          <Button
            variant="primary"
            size="sm"
            className="mt-3"
            onClick={addProject}
          >
            <Plus className="h-3.5 w-3.5" />
            {t("editor.projects.addProject")}
          </Button>
        </div>
      ) : null}
    </div>
  );
}

function ProjectCard({ id }: { id: string }) {
  const proj = useResumeStore((s) =>
    s.resume?.projects.find((p) => p.id === id),
  );
  const update = useResumeStore((s) => s.updateProject);
  const remove = useResumeStore((s) => s.removeProject);
  const t = useT();
  const [stackDraft, setStackDraft] = React.useState("");

  if (!proj) return null;

  const addStack = () => {
    const tag = stackDraft.trim();
    if (!tag) return;
    if (proj.stack.some((s) => s.toLowerCase() === tag.toLowerCase())) {
      setStackDraft("");
      return;
    }
    update(proj.id, { stack: [...proj.stack, tag] });
    setStackDraft("");
  };

  return (
    <div className="space-y-4 p-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <FieldStack label={t("editor.projects.name")}>
          <Input
            value={proj.name}
            onChange={(e) => update(proj.id, { name: e.target.value })}
          />
        </FieldStack>
        <FieldStack label={t("editor.projects.url")}>
          <Input
            value={proj.url ?? ""}
            onChange={(e) => update(proj.id, { url: e.target.value })}
          />
        </FieldStack>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>{t("editor.projects.description")}</Label>
          <AIPolishButton
            value={proj.description}
            onPolished={(next) => update(proj.id, { description: next })}
          />
        </div>
        <Textarea
          rows={3}
          value={proj.description}
          onChange={(e) => update(proj.id, { description: e.target.value })}
          placeholder={t("editor.projects.descriptionPlaceholder")}
        />
      </div>

      <div className="space-y-2">
        <Label>{t("editor.projects.stack")}</Label>
        <div className="flex flex-wrap items-center gap-1.5">
          {proj.stack.map((tag) => (
            <Badge key={tag} tone="accent" size="md">
              {tag}
              <button
                type="button"
                className="ml-1 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-accent-200/80 transition-colors hover:bg-white/10 hover:text-accent-100"
                onClick={() =>
                  update(proj.id, {
                    stack: proj.stack.filter((tt) => tt !== tag),
                  })
                }
                aria-label={t("common.removeAria", { name: tag })}
              >
                <X className="h-2.5 w-2.5" />
              </button>
            </Badge>
          ))}
          <Input
            value={stackDraft}
            onChange={(e) => setStackDraft(e.target.value)}
            placeholder={t("editor.projects.addTech")}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addStack();
              }
            }}
            className="h-8 w-44"
          />
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-white/[0.04] pt-3">
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            remove(proj.id);
            toast.message(t("editor.projects.removed"));
          }}
        >
          <Trash2 className="h-3.5 w-3.5" />
          {t("editor.projects.removeProject")}
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
