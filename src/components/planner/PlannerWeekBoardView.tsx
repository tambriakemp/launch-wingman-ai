import { useMemo, useLayoutEffect, useRef } from "react";
import {
  format,
  parseISO,
  isSameDay,
  setHours,
  setMinutes,
  differenceInMilliseconds,
  startOfDay,
  isBefore,
} from "date-fns";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { expandAllRecurring } from "./recurrenceUtils";
import type { PlannerTask } from "./PlannerTaskDialog";
import type { PlannerSpace, SpaceCategory } from "@/hooks/usePlannerSpaces";

const DEFAULT_SPACE_COLOR = "#94a3b8";

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getSpaceForTask(task: PlannerTask, spaces: PlannerSpace[]): PlannerSpace | null {
  const sid = (task as any).space_id;
  if (!sid) return null;
  return spaces.find((s) => s.id === sid) || null;
}

interface Props {
  tasks: PlannerTask[];
  /** The days to render */
  days: Date[];
  /** Date to scroll into view (centered) */
  anchorDate?: Date;
  /** Bump to re-trigger scroll-to-anchor */
  scrollToAnchorNonce?: number;
  isLoading: boolean;
  spaces?: PlannerSpace[];
  categories?: SpaceCategory[];
  onEditTask: (task: PlannerTask) => void;
  onCreateTask?: (defaults: { due_at?: string }) => void;
  onToggleComplete?: (task: PlannerTask) => void;
  onTasksChanged?: () => void;
}

function getTaskDateKey(task: PlannerTask): string | null {
  const dateStr = task.start_at || task.due_at;
  if (!dateStr) return null;
  return dateStr.slice(0, 10);
}

function isAllDay(task: PlannerTask): boolean {
  if (!task.start_at) return true;
  const d = parseISO(task.start_at);
  return d.getHours() === 0 && d.getMinutes() === 0;
}

function formatTimeRange(task: PlannerTask): string | null {
  if (!task.start_at) return null;
  const start = parseISO(task.start_at);
  if (start.getHours() === 0 && start.getMinutes() === 0) return null;
  const timeStr = format(start, "h:mm a");
  if (task.end_at) {
    const end = parseISO(task.end_at);
    const minutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
    if (minutes > 0) return `${timeStr} · ${minutes}m`;
  }
  return timeStr;
}

export const PlannerWeekBoardView = ({
  tasks,
  days,
  anchorDate,
  scrollToAnchorNonce,
  isLoading,
  spaces = [],
  categories = [],
  onEditTask,
  onCreateTask,
  onToggleComplete,
  onTasksChanged,
}: Props) => {
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const dayRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const anchorKey = anchorDate ? format(anchorDate, "yyyy-MM-dd") : null;

  useLayoutEffect(() => {
    if (!anchorKey) return;
    const el = dayRefs.current[anchorKey];
    const container = scrollContainerRef.current;
    if (!el || !container) return;
    // Snap anchor day to the left edge of the scroll container
    const offset = el.offsetLeft - container.offsetLeft;
    container.scrollTo({ left: Math.max(0, offset), behavior: "smooth" });
  }, [anchorKey, scrollToAnchorNonce]);

  const rangeStart = days[0];
  const rangeEnd = days[days.length - 1];

  const expanded = useMemo(
    () => expandAllRecurring(tasks, rangeStart, rangeEnd),
    [tasks, rangeStart, rangeEnd]
  );

  const tasksByDay = useMemo(() => {
    const map: Record<string, PlannerTask[]> = {};
    days.forEach((d) => (map[format(d, "yyyy-MM-dd")] = []));
    for (const t of expanded) {
      const key = getTaskDateKey(t);
      if (key && map[key]) map[key].push(t);
    }
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => {
        const aT = a.start_at ? parseISO(a.start_at).getTime() : 0;
        const bT = b.start_at ? parseISO(b.start_at).getTime() : 0;
        return aT - bT;
      });
    });
    return map;
  }, [expanded, days]);

  const handleDragEnd = async (result: DropResult) => {
    const { draggableId, destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const task = expanded.find((t) => t.id === draggableId);
    if (!task) return;
    if ((task as any)._isVirtualRecurrence) {
      toast.error("Can't move recurring instance — edit the series instead");
      return;
    }

    const targetDay = destination.droppableId;
    const [y, mo, d] = targetDay.split("-").map(Number);
    const updates: Record<string, any> = {};

    if (task.start_at && task.end_at) {
      const oldStart = parseISO(task.start_at);
      const oldEnd = parseISO(task.end_at);
      const duration = differenceInMilliseconds(oldEnd, oldStart);
      const newStart = new Date(y, mo - 1, d, oldStart.getHours(), oldStart.getMinutes());
      const newEnd = new Date(newStart.getTime() + duration);
      updates.start_at = newStart.toISOString();
      updates.end_at = newEnd.toISOString();
      updates.due_at = newStart.toISOString();
    } else if (task.due_at) {
      const oldDue = parseISO(task.due_at);
      const newDue = new Date(y, mo - 1, d, oldDue.getHours(), oldDue.getMinutes());
      updates.due_at = newDue.toISOString();
    } else {
      const newDue = new Date(y, mo - 1, d, 9, 0);
      updates.due_at = newDue.toISOString();
    }

    const { error } = await supabase.from("tasks").update(updates).eq("id", task.id);
    if (error) {
      toast.error("Failed to move task");
      return;
    }
    onTasksChanged?.();
  };

  const today = new Date();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div
        ref={scrollContainerRef}
        className="flex gap-3 p-6 md:p-8 pt-6 w-full h-full overflow-x-auto overflow-y-hidden"
      >
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDay[key] || [];
          const isToday = isSameDay(day, today);
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;
          const allDayTasks = dayTasks.filter(isAllDay);
          const scheduledTasks = dayTasks.filter((t) => !isAllDay(t));

          return (
            <div
              key={key}
              ref={(el) => { dayRefs.current[key] = el; }}
              className={cn(
                "flex flex-col w-[260px] shrink-0 rounded-xl border border-[hsl(var(--border-hairline))] p-3.5 pb-4 overflow-y-auto",
                isToday
                  ? "bg-[hsl(var(--terracotta-500)/0.04)]"
                  : isWeekend
                  ? "bg-[hsl(var(--ink-900)/0.015)]"
                  : "bg-[hsl(var(--paper-100))]"
              )}
            >
              {/* Day header */}
              <div
                className={cn(
                  "flex items-baseline gap-2 pb-2.5 mb-3 border-b",
                  isToday ? "border-b-2 border-[hsl(var(--terracotta-500))]" : "border-[hsl(var(--border-hairline))]"
                )}
              >
                <div
                  className={cn(
                    "font-serif italic font-medium text-[28px] leading-none tracking-tight",
                    isToday ? "text-[hsl(var(--terracotta-500))]" : "text-foreground"
                  )}
                >
                  {format(day, "d")}
                </div>
                <div className="flex-1 min-w-0 flex items-baseline gap-2">
                  <div
                    className={cn(
                      "text-[11px] font-semibold uppercase tracking-[0.1em]",
                      isToday
                        ? "text-[hsl(var(--terracotta-500))]"
                        : isWeekend
                        ? "text-muted-foreground"
                        : "text-foreground/80"
                    )}
                  >
                    {format(day, "EEE")}
                  </div>
                  {isToday && (
                    <div className="font-serif italic text-[11px] text-muted-foreground">today</div>
                  )}
                </div>
              </div>

              <Droppable droppableId={key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex-1 flex flex-col gap-2 rounded-lg transition-colors min-h-[60px] content-start",
                      snapshot.isDraggingOver && "ring-2 ring-[hsl(var(--terracotta-500))/0.3] bg-[hsl(var(--terracotta-500))/0.04]"
                    )}
                  >
                    {dayTasks.length === 0 && !snapshot.isDraggingOver && (
                      <div className="text-center py-6 px-2 font-serif italic text-[13px] text-muted-foreground">
                        A clear page.
                      </div>
                    )}
                    {[...allDayTasks, ...scheduledTasks].map((task, idx) => {
                      const source = getTaskSource(task, spaces, categories);
                      const h = SOURCE_HUES[source];
                      const isDone = task.column_id === "done";
                      const timeLabel = formatTimeRange(task);
                      const isAll = !timeLabel;
                      const isRecurring = !!(task as any)._isVirtualRecurrence || !!task.recurrence_rule;
                      const draggableId = task.id;

                      return (
                        <Draggable key={draggableId} draggableId={draggableId} index={idx}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className={cn(
                                "rounded-lg border border-[hsl(var(--border-hairline))] bg-card grid px-2.5 cursor-pointer transition-all hover:-translate-y-px",
                                isAll ? "gap-0.5 py-1.5" : "gap-1.5 py-2",
                                "hover:shadow-[0_4px_14px_-8px_rgba(31,27,23,0.18)]",
                                dragSnapshot.isDragging && "shadow-lg"
                              )}
                              style={{
                                borderLeft: `3px solid ${h.dot}`,
                                opacity: isDone ? 0.55 : 1,
                              }}
                              onClick={() => onEditTask(task)}
                            >
                              {/* Top row: time + checkbox */}
                              <div className="flex items-center justify-between gap-2">
                                {isAll ? (
                                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                    All day
                                  </span>
                                ) : (
                                  <span className="font-mono text-[10.5px] font-semibold tracking-wide text-foreground/70">
                                    {timeLabel}
                                  </span>
                                )}
                                <button
                                  type="button"
                                  className="shrink-0 inline-flex items-center justify-center w-3.5 h-3.5 rounded-[4px]"
                                  style={{
                                    border: `1.5px solid ${isDone ? h.dot : "hsl(var(--border-hairline))"}`,
                                    background: isDone ? h.dot : "transparent",
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleComplete?.(task);
                                  }}
                                  aria-label={isDone ? "Mark as not done" : "Mark as done"}
                                >
                                  {isDone && (
                                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                                      <path d="M2 6.5L4.5 9L10 3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                  )}
                                </button>
                              </div>

                              {/* Title */}
                              <div
                                className={cn(
                                  "text-[12.5px] font-medium leading-snug text-foreground",
                                  isDone && "line-through decoration-foreground/40"
                                )}
                              >
                                {task.title}
                              </div>

                              {/* Source pill */}
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded-full text-[10.5px] font-semibold tracking-wide whitespace-nowrap"
                                  style={{ background: h.bg, color: h.fg }}
                                >
                                  <span className="w-[5px] h-[5px] rounded-full" style={{ background: h.dot }} />
                                  {source}
                                </span>
                                {isRecurring && <Repeat className="w-3 h-3 text-muted-foreground" />}
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>

              <button
                type="button"
                className="mt-2.5 w-full px-2 py-2 rounded-lg border border-dashed border-[hsl(var(--border-hairline))] text-[11.5px] font-medium text-muted-foreground hover:border-[hsl(var(--terracotta-500))] hover:text-[hsl(var(--terracotta-500))] hover:bg-[hsl(var(--terracotta-500)/0.06)] transition-colors"
                onClick={() => {
                  const d = setMinutes(setHours(new Date(day), 9), 0);
                  onCreateTask?.({ due_at: d.toISOString() });
                }}
              >
                + Add
              </button>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};
