import { useState, useMemo, useEffect, useRef, useCallback } from "react";
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
  addDays,
  subDays,
  startOfWeek,
  endOfWeek,
  parseISO,
  getHours,
  getMinutes,
  setHours,
  setMinutes,
  isAfter,
} from "date-fns";
import { expandAllRecurring } from "./recurrenceUtils";
import {
  ChevronLeft,
  ChevronRight,
  Pencil,
  CheckCircle2,
  Circle,
  Flame,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { PlannerTask } from "./PlannerTaskDialog";
import type { PlannerSpace, SpaceCategory } from "@/hooks/usePlannerSpaces";

interface PlannerCalendarViewProps {
  tasks: PlannerTask[];
  isLoading: boolean;
  onEditTask: (task: PlannerTask) => void;
  onCreateTask?: (defaults: { due_at?: string }) => void;
  onToggleComplete?: (task: PlannerTask) => void;
  onDeleteTask?: (taskId: string) => void;
  onAddTask?: () => void;
  categories?: SpaceCategory[];
  spaces?: PlannerSpace[];
  allTasks?: PlannerTask[];
}

const HOUR_HEIGHT = 72;
const START_HOUR = 0;
const END_HOUR = 24;
const TOTAL_HOURS = END_HOUR - START_HOUR;

/** Shared helper: is this task an all-day item? */
function isAllDayTask(task: PlannerTask): boolean {
  // Due-only (no start/end) → all-day
  if (task.due_at && !task.start_at && !task.end_at) return true;
  // Has start+end at same time → treat as all-day
  if (task.start_at && task.end_at) {
    const s = parseISO(task.start_at);
    const e = parseISO(task.end_at);
    const sH = getHours(s) + getMinutes(s) / 60;
    const eH = getHours(e) + getMinutes(e) / 60;
    if (sH === eH) return true;
  }
  return false;
}

/** Get the display date string for an all-day/due-only task */
function getTaskDateKey(task: PlannerTask): string | null {
  const dateStr = task.due_at || task.start_at;
  if (!dateStr) return null;
  return dateStr.slice(0, 10);
}

function getCardColorStyle(task: PlannerTask, categories: { id: string; color: string }[], spaces: PlannerSpace[] = []): { style: React.CSSProperties; isDark: boolean } {
  const space = spaces.find(s => s.id === (task as any).space_id);
  const hex = space?.color || "#3b82f6";
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Darken the color for text to ensure readability against the light background
  const textR = Math.round(r * 0.35);
  const textG = Math.round(g * 0.35);
  const textB = Math.round(b * 0.35);
  return {
    style: {
      backgroundColor: `rgba(${r},${g},${b},0.28)`,
      borderColor: `rgba(${r},${g},${b},0.4)`,
      borderLeftWidth: '3px',
      borderLeftColor: hex,
      color: `rgb(${textR},${textG},${textB})`,
    },
    isDark: false,
  };
}

function getTaskPosition(task: PlannerTask) {
  if (!task.start_at || !task.end_at) return null;
  const start = parseISO(task.start_at);
  const end = parseISO(task.end_at);
  const startH = getHours(start) + getMinutes(start) / 60;
  const endH = getHours(end) + getMinutes(end) / 60;
  // Same start/end at midnight = all-day task, don't position on time grid
  if (startH === endH) return null;
  const clampedStart = Math.max(startH, START_HOUR);
  const clampedEnd = Math.min(endH, END_HOUR);
  if (clampedEnd <= clampedStart) return null;
  const top = (clampedStart - START_HOUR) * HOUR_HEIGHT;
  const height = Math.max((clampedEnd - clampedStart) * HOUR_HEIGHT, 24);
  return { top, height };
}

export const PlannerCalendarView = ({
  tasks,
  isLoading,
  onEditTask,
  onCreateTask,
  onToggleComplete,
  onDeleteTask,
  onAddTask,
  categories: propCategories = [],
  spaces = [],
  allTasks = [],
}: PlannerCalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"month" | "week" | "day">("week");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const userId = user?.id;
  const todayStr = format(new Date(), "yyyy-MM-dd");

  const categories = propCategories;

  // --- Today's Priorities ---
  const [dailyPage, setDailyPage] = useState<any>(null);
  const fetchDailyPage = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("daily_pages")
      .select("*")
      .eq("user_id", userId)
      .eq("page_date", todayStr)
      .maybeSingle();
    setDailyPage(data);
  }, [userId, todayStr]);

  useEffect(() => { fetchDailyPage(); }, [fetchDailyPage]);

  const togglePriority = async (num: 1 | 2 | 3) => {
    if (!userId) return;
    const key = `priority_${num}_done` as const;
    const currentVal = dailyPage?.[key] ?? false;
    setDailyPage((prev: any) => ({ ...prev, [key]: !currentVal }));
    await supabase.from("daily_pages").upsert(
      { user_id: userId, page_date: todayStr, [key]: !currentVal } as any,
      { onConflict: "user_id,page_date" }
    );
  };

  const priorities = [
    { num: 1 as const, text: dailyPage?.priority_1, done: dailyPage?.priority_1_done },
    { num: 2 as const, text: dailyPage?.priority_2, done: dailyPage?.priority_2_done },
    { num: 3 as const, text: dailyPage?.priority_3, done: dailyPage?.priority_3_done },
  ].filter(p => p.text);

  // --- Habits ---
  const [sidebarHabits, setSidebarHabits] = useState<any[]>([]);
  const [habitCompletions, setHabitCompletions] = useState<any[]>([]);

  const fetchHabitsData = useCallback(async () => {
    if (!userId) return;
    const [{ data: hData }, { data: cData }] = await Promise.all([
      supabase.from("habits" as any).select("*").eq("user_id", userId).eq("is_archived", false).order("created_at", { ascending: true }),
      supabase.from("habit_completions" as any).select("*").eq("user_id", userId).eq("completed_date", todayStr),
    ]);
    setSidebarHabits((hData as any[]) || []);
    setHabitCompletions((cData as any[]) || []);
  }, [userId, todayStr]);

  useEffect(() => { fetchHabitsData(); }, [fetchHabitsData]);

  const toggleHabitCompletion = async (habitId: string) => {
    if (!userId) return;
    const existing = habitCompletions.find((c: any) => c.habit_id === habitId);
    if (existing) {
      setHabitCompletions(prev => prev.filter((c: any) => c.id !== existing.id));
      await supabase.from("habit_completions" as any).delete().eq("id", existing.id);
    } else {
      const tempId = crypto.randomUUID();
      const newCompletion = { id: tempId, habit_id: habitId, user_id: userId, completed_date: todayStr };
      setHabitCompletions(prev => [...prev, newCompletion]);
      const { data } = await supabase.from("habit_completions" as any).insert(newCompletion).select().single();
      if (data) setHabitCompletions(prev => prev.map(c => c.id === tempId ? data as any : c));
    }
  };

  // Scroll to top on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
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

  const expandedTasks = useMemo(() => {
    return expandAllRecurring(tasks, windowStart, windowEnd);
  }, [tasks, windowStart, windowEnd]);

  const scheduledTasks = useMemo(() => {
    return expandedTasks.filter((t) => !isAllDayTask(t) && t.start_at && t.end_at);
  }, [expandedTasks]);

  const allDayTasks = useMemo(() => {
    return expandedTasks.filter(t => isAllDayTask(t));
  }, [expandedTasks]);

  const getAllDayTasksForDay = (day: Date) => {
    const dayKey = format(day, "yyyy-MM-dd");
    return allDayTasks.filter((t) => getTaskDateKey(t) === dayKey);
  };

  // Month
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const monthCalStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const monthCalEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const monthDays = eachDayOfInterval({ start: monthCalStart, end: monthCalEnd });

  const getTasksForDay = (day: Date) => {
    const timed = scheduledTasks.filter((t) => t.start_at && isSameDay(parseISO(t.start_at), day));
    const allDay = getAllDayTasksForDay(day);
    return [...allDay, ...timed];
  };

  const handleSlotClick = (day: Date, hour: number) => {
    if (!onCreateTask) return;
    const d = setMinutes(setHours(new Date(day), hour), 0);
    onCreateTask({ due_at: d.toISOString() });
  };

  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);

  const goToday = () => setCurrentDate(new Date());
  const goPrev = () =>
    setCurrentDate(viewMode === "month" ? subMonths(currentDate, 1) : viewMode === "day" ? subDays(currentDate, 1) : subWeeks(currentDate, 1));
  const goNext = () =>
    setCurrentDate(viewMode === "month" ? addMonths(currentDate, 1) : viewMode === "day" ? addDays(currentDate, 1) : addWeeks(currentDate, 1));

  const handleMiniDateSelect = (date: Date | undefined) => {
    if (date) setCurrentDate(date);
  };


  return (
    <div className="flex h-full overflow-hidden">
      {/* ===== LEFT SIDEBAR ===== */}
      <div className="hidden lg:flex flex-col w-[260px] shrink-0 border-r border-border bg-background overflow-y-auto">
        {/* Upcoming tasks list */}
        <div className="p-4">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3">Upcoming</span>
          <div className="space-y-1">
            {allTasks
              .filter(t => {
                if (t.column_id === "done" || !t.due_at) return false;
                const dueDate = parseISO(t.due_at);
                // Include tasks due today or in the future
                return isSameDay(dueDate, new Date()) || isAfter(dueDate, new Date());
              })
              .sort((a, b) => parseISO(a.due_at!).getTime() - parseISO(b.due_at!).getTime())
              .slice(0, 5)
              .map(task => {
                const space = spaces.find(s => s.id === (task as any).space_id);
                return (
                  <button
                    key={task.id}
                    className="flex items-start gap-2 w-full px-2 py-2 rounded-lg hover:bg-accent/50 transition-colors text-left group"
                    onClick={() => onEditTask(task)}
                  >
                    <div className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ background: space?.color || '#71717a' }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{task.title}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {task.due_at && format(parseISO(task.due_at), "MMM d")}
                      </p>
                    </div>
                  </button>
                );
              })}
            {allTasks.filter(t => t.column_id !== "done" && t.due_at && isAfter(parseISO(t.due_at), new Date())).length === 0 && (
              <p className="text-xs text-muted-foreground px-2">Nothing upcoming</p>
            )}
          </div>
        </div>

        {/* Today's Priorities */}
        <div className="p-4 border-t border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            Today's Priorities
          </span>
          {priorities.length === 0 ? (
            <Link to="/daily" className="text-xs text-primary hover:underline px-2">
              Set priorities on Daily Page →
            </Link>
          ) : (
            <div className="space-y-1">
              {priorities.map(p => (
                <button
                  key={p.num}
                  className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-accent/50 transition-colors text-left"
                  onClick={() => togglePriority(p.num)}
                >
                  {p.done ? (
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <span className={cn("text-xs truncate", p.done && "line-through text-muted-foreground")}>{p.text}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Habits */}
        <div className="p-4 border-t border-border">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-3 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5" />
            Habits
          </span>
          {sidebarHabits.length === 0 ? (
            <Link to="/habits" className="text-xs text-primary hover:underline px-2">
              Create habits →
            </Link>
          ) : (
            <div className="space-y-1">
              {sidebarHabits.map((habit: any) => {
                const isDone = habitCompletions.some((c: any) => c.habit_id === habit.id);
                return (
                  <button
                    key={habit.id}
                    className="flex items-center gap-2 w-full px-2 py-1.5 rounded-lg hover:bg-accent/50 transition-colors text-left"
                    onClick={() => toggleHabitCompletion(habit.id)}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: habit.color }} />
                    ) : (
                      <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                    )}
                    <span className={cn("text-xs truncate", isDone && "line-through text-muted-foreground")}>{habit.name}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* ===== MAIN CALENDAR AREA ===== */}
      <div className="flex-1 flex flex-col min-w-0 bg-background">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-4 px-4 sm:px-6 py-3 sm:py-4 border-b border-border shrink-0">
          <h2 className="text-base sm:text-xl font-bold text-foreground">
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
                    <div key={day.toISOString()} className="text-center py-3 border-r border-border last:border-r-0">
                      <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        {format(day, "EEE")}
                      </div>
                      <div className={cn(
                        "text-xl font-bold mt-1 w-10 h-10 flex items-center justify-center mx-auto rounded-full transition-colors",
                        isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                      )}>
                        {format(day, "d")}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* All-day row */}
              <div className={cn(
                "grid border-b border-border bg-muted/10",
                viewMode === "day" ? "grid-cols-[56px_1fr]" : "grid-cols-[56px_repeat(7,1fr)]"
              )}>
                <div className="border-r border-border flex items-center justify-end pr-2">
                  <span className="text-xs text-muted-foreground font-medium">All day</span>
                </div>
                {(viewMode === "day" ? [currentDate] : weekDays).map((day) => {
                  const dayAllDay = getAllDayTasksForDay(day);
                  return (
                    <div
                      key={`allday-${day.toISOString()}`}
                      className="border-r border-border last:border-r-0 min-h-[40px] min-w-0 p-1.5 flex flex-col gap-1 cursor-pointer hover:bg-accent/10 transition-colors overflow-hidden"
                      onClick={() => onCreateTask?.({ due_at: day.toISOString() })}
                    >
                      {dayAllDay.map((task) => {
                        const { style: colorStyle } = getCardColorStyle(task, categories, spaces);
                        const isDone = task.column_id === "done";
                        return (
                          <button
                            key={task.id}
                            className={cn(
                              "text-xs font-medium px-2.5 py-1 rounded-md truncate w-full text-left transition-colors border",
                              isDone && "opacity-50 line-through"
                            )}
                            style={colorStyle}
                            onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
                          >
                            {task.title}
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

              <div
                className={cn(
                  "grid relative",
                  viewMode === "day" ? "grid-cols-[56px_1fr]" : "grid-cols-[56px_repeat(7,1fr)]"
                )}
                style={{ height: TOTAL_HOURS * HOUR_HEIGHT, marginTop: 8 }}
              >
                {/* Time gutter */}
                <div className="border-r border-border relative">
                  {hours.map((h) => (
                    <div
                      key={h}
                      className="absolute w-full flex items-start justify-end pr-2 -translate-y-1/2"
                      style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
                    >
                      <span className="text-xs text-muted-foreground font-medium">
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
                          style={{ top: (h - START_HOUR) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                          onClick={() => handleSlotClick(day, h)}
                        />
                      ))}

                      {isToday && showNowLine && (
                        <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: nowTop }}>
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
                        const { style: colorStyle } = getCardColorStyle(task, categories, spaces);
                        return (
                          <button
                            key={task.id}
                            className={cn(
                              "absolute left-1.5 right-1.5 z-10 rounded-xl px-3 py-2 text-left overflow-hidden transition-all group border",
                              "hover:shadow-lg hover:-translate-y-px hover:z-30",
                              isDone && "opacity-50"
                            )}
                            style={{
                              ...colorStyle,
                              top: pos.top + 1,
                              height: pos.height - 2,
                              ...(taskIdx > 0 ? { left: `${taskIdx * 8 + 6}px` } : {}),
                            }}
                            onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
                          >
                            <span className={cn("text-sm font-bold truncate block leading-tight", isDone && "line-through")}>
                              {task.title}
                            </span>
                            {(task.recurrence_rule || (task as any)._isVirtualRecurrence) && (
                              <span className="text-[9px] opacity-60 mt-0.5 block">↻ repeating</span>
                            )}
                            {pos.height > 40 && task.start_at && task.end_at && (() => {
                              const s = parseISO(task.start_at);
                              const e = parseISO(task.end_at);
                              if (s.getHours() === 0 && s.getMinutes() === 0 && e.getHours() === 0 && e.getMinutes() === 0) return null;
                              return (
                                <div className="text-xs opacity-70 mt-1">
                                  {format(s, "h:mm a")} – {format(e, "h:mm a")}
                                </div>
                              );
                            })()}
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
          /* Monthly view */
          <div className="flex-1 overflow-auto p-3">
            <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-2.5 bg-muted/30">
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
                    <div className={cn(
                      "text-xs font-medium mb-1.5 w-7 h-7 flex items-center justify-center rounded-full",
                      isCurrentDay && "bg-primary text-primary-foreground font-bold"
                    )}>
                      {format(day, "d")}
                    </div>
                    <div className="space-y-1">
                      {dayTasks.slice(0, 2).map((task) => {
                        const { style: colorStyle } = getCardColorStyle(task, categories, spaces);
                        const isDone = task.column_id === "done";
                        return (
                          <button
                            key={task.id}
                            className={cn(
                              "w-full text-left text-[10px] px-2 py-1 rounded-lg truncate transition-colors font-medium border",
                              isDone && "opacity-50 line-through"
                            )}
                            style={colorStyle}
                            onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
                          >
                            {task.start_at && !isAllDayTask(task) && (() => {
                              const s = parseISO(task.start_at);
                              return <span className="font-bold">{format(s, "h:mm")} </span>;
                            })()}
                            {task.title}
                            {(task.recurrence_rule || (task as any)._isVirtualRecurrence) && (
                              <span className="opacity-50"> ↻</span>
                            )}
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
    </div>
  );
};
