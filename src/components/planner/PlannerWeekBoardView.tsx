import { useMemo, useEffect, useLayoutEffect, useRef } from "react";
import {
  format,
  parseISO,
  addDays,
  isSameDay,
  setHours,
  setMinutes,
  differenceInMilliseconds,
} from "date-fns";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { CheckCircle2, Circle, Plus, Repeat } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { expandAllRecurring } from "./recurrenceUtils";
import type { PlannerTask } from "./PlannerTaskDialog";
import type { PlannerSpace, SpaceCategory } from "@/hooks/usePlannerSpaces";

interface Props {
  tasks: PlannerTask[];
  /** First day shown in the board (leftmost column) */
  startDate: Date;
  /** Total number of day columns to render */
  dayCount: number;
  isLoading: boolean;
  spaces?: PlannerSpace[];
  categories?: SpaceCategory[];
  onEditTask: (task: PlannerTask) => void;
  onCreateTask?: (defaults: { due_at?: string }) => void;
  onToggleComplete?: (task: PlannerTask) => void;
  onTasksChanged?: () => void;
  /** Bumped by parent to trigger a scroll-to-today */
  scrollToTodayNonce?: number;
}

function getTaskDateKey(task: PlannerTask): string | null {
  const dateStr = task.start_at || task.due_at;
  if (!dateStr) return null;
  return dateStr.slice(0, 10);
}

function formatTime(iso?: string | null): string | null {
  if (!iso) return null;
  const d = parseISO(iso);
  const h = d.getHours();
  const m = d.getMinutes();
  if (h === 0 && m === 0) return null;
  return format(d, "h:mm a").toLowerCase();
}

export const PlannerWeekBoardView = ({
  tasks,
  startDate,
  dayCount,
  isLoading,
  spaces = [],
  categories = [],
  onEditTask,
  onCreateTask,
  onToggleComplete,
  onTasksChanged,
  scrollToTodayNonce,
}: Props) => {
  const days = useMemo(
    () => Array.from({ length: dayCount }, (_, i) => addDays(startDate, i)),
    [startDate, dayCount]
  );

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

  const todayStr = format(new Date(), "yyyy-MM-dd");
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const todayColRef = useRef<HTMLDivElement | null>(null);

  // Scroll today's column into the leftmost visible position when nonce changes
  useEffect(() => {
    if (!scrollerRef.current || !todayColRef.current) return;
    const scroller = scrollerRef.current;
    const col = todayColRef.current;
    scroller.scrollTo({ left: col.offsetLeft - scroller.offsetLeft, behavior: "smooth" });
  }, [scrollToTodayNonce]);

  // Auto-snap today to leftmost on first render after data is ready.
  // Uses a ref guard so we only do this once per mount, but waits until
  // the scroller + today column actually exist (after isLoading flips false).
  const didInitialScrollRef = useRef(false);
  useLayoutEffect(() => {
    if (didInitialScrollRef.current) return;
    if (isLoading) return;
    if (!scrollerRef.current || !todayColRef.current) return;
    const scroller = scrollerRef.current;
    const col = todayColRef.current;
    scroller.scrollLeft = col.offsetLeft - scroller.offsetLeft;
    didInitialScrollRef.current = true;
  }, [isLoading, dayCount]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div ref={scrollerRef} className="flex gap-3 p-4 h-full overflow-x-auto bg-muted/20">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayTasks = tasksByDay[key] || [];
          const isToday = key === todayStr;
          const isWeekend = day.getDay() === 0 || day.getDay() === 6;

          return (
            <div
              key={key}
              ref={isToday ? todayColRef : undefined}
              className={cn(
                "flex flex-col w-[280px] min-w-[260px] shrink-0 rounded-xl border p-3",
                isToday
                  ? "bg-primary/5 border-primary/30"
                  : isWeekend
                  ? "bg-muted/40 border-border"
                  : "bg-card border-border"
              )}
            >
              {/* Editorial day header */}
              <div
                className={cn(
                  "flex items-baseline gap-2 pb-2.5 mb-3 border-b",
                  isToday ? "border-b-2 border-primary" : "border-border"
                )}
              >
                <div
                  className={cn(
                    "font-serif italic font-medium text-3xl leading-none tracking-tight",
                    isToday ? "text-primary" : "text-foreground"
                  )}
                >
                  {format(day, "d")}
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className={cn(
                      "text-[11px] font-semibold uppercase tracking-[0.1em]",
                      isToday ? "text-primary" : isWeekend ? "text-muted-foreground" : "text-foreground/80"
                    )}
                  >
                    {format(day, "EEE")}
                  </div>
                  {isToday && (
                    <div className="font-serif italic text-[11px] text-muted-foreground mt-0.5">today</div>
                  )}
                </div>
              </div>

              <Droppable droppableId={key}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex-1 overflow-y-auto space-y-2 rounded-lg transition-colors min-h-[80px]",
                      snapshot.isDraggingOver && "bg-accent/40 ring-2 ring-primary/20"
                    )}
                  >
                    {dayTasks.length === 0 && !snapshot.isDraggingOver && (
                      <div className="text-center py-6 px-2 font-serif italic text-sm text-muted-foreground">
                        A clear page.
                      </div>
                    )}
                    {dayTasks.map((task, idx) => {
                      const space = spaces.find((s) => s.id === (task as any).space_id);
                      const cat = categories.find((c) => c.id === task.category);
                      const isDone = task.column_id === "done";
                      const time = formatTime(task.start_at);
                      const isRecurring = !!(task as any)._isVirtualRecurrence || !!task.recurrence_rule;
                      const draggableId = task.id;
                      const accent = space?.color || cat?.color || "hsl(var(--primary))";

                      return (
                        <Draggable key={draggableId} draggableId={draggableId} index={idx}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              {...dragProvided.dragHandleProps}
                              className={cn(
                                "rounded-lg border border-border bg-background p-2.5 hover:shadow-sm transition-all cursor-pointer group",
                                isDone && "opacity-60",
                                dragSnapshot.isDragging && "shadow-lg ring-2 ring-primary/30"
                              )}
                              style={{ borderLeft: `3px solid ${accent}` }}
                              onClick={() => onEditTask(task)}
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                {time ? (
                                  <span className="font-mono text-[10.5px] font-semibold tracking-wide text-foreground/70">
                                    {time}
                                  </span>
                                ) : (
                                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                                    All day
                                  </span>
                                )}
                                <button
                                  className="shrink-0"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleComplete?.(task);
                                  }}
                                >
                                  {isDone ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                  ) : (
                                    <Circle className="w-3.5 h-3.5 text-muted-foreground hover:text-primary" />
                                  )}
                                </button>
                              </div>
                              <p
                                className={cn(
                                  "text-[12.5px] font-medium leading-snug text-foreground",
                                  isDone && "line-through text-muted-foreground"
                                )}
                              >
                                {task.title}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                                {space && (
                                  <span
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold tracking-wide"
                                    style={{ background: `${space.color}1a`, color: space.color }}
                                  >
                                    <span className="w-1 h-1 rounded-full" style={{ background: space.color }} />
                                    {space.name}
                                  </span>
                                )}
                                {cat && (
                                  <span
                                    className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                                    style={{ background: `${cat.color}1a`, color: cat.color }}
                                  >
                                    {cat.name}
                                  </span>
                                )}
                                {isRecurring && (
                                  <Repeat className="w-3 h-3 text-muted-foreground" />
                                )}
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
                className="mt-2 w-full px-2 py-1.5 rounded-lg border border-dashed border-border text-[11.5px] font-medium text-muted-foreground hover:border-primary/60 hover:text-primary hover:bg-primary/5 transition-colors"
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
