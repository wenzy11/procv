"use client";

import * as React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { useT } from "@/components/providers/i18n-provider";
import { cn } from "@/lib/cn";
import { formatRelative } from "@/lib/i18n/format";
import type { ApplicationStatus, JobApplication } from "@/lib/types";

const STATUSES: ApplicationStatus[] = [
  "saved",
  "applied",
  "interview",
  "offer",
  "rejected",
];

const STATUS_TONE: Record<
  ApplicationStatus,
  "neutral" | "accent" | "success" | "violet" | "danger"
> = {
  saved: "neutral",
  applied: "accent",
  interview: "violet",
  offer: "success",
  rejected: "danger",
};

export function ApplicationKanban({
  apps,
  onOpen,
  onStatusChange,
}: {
  apps: JobApplication[];
  onOpen: (app: JobApplication) => void;
  onStatusChange: (app: JobApplication, status: ApplicationStatus) => void;
}) {
  const t = useT();
  const [activeId, setActiveId] = React.useState<string | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const activeApp = apps.find((a) => a.id === activeId);

  const byStatus = (status: ApplicationStatus) =>
    apps.filter((a) => a.status === status);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;
    const appId = String(active.id);
    const newStatus = String(over.id) as ApplicationStatus;
    if (!STATUSES.includes(newStatus)) return;
    const app = apps.find((a) => a.id === appId);
    if (!app || app.status === newStatus) return;
    onStatusChange(app, newStatus);
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {STATUSES.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            apps={byStatus(status)}
            onOpen={onOpen}
          />
        ))}
      </div>
      <DragOverlay>
        {activeApp ? (
          <KanbanCard app={activeApp} dragging onOpen={() => {}} />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  status,
  apps,
  onOpen,
}: {
  status: ApplicationStatus;
  apps: JobApplication[];
  onOpen: (app: JobApplication) => void;
}) {
  const t = useT();
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex min-h-[220px] flex-col rounded-lg border bg-white/[0.02] transition-colors",
        isOver
          ? "border-accent-400/40 bg-accent-500/5"
          : "border-white/[0.06]",
      )}
    >
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2.5">
        <span className="text-2xs font-semibold uppercase tracking-[0.12em] text-ink-tertiary">
          {t(`applications.status.${status}`)}
        </span>
        <Badge tone={STATUS_TONE[status]} size="sm">
          {apps.length}
        </Badge>
      </div>
      <ul className="flex flex-1 flex-col gap-2 p-2">
        {apps.length === 0 ? (
          <li className="px-2 py-8 text-center text-2xs text-ink-muted">
            {t("applications.dropHere")}
          </li>
        ) : (
          apps.map((app) => (
            <li key={app.id}>
              <DraggableCard app={app} onOpen={onOpen} />
            </li>
          ))
        )}
      </ul>
    </div>
  );
}

function DraggableCard({
  app,
  onOpen,
}: {
  app: JobApplication;
  onOpen: (app: JobApplication) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: app.id });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  return (
    <div ref={setNodeRef} style={style} className={cn(isDragging && "opacity-40")}>
      <KanbanCard app={app} onOpen={onOpen} dragHandleProps={{ ...attributes, ...listeners }} />
    </div>
  );
}

function KanbanCard({
  app,
  onOpen,
  dragging,
  dragHandleProps,
}: {
  app: JobApplication;
  onOpen: (app: JobApplication) => void;
  dragging?: boolean;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}) {
  const t = useT();

  return (
    <div
      className={cn(
        "rounded-md border border-white/[0.06] bg-surface-card p-3 shadow-panel",
        dragging && "ring-2 ring-accent-400/50",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-0.5 shrink-0 cursor-grab text-ink-muted active:cursor-grabbing"
          aria-label={t("common.reorderAria")}
          {...dragHandleProps}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="min-w-0 flex-1 text-left"
          onClick={() => onOpen(app)}
        >
          <p className="truncate text-sm font-medium text-ink-primary">
            {app.company}
          </p>
          <p className="mt-0.5 truncate text-xs text-ink-secondary">{app.role}</p>
          {app.location ? (
            <p className="mt-1 truncate text-2xs text-ink-tertiary">{app.location}</p>
          ) : null}
          {typeof app.matchStrength === "number" ? (
            <p className="mt-2 text-2xs font-medium text-accent-300">
              {t("applications.matchBadge", { value: app.matchStrength })}
            </p>
          ) : null}
          <p className="mt-1 text-2xs text-ink-muted">
            {formatRelative(t, app.updatedAt)}
          </p>
        </button>
      </div>
    </div>
  );
}
