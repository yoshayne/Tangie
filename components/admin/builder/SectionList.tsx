"use client";

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { SECTION_META, sectionLabelFor } from "@/lib/sections/meta";
import type { DraftSection } from "@/lib/page-builder/types";

type Props = {
  sections: DraftSection[];
  selectedId: string | null;
  problems: Set<string>;
  onSelect: (id: string) => void;
  onReorder: (sections: DraftSection[]) => void;
  onToggleHidden: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onMove: (id: string, delta: number) => void;
  onInsert: (index: number) => void;
};

function InsertSlot({
  onClick,
  label,
}: {
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="group flex h-6 w-full items-center gap-2 text-xs text-stone"
    >
      <span className="h-px flex-1 bg-line group-hover:bg-bronze" />
      <span className="border border-transparent px-2 group-hover:border-bronze group-hover:text-bronze">
        + Add section
      </span>
      <span className="h-px flex-1 bg-line group-hover:bg-bronze" />
    </button>
  );
}

function Card({
  section,
  index,
  total,
  selected,
  problem,
  p,
}: {
  section: DraftSection;
  index: number;
  total: number;
  selected: boolean;
  problem: boolean;
  p: Props;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });
  const meta = SECTION_META[section.type];
  const label = sectionLabelFor(section.type, section.props);
  const btn =
    "flex h-9 w-9 items-center justify-center border border-line bg-white text-sm hover:bg-[#f3efe8]";
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`border bg-white ${selected ? "border-bronze ring-1 ring-bronze" : "border-line"} ${isDragging ? "z-10 opacity-70 shadow-lg" : ""} ${section.hidden ? "opacity-60" : ""}`}
    >
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...attributes}
          {...listeners}
          aria-label={`Drag to reorder ${label}`}
          className="flex h-10 w-8 shrink-0 cursor-grab touch-none items-center justify-center text-stone"
        >
          ⋮⋮
        </button>
        <button
          type="button"
          onClick={() => p.onSelect(section.id)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center bg-sand text-bronze">
            {meta?.icon ?? "?"}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">
              {label}
            </span>
            <span className="block truncate text-xs text-stone">
              {meta?.label ?? section.type}
              {section.hidden ? " · hidden" : ""}
              {problem ? " · needs attention" : ""}
            </span>
          </span>
          {problem ? (
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#9b2c2c]"
              aria-hidden
            />
          ) : null}
        </button>
        <div className="flex shrink-0 gap-1">
          <button
            type="button"
            className={btn}
            aria-label="Move up"
            disabled={index === 0}
            onClick={() => p.onMove(section.id, -1)}
          >
            ↑
          </button>
          <button
            type="button"
            className={btn}
            aria-label="Move down"
            disabled={index === total - 1}
            onClick={() => p.onMove(section.id, 1)}
          >
            ↓
          </button>
          <button
            type="button"
            className={btn}
            aria-label={section.hidden ? "Show section" : "Hide section"}
            aria-pressed={section.hidden}
            title={
              section.hidden
                ? "Hidden. Click to show"
                : "Visible. Click to hide"
            }
            onClick={() => p.onToggleHidden(section.id)}
          >
            {section.hidden ? "🚫" : "👁"}
          </button>
          <button
            type="button"
            className={btn}
            aria-label="Duplicate section"
            title="Duplicate"
            onClick={() => p.onDuplicate(section.id)}
          >
            ⧉
          </button>
          <button
            type="button"
            className={`${btn} text-[#9b2c2c]`}
            aria-label="Delete section"
            title="Delete"
            onClick={() => p.onDelete(section.id)}
          >
            🗑
          </button>
        </div>
      </div>
    </div>
  );
}

export function SectionList(p: Props) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );
  function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const from = p.sections.findIndex((s) => s.id === active.id);
    const to = p.sections.findIndex((s) => s.id === over.id);
    if (from < 0 || to < 0) return;
    p.onReorder(arrayMove(p.sections, from, to));
  }
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext
        items={p.sections.map((s) => s.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-1">
          {p.sections.map((s, i) => (
            <div key={s.id}>
              <InsertSlot
                onClick={() => p.onInsert(i)}
                label={`Add a section before ${sectionLabelFor(s.type, s.props)}`}
              />
              <Card
                section={s}
                index={i}
                total={p.sections.length}
                selected={p.selectedId === s.id}
                problem={p.problems.has(s.id)}
                p={p}
              />
            </div>
          ))}
          <InsertSlot
            onClick={() => p.onInsert(p.sections.length)}
            label="Add a section at the end"
          />
        </div>
      </SortableContext>
    </DndContext>
  );
}
