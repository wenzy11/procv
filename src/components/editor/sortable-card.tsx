"use client";

import * as React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/cn";
import { useT } from "@/components/providers/i18n-provider";

interface SortableCardProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Generic sortable wrapper used by both experience entries and projects.
 *
 * Renders a left-aligned drag handle (so the card body remains fully
 * interactive — typing in a field never starts a drag). While dragging:
 *  - the card is elevated with a subtle glow ring
 *  - the other items below it shift via dnd-kit's default transform
 */
export function SortableCard({ id, children, className }: SortableCardProps) {
  const t = useT();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group relative rounded-lg border border-white/[0.06] bg-white/[0.02] transition-colors",
        "hover:border-white/[0.12]",
        isDragging && "z-20 ring-1 ring-accent-400/40 shadow-glow",
        className,
      )}
    >
      <button
        ref={setActivatorNodeRef}
        type="button"
        aria-label={t("common.reorderAria")}
        className={cn(
          "absolute left-1.5 top-3 inline-flex h-6 w-5 cursor-grab items-center justify-center rounded text-ink-tertiary opacity-0 transition-opacity",
          "group-hover:opacity-100 focus-visible:opacity-100",
          "hover:text-ink-primary active:cursor-grabbing",
        )}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-3.5 w-3.5" />
      </button>
      <div className="pl-5">{children}</div>
    </div>
  );
}
