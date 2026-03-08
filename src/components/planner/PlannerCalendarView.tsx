import { useState, useMemo, useEffect, useRef } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  startOfWeek,
  endOfWeek,
  parseISO,
  getHours,
  getMinutes,
  setHours,
  setMinutes,
  isAfter,
  addDays,
} from "date-fns";
import { expandAllRecurring } from "./recurrenceUtils";
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import type { PlannerTask } from "./PlannerTaskDialog";

interface PlannerCalendarViewProps {
  tasks: PlannerTask[];
  isLoading: boolean;
  onEditTask: (task: PlannerTask) => void;
  onCreateTask?: (defaults: { due_at?: string }) => void;
  onToggleComplete?: (task: PlannerTask) => void;
  onDeleteTask?: (taskId: string) => void;
  onAddTask?: () => void;
}

const HOUR_HEIGHT = 64;
const START_HOUR = 6;
const END_HOUR = 22;
const TOTAL_HOURS = END_HOUR - START_HOUR;

const CARD_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "event-business": { bg: "bg-blue-100 dark:bg-blue-900/50", text: "text-blue-800 dark:text-blue-200", border: "border-blue-200 dark:border-blue-700" },
  "event-life": { bg: "bg-emerald-100 dark:bg-emerald-900/50", text: "text-emerald-800 dark:text-emerald-200", border: "border-emerald-200 dark:border-emerald-700" },
  "task-business": { bg: "bg-amber-100 dark:bg-amber-900/50", text: "text-amber-800 dark:text-amber-200", border: "border-amber-200 dark:border-amber-700" },
  "task-life": { bg: "bg-purple-100 dark:bg-purple-900/50", text: "text-purple-800 dark:text-purple-200", border: "border-purple-200 dark:border-purple-700" },
};

function getCardColors(task: PlannerTask) {
  const type = task.task_type || "task";
  const cat = task.category || "business";
  return CARD_COLORS[`${type}-${cat}`] || CARD_COLORS["task-business"];
}

function getTaskPosition(task: PlannerTask) {
  if (!task.start_at || !task.end_at) return null;
  const start = parseISO(task.start_at);
  const end = parseISO(task.end_at);
  const startH = getHours(start) + getMinutes(start) / 60;
  const clampedStart = Math.max(startH, START_HOUR);
  const endH = getHours(end) + getMinutes(end) / 60;
  const clampedEnd = Math.min(endH, END_HOUR);
  if (clampedEnd <= clampedStart) return null;
  const top = (clampedStart - START_HOUR) * HOUR_HEIGHT;
  const height = Math.max((clampedEnd - clampedStart) * HOUR_HEIGHT, 24);
  return { top, height };
}

const DEFAULT_CATEGORIES = [
  { id: "business", name: "Work", color: "#f5c842" },
  { id: "life", name: "Personal", color: "#0ea572" },
  { id: "health", name: "Health", color: "#f43f5e" },
  { id: "finance", name: "Finance", color: "#8b5cf6" },
];

const PRESET_COLORS = [
  "#f5c842", "#0ea572", "#f43f5e", "#8b5cf6",
  "#3b82f6", "#f97316", "#06b6d4", "#ec4899",
  "#84cc16", "#6366f1", "#14b8a6", "#ef4444",
];

function CategoryManager({ categories, onSave, onClose }: {
  categories: { id: string; name: string; color: string }[];
  onSave: (cats: { id: string; name: string; color: string }[]) => void;
  onClose: () => void;
}) {
  const [local, setLocal] = useState(categories);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState(PRESET_COLORS[4]);

  const addCategory = () => {
    if (!newName.trim()) return;
    const id = newName.toLowerCase().replace(/\s+/g, "-") + "-" + Date.now();
    setLocal(prev => [...prev, { id, name: newName.trim(), color: newColor }]);
    setNewName("");
    setNewColor(PRESET_COLORS[4]);
  };

  const removeCategory = (id: string) => {
    setLocal(prev => prev.filter(c => c.id !== id));
  };

  const save = () => {
    localStorage.setItem("planner-categories", JSON.stringify(local));
    onSave(local);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-background border border-border rounded-2xl shadow-xl w-[400px] max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-base">Manage Categories</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">✕</button>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            {local.map(cat => (
              <div key={cat.id} className="flex items-center gap-3 py-2 px-3 rounded-lg border border-border">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ background: cat.color }} />
                <span className="flex-1 text-sm">{cat.name}</span>
                <button
                  onClick={() => removeCategory(cat.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors text-xs"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-4 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add Category</p>
            <input
              className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              placeholder="Category name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === "Enter" && addCategory()}
            />
            <div>
              <p className="text-xs text-muted-foreground mb-2">Color</p>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    className={cn("w-6 h-6 rounded-full border-2 transition-transform hover:scale-110", newColor === c ? "border-foreground" : "border-transparent")}
                    style={{ background: c }}
                    onClick={() => setNewColor(c)}
                  />
                ))}
              </div>
            </div>
            <button
              className="w-full h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
              onClick={addCategory}
            >
              Add Category
            </button>
          </div>
        </div>
        <div className="flex gap-2 px-6 py-4 border-t border-border">
          <button onClick={onClose} className="flex-1 h-9 rounded-lg border border-border text-sm hover:bg-accent transition-colors">Cancel</button>
          <button onClick={save} className="flex-1 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Save</button>
        </div>
      </div>
    </div>
  );
}

export const PlannerCalendarView = ({
  tasks,
  isLoading,
  onEditTask,
  onCreateTask,
  onToggleComplete,
  onDeleteTask,
  onAddTask,
}: PlannerCalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("week");
  const scrollRef = useRef<HTMLDivElement>(null);

  const [categories, setCategories] = useState(() => {
    try {
      const stored = localStorage.getItem("planner-categories");
      return stored ? JSON.parse(stored) : DEFAULT_CATEGORIES;
    } catch { return DEFAULT_CATEGORIES; }
  });
  const [activeCategories, setActiveCategories] = useState<string[]>(() =>
    categories.map((c: typeof DEFAULT_CATEGORIES[0]) => c.id)
  );
  const [showCategoryManager, setShowCategoryManager] = useState(false);

  const toggleCategory = (id: string) => {
    setActiveCategories(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const cat = t.category || "business";
      return activeCategories.includes(cat);
    });
  }, [tasks, activeCategories]);

  // Scroll to ~8 AM on mount
  useEffect(() => {
    if (scrollRef.current && viewMode === "week") {
      scrollRef.current.scrollTop = (8 - START_HOUR) * HOUR_HEIGHT;
    }
  }, [viewMode]);

  // Current time
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const nowHour = getHours(now) + getMinutes(now) / 60;
  const nowTop = (nowHour - START_HOUR) * HOUR_HEIGHT;
  const showNowLine = nowHour >= START_HOUR && nowHour <= END_HOUR;

  // Week
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const windowStart = useMemo(() => {
    if (viewMode === "month") return startOfWeek(startOfMonth(currentDate), { weekStartsOn: 0 });
    if (viewMode === "day") return currentDate;
    return weekStart;
  }, [viewMode, currentDate, weekStart]);

  const windowEnd = useMemo(() => {
    if (viewMode === "month") return endOfWeek(endOfMonth(currentDate), { weekStartsOn: 0 });
    if (viewMode === "day") return addDays(currentDate, 1);
    return weekEnd;
  }, [viewMode, currentDate, weekEnd]);

  const scheduledTasks = useMemo(() => {
    const expanded = expandAllRecurring(filteredTasks, windowStart, windowEnd);
    return expanded.filter(t => t.start_at && t.end_at);
  }, [filteredTasks, windowStart, windowEnd]);

  // Month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthCalStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const monthCalEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const monthDays = eachDayOfInterval({ start: monthCalStart, end: monthCalEnd });

  const getTasksForDay = (day: Date) =>
    scheduledTasks.filter((t) => t.start_at && isSameDay(parseISO(t.start_at), day));

  const handleSlotClick = (day: Date, hour: number) => {
    if (!onCreateTask) return;
    const d = setMinutes(setHours(new Date(day), hour), 0);
    onCreateTask({ due_at: d.toISOString() });
  };

  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);

  const goToday = () => setCurrentDate(new Date());
  const goPrev = () =>
    setCurrentDate(viewMode === "month" ? subMonths(currentDate, 1) : subWeeks(currentDate, 1));
  const goNext = () =>
    setCurrentDate(viewMode === "month" ? addMonths(currentDate, 1) : addWeeks(currentDate, 1));

  const handleMiniDateSelect = (date: Date | undefined) => {
    if (date) setCurrentDate(date);
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* ===== LEFT SIDEBAR ===== */}
      <div className="hidden lg:flex flex-col w-[260px] shrink-0 border-r border-border bg-background overflow-y-auto">
        {/* Mini calendar navigation */}
        <div className="p-4 border-b border-border">
          <Calendar
            mode="single"
            selected={currentDate}
            onSelect={handleMiniDateSelect}
            className="p-0 pointer-events-auto"
          />
        </div>

        {/* Categories section */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categories</span>
            <button
              className="text-[11px] text-primary hover:underline"
              onClick={() => setShowCategoryManager(true)}
            >
              Manage
            </button>
          </div>
          <div className="space-y-1">
            {categories.map((cat: typeof DEFAULT_CATEGORIES[0]) => (
              <button
                key={cat.id}
                className={cn(
                  "flex items-center gap-2.5 w-full px-2 py-1.5 rounded-lg text-sm transition-colors hover:bg-accent/50 text-left",
                  !activeCategories.includes(cat.id) && "opacity-40"
                )}
                onClick={() => toggleCategory(cat.id)}
              >
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: cat.color }} />
                <span className="flex-1 truncate">{cat.name}</span>
                <span className="text-[10px] text-muted-foreground">
                  {tasks.filter(t => t.category === cat.id).length}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming tasks list */}
        <div className="p-4 flex-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">Upcoming</span>
          <div className="space-y-1">
            {tasks
              .filter(t => t.column_id !== "done" && t.due_at && isAfter(parseISO(t.due_at), new Date()))
              .sort((a, b) => parseISO(a.due_at!).getTime() - parseISO(b.due_at!).getTime())
              .slice(0, 8)
              .map(task => {
                const cat = categories.find((c: typeof DEFAULT_CATEGORIES[0]) => c.id === task.category);
                return (
                  <button
                    key={task.id}
                    className="flex items-start gap-2 w-full px-2 py-2 rounded-lg hover:bg-accent/50 transition-colors text-left group"
                    onClick={() => onEditTask(task)}
                  >
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: cat?.color || '#71717a' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{task.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {task.due_at && format(parseISO(task.due_at), "MMM d")}
                      </p>
                    </div>
                  </button>
                );
              })}
            {tasks.filter(t => t.column_id !== "done" && t.due_at && isAfter(parseISO(t.due_at), new Date())).length === 0 && (
              <p className="text-xs text-muted-foreground px-2">Nothing upcoming</p>
            )}
          </div>
        </div>
      </div>

      {/* ===== MAIN CALENDAR AREA ===== */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Header */}
        <div className="flex items-center justify-between gap-4 px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-xl font-bold text-foreground">
            {format(currentDate, "MMMM, yyyy")}
          </h2>

          <div className="flex items-center rounded-xl border border-border bg-muted/30 p-1">
            {(["month", "week", "day"] as const).map((mode) => (
              <button
                key={mode}
                className={cn(
                  "px-4 py-1.5 text-xs font-medium rounded-lg transition-colors capitalize",
                  viewMode === mode
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setViewMode(mode)}
              >
                {mode}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goPrev}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToday} className="text-xs h-8 px-4 rounded-lg">
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={goNext}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {viewMode === "week" || viewMode === "day" ? (
          /* ========== WEEKLY / DAY VIEW ========== */
          <div className="flex-1 flex flex-col overflow-hidden">
            <div ref={scrollRef} className="overflow-y-auto flex-1">
              <div className={cn(
                "grid border-b border-border bg-background sticky top-0 z-10",
                viewMode === "day" ? "grid-cols-[56px_1fr]" : "grid-cols-[56px_repeat(7,1fr)]"
              )}>
                <div className="border-r border-border" />
                {(viewMode === "day" ? [currentDate] : weekDays).map((day) => {
                  const isToday = isSameDay(day, now);
                  return (
                    <div
                      key={day.toISOString()}
                      className="text-center py-3 border-r border-border last:border-r-0"
                    >
                      <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        {format(day, "EEE")}
                      </div>
                      <div
                        className={cn(
                          "text-xl font-bold mt-1 w-10 h-10 flex items-center justify-center mx-auto rounded-full transition-colors",
                          isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                        )}
                      >
                        {format(day, "d")}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div
                className={cn(
                  "grid relative",
                  viewMode === "day" ? "grid-cols-[56px_1fr]" : "grid-cols-[56px_repeat(7,1fr)]"
                )}
                style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}
              >
                {/* Time gutter */}
                <div className="border-r border-border relative">
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="absolute w-full flex items-start justify-end pr-2 -translate-y-1/2"
                      style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
                    >
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {format(setHours(new Date(), h), "h a")}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Day columns */}
                {(viewMode === "day" ? [currentDate] : weekDays).map((day) => {
                  const dayTasks = getTasksForDay(day);
                  const isToday = isSameDay(day, now);
                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        "relative border-r border-border last:border-r-0",
                        isToday && "bg-primary/[0.02]"
                      )}
                    >
                      {hours.map((h) => (
                        <div
                          key={h}
                          className="absolute w-full border-t border-border/40 cursor-pointer hover:bg-accent/10 transition-colors"
                          style={{
                            top: (h - START_HOUR) * HOUR_HEIGHT,
                            height: HOUR_HEIGHT,
                          }}
                          onClick={() => handleSlotClick(day, h)}
                        />
                      ))}

                      {isToday && showNowLine && (
                        <div
                          className="absolute left-0 right-0 z-20 pointer-events-none"
                          style={{ top: nowTop }}
                        >
                          <div className="flex items-center">
                            <div className="w-2.5 h-2.5 rounded-full bg-destructive -ml-1 shrink-0 shadow-sm" />
                            <div className="h-[2px] bg-destructive flex-1" />
                          </div>
                        </div>
                      )}

                      {dayTasks.map((task, taskIdx) => {
                        const pos = getTaskPosition(task);
                        if (!pos) return null;
                        const isDone = task.column_id === "done";
                        const colors = getCardColors(task);
                        return (
                          <button
                            key={task.id}
                            className={cn(
                              "absolute left-1.5 right-1.5 z-10 rounded-xl px-3 py-2 text-left overflow-hidden transition-all group",
                              "hover:shadow-lg hover:-translate-y-px hover:z-30",
                              colors.bg, colors.text,
                              isDone && "opacity-50"
                            )}
                            style={{
                              top: pos.top + 1,
                              height: pos.height - 2,
                              ...(taskIdx > 0 ? { left: `${taskIdx * 8 + 6}px` } : {}),
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditTask(task);
                            }}
                          >
                            <span className={cn("text-xs font-bold truncate block leading-tight", isDone && "line-through")}>
                              {task.title}
                            </span>
                            {pos.height > 40 && task.start_at && task.end_at && (
                              <div className="text-[10px] opacity-70 mt-1">
                                {format(parseISO(task.start_at), "h:mm a")} – {format(parseISO(task.end_at), "h:mm a")}
                              </div>
                            )}
                            {pos.height > 56 && task.location && (
                              <div className="text-[10px] opacity-60 mt-0.5 flex items-center gap-0.5">
                                <MapPin className="w-3 h-3" /> {task.location}
                              </div>
                            )}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Pencil className="w-3 h-3 opacity-50" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* ========== MONTHLY VIEW ========== */
          <div className="flex-1 overflow-auto p-3">
            <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div
                  key={d}
                  className="text-center text-[11px] font-medium text-muted-foreground py-2.5 bg-muted/30"
                >
                  {d}
                </div>
              ))}
              {monthDays.map((day) => {
                const dayTasks = getTasksForDay(day);
                const isCurrentMonth = isSameMonth(day, currentDate);
                const isCurrentDay = isSameDay(day, new Date());
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "min-h-[100px] p-2 bg-card cursor-pointer hover:bg-accent/10 transition-colors",
                      !isCurrentMonth && "opacity-35"
                    )}
                    onClick={() => onCreateTask?.({ due_at: day.toISOString() })}
                  >
                    <div
                      className={cn(
                        "text-xs font-medium mb-1.5 w-7 h-7 flex items-center justify-center rounded-full",
                        isCurrentDay && "bg-primary text-primary-foreground font-bold"
                      )}
                    >
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayTasks.slice(0, 2).map((task) => {
                        const colors = getCardColors(task);
                        return (
                          <button
                            key={task.id}
                            className={cn(
                              "w-full text-left text-[10px] px-2 py-1 rounded-lg truncate transition-colors font-medium",
                              colors.bg, colors.text
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditTask(task);
                            }}
                          >
                            {task.start_at && (
                              <span className="font-bold">
                                {format(parseISO(task.start_at), "h:mm")}{" "}
                              </span>
                            )}
                            {task.title}
                          </button>
                        );
                      })}
                      {dayTasks.length > 2 && (
                        <div className="text-[10px] text-muted-foreground px-2 font-medium">
                          +{dayTasks.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showCategoryManager && (
        <CategoryManager
          categories={categories}
          onSave={setCategories}
          onClose={() => setShowCategoryManager(false)}
        />
      )}
    </div>
  );
};
