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
  differenceInMinutes,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar as CalendarIcon,
  CheckCircle2,
  MapPin,
  Pencil,
  Clock,
  User,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Progress } from "@/components/ui/progress";
import { PlannerListView } from "./PlannerListView";
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

  const [listOpen, setListOpen] = useState(true);
  const [catSection, setCatSection] = useState(true);
  const [showBusiness, setShowBusiness] = useState(true);
  const [showLife, setShowLife] = useState(true);
  const [showHealth, setShowHealth] = useState(true);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!showBusiness && (t.category === "business" || !t.category)) return false;
      if (!showLife && t.category === "life") return false;
      return true;
    });
  }, [tasks, showBusiness, showLife]);

  const scheduledTasks = useMemo(
    () => filteredTasks.filter((t) => t.start_at && t.end_at),
    [filteredTasks]
  );

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

  // Next upcoming event for sidebar card
  const nextEvent = useMemo(() => {
    return scheduledTasks
      .filter((t) => t.start_at && isAfter(parseISO(t.start_at), now))
      .sort((a, b) => parseISO(a.start_at!).getTime() - parseISO(b.start_at!).getTime())[0] || null;
  }, [scheduledTasks, now]);

  // Category progress
  const categoryProgress = useMemo(() => {
    const biz = tasks.filter((t) => (t.category === "business" || !t.category));
    const bizDone = biz.filter((t) => t.column_id === "done").length;
    const life = tasks.filter((t) => t.category === "life");
    const lifeDone = life.filter((t) => t.column_id === "done").length;
    return {
      business: biz.length > 0 ? Math.round((bizDone / biz.length) * 100) : 0,
      life: life.length > 0 ? Math.round((lifeDone / life.length) * 100) : 0,
      health: 0,
    };
  }, [tasks]);

  return (
    <div className="flex h-full overflow-hidden">
      {/* ===== DARK LEFT SIDEBAR ===== */}
      <div className="hidden lg:flex flex-col w-[280px] shrink-0 bg-sidebar-accent text-white overflow-y-auto p-3 space-y-3">
        {/* Profile area */}
        <div className="px-2 pt-2 pb-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
            <User className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">My Calendar</p>
            <p className="text-[11px] text-gray-400">Personal Planner</p>
          </div>
        </div>

        {/* Mini Calendar Card */}
        <div className="rounded-xl bg-sidebar p-4">
          <Calendar
            mode="single"
            selected={currentDate}
            onSelect={handleMiniDateSelect}
            className="p-0 pointer-events-auto [&_.rdp-month]:w-full [&_.rdp-table]:w-full [&_.rdp-head_cell]:w-full [&_.rdp-cell]:w-full"
            classNames={{
              months: "flex flex-col",
              month: "space-y-2",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-xs font-medium text-gray-200",
              nav: "space-x-1 flex items-center",
              nav_button: "h-6 w-6 bg-transparent p-0 opacity-60 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-gray-700 text-gray-300",
              nav_button_previous: "absolute left-0",
              nav_button_next: "absolute right-0",
              table: "w-full border-collapse",
              head_row: "flex",
              head_cell: "text-gray-500 rounded-md flex-1 font-normal text-[10px]",
              row: "flex w-full mt-1",
              cell: "flex-1 h-7 text-center text-[11px] p-0 relative",
              day: "h-7 w-7 p-0 font-normal text-gray-300 hover:bg-gray-700 rounded-md inline-flex items-center justify-center aria-selected:opacity-100",
              day_selected: "bg-blue-600 text-white hover:bg-blue-600",
              day_today: "bg-gray-700 text-white font-semibold",
              day_outside: "text-gray-600 opacity-40",
              day_disabled: "text-gray-600 opacity-30",
              day_hidden: "invisible",
            }}
          />
        </div>

        {/* Upcoming Event Card */}
        {nextEvent && (
          <div className="rounded-xl bg-sidebar p-4">
            <div className="rounded-lg bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-gray-700/50 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[11px] text-blue-300 font-medium">
                  {nextEvent.start_at && format(parseISO(nextEvent.start_at), "h:mm a")}
                  {nextEvent.end_at && ` – ${format(parseISO(nextEvent.end_at), "h:mm a")}`}
                </span>
                {nextEvent.start_at && nextEvent.end_at && (
                  <Badge className="text-[9px] px-1.5 py-0 bg-blue-500/20 text-blue-300 border-0 ml-auto">
                    {differenceInMinutes(parseISO(nextEvent.end_at), parseISO(nextEvent.start_at))}m
                  </Badge>
                )}
              </div>
              <p className="text-sm font-semibold text-white mb-1">{nextEvent.title}</p>
              {nextEvent.location && (
                <p className="text-[11px] text-gray-400 flex items-center gap-1">
                  <MapPin className="w-3 h-3" /> {nextEvent.location}
                </p>
              )}
              <div className="flex gap-2 mt-3">
                <button className="text-[11px] px-3 py-1.5 rounded-lg bg-gray-700/60 text-gray-300 hover:bg-gray-600/60 transition-colors">
                  Later
                </button>
                <button
                  className="text-[11px] px-3 py-1.5 rounded-lg bg-blue-600/30 text-blue-300 hover:bg-blue-600/40 transition-colors"
                  onClick={() => onEditTask(nextEvent)}
                >
                  Details
                </button>
              </div>
            </div>
          </div>
        )}

        {/* My List Card */}
        <div className="rounded-xl bg-sidebar p-4">
          <Collapsible open={listOpen} onOpenChange={setListOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-200 transition-colors">
              My List
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", !listOpen && "-rotate-90")} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pt-3 max-h-[240px] overflow-y-auto planner-sidebar-list">
                <PlannerListView
                  tasks={tasks}
                  isLoading={isLoading}
                  onToggleComplete={onToggleComplete!}
                  onEditTask={onEditTask}
                  onDeleteTask={onDeleteTask!}
                  onAddTask={onAddTask}
                />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Categories Card */}
        <div className="rounded-xl bg-sidebar p-4">
          <Collapsible open={catSection} onOpenChange={setCatSection}>
            <CollapsibleTrigger className="flex items-center justify-between w-full text-xs font-semibold text-gray-400 uppercase tracking-wider hover:text-gray-200 transition-colors">
              Categories
              <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", !catSection && "-rotate-90")} />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="pt-3 space-y-3">
                <button
                  className="flex items-center gap-3 w-full group"
                  onClick={() => setShowBusiness(!showBusiness)}
                >
                  <div className={cn("w-3 h-3 rounded-full bg-blue-500 shrink-0", !showBusiness && "opacity-30")} />
                  <span className={cn("text-xs text-gray-300 flex-1 text-left", !showBusiness && "opacity-50")}>Work</span>
                  <Progress value={categoryProgress.business} className="w-16 h-1.5 bg-gray-700" indicatorClassName="bg-blue-500" />
                </button>
                <button
                  className="flex items-center gap-3 w-full group"
                  onClick={() => setShowLife(!showLife)}
                >
                  <div className={cn("w-3 h-3 rounded-full bg-emerald-500 shrink-0", !showLife && "opacity-30")} />
                  <span className={cn("text-xs text-gray-300 flex-1 text-left", !showLife && "opacity-50")}>Personal</span>
                  <Progress value={categoryProgress.life} className="w-16 h-1.5 bg-gray-700" indicatorClassName="bg-emerald-500" />
                </button>
                <button
                  className="flex items-center gap-3 w-full group"
                  onClick={() => setShowHealth(!showHealth)}
                >
                  <div className={cn("w-3 h-3 rounded-full bg-pink-500 shrink-0", !showHealth && "opacity-30")} />
                  <span className={cn("text-xs text-gray-300 flex-1 text-left", !showHealth && "opacity-50")}>Health</span>
                  <Progress value={categoryProgress.health} className="w-16 h-1.5 bg-gray-700" indicatorClassName="bg-pink-500" />
                </button>
              </div>
            </CollapsibleContent>
          </Collapsible>
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
            {/* Day column headers */}
            <div className={cn(
              "grid border-b border-border bg-background shrink-0",
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

            {/* Scrollable time grid */}
            <div ref={scrollRef} className="overflow-y-auto flex-1">
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
                      {/* Hour lines */}
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

                      {/* Current time indicator */}
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

                      {/* Event cards */}
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
    </div>
  );
};
