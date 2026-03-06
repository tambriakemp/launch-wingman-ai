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
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Calendar as CalendarIcon,
  CheckCircle2,
  MapPin,
  Pencil,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { PlannerTask } from "./PlannerTaskDialog";

interface PlannerCalendarViewProps {
  tasks: PlannerTask[];
  onEditTask: (task: PlannerTask) => void;
  onCreateTask?: (defaults: { due_at?: string }) => void;
  onToggleComplete?: (task: PlannerTask) => void;
}

const HOUR_HEIGHT = 60;
const START_HOUR = 6;
const END_HOUR = 22;
const TOTAL_HOURS = END_HOUR - START_HOUR;

const CARD_STYLES: Record<string, string> = {
  "event-business": "bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300",
  "event-life": "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300",
  "task-business": "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300",
  "task-life": "bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300",
};

const CATEGORY_DOTS: Record<string, string> = {
  business: "bg-blue-500",
  life: "bg-emerald-500",
};

function getCardStyle(task: PlannerTask) {
  const type = task.task_type || "task";
  const cat = task.category || "business";
  return CARD_STYLES[`${type}-${cat}`] || CARD_STYLES["task-business"];
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
  const height = Math.max((clampedEnd - clampedStart) * HOUR_HEIGHT, 20);
  return { top, height };
}

export const PlannerCalendarView = ({
  tasks,
  onEditTask,
  onCreateTask,
  onToggleComplete,
}: PlannerCalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filter toggles
  const [showTasks, setShowTasks] = useState(true);
  const [showEvents, setShowEvents] = useState(true);
  const [showBusiness, setShowBusiness] = useState(true);
  const [showLife, setShowLife] = useState(true);

  // Collapsible sidebar sections
  const [calSection, setCalSection] = useState(true);
  const [catSection, setCatSection] = useState(true);

  // Filter logic
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (!showTasks && (t.task_type === "task" || !t.task_type)) return false;
      if (!showEvents && t.task_type === "event") return false;
      if (!showBusiness && (t.category === "business" || !t.category)) return false;
      if (!showLife && t.category === "life") return false;
      return true;
    });
  }, [tasks, showTasks, showEvents, showBusiness, showLife]);

  const scheduledTasks = useMemo(
    () => filteredTasks.filter((t) => t.start_at && t.end_at),
    [filteredTasks]
  );

  const unscheduledTasks = useMemo(
    () => filteredTasks.filter((t) => !t.start_at && t.column_id !== "done"),
    [filteredTasks]
  );

  // Scroll to ~8 AM on mount
  useEffect(() => {
    if (scrollRef.current && viewMode === "week") {
      scrollRef.current.scrollTop = (8 - START_HOUR) * HOUR_HEIGHT;
    }
  }, [viewMode]);

  // Current time indicator
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(id);
  }, []);

  const nowHour = getHours(now) + getMinutes(now) / 60;
  const nowTop = (nowHour - START_HOUR) * HOUR_HEIGHT;
  const showNowLine = nowHour >= START_HOUR && nowHour <= END_HOUR;

  // Week data
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Month data
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

  // Navigation
  const goToday = () => setCurrentDate(new Date());
  const goPrev = () =>
    setCurrentDate(viewMode === "week" ? subWeeks(currentDate, 1) : subMonths(currentDate, 1));
  const goNext = () =>
    setCurrentDate(viewMode === "week" ? addWeeks(currentDate, 1) : addMonths(currentDate, 1));

  const handleMiniDateSelect = (date: Date | undefined) => {
    if (date) setCurrentDate(date);
  };

  const headerTitle = format(currentDate, "MMMM yyyy");
  const headerSubtitle =
    viewMode === "week"
      ? `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`
      : null;

  return (
    <div className="flex flex-col lg:flex-row gap-0 rounded-xl border border-border bg-card overflow-hidden min-h-[680px]">
      {/* ===== LEFT SIDEBAR ===== */}
      <div className="hidden lg:flex flex-col w-56 shrink-0 border-r border-border bg-muted/20">
        <div className="p-3">
          <Calendar
            mode="single"
            selected={currentDate}
            onSelect={handleMiniDateSelect}
            className="p-0 pointer-events-auto [&_.rdp-month]:w-full [&_.rdp-table]:w-full [&_.rdp-head_cell]:w-full [&_.rdp-cell]:w-full"
            classNames={{
              months: "flex flex-col",
              month: "space-y-2",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-xs font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100 inline-flex items-center justify-center rounded-md border border-border",
              nav_button_previous: "absolute left-0",
              nav_button_next: "absolute right-0",
              table: "w-full border-collapse",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md flex-1 font-normal text-[10px]",
              row: "flex w-full mt-1",
              cell: "flex-1 h-7 text-center text-[11px] p-0 relative",
              day: "h-7 w-7 p-0 font-normal aria-selected:opacity-100 hover:bg-accent rounded-md inline-flex items-center justify-center",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary",
              day_today: "bg-accent text-accent-foreground font-semibold",
              day_outside: "text-muted-foreground opacity-40",
              day_disabled: "text-muted-foreground opacity-50",
              day_hidden: "invisible",
            }}
          />
        </div>

        <div className="border-t border-border" />

        {/* My Calendars */}
        <Collapsible open={calSection} onOpenChange={setCalSection}>
          <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-accent/30 transition-colors">
            My Calendars
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", !calSection && "-rotate-90")} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-3 space-y-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <Checkbox checked={showTasks} onCheckedChange={(v) => setShowTasks(!!v)} className="h-3.5 w-3.5 rounded border-amber-400 data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500" />
                <span className="text-xs text-foreground group-hover:text-foreground/80">Tasks</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <Checkbox checked={showEvents} onCheckedChange={(v) => setShowEvents(!!v)} className="h-3.5 w-3.5 rounded border-blue-400 data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500" />
                <span className="text-xs text-foreground group-hover:text-foreground/80">Events</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-not-allowed opacity-50">
                <Checkbox disabled className="h-3.5 w-3.5 rounded" />
                <span className="text-xs text-muted-foreground">Content</span>
                <Badge variant="outline" className="text-[8px] px-1 py-0 ml-auto">Soon</Badge>
              </label>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <div className="border-t border-border" />

        {/* Categories */}
        <Collapsible open={catSection} onOpenChange={setCatSection}>
          <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-2.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider hover:bg-accent/30 transition-colors">
            Categories
            <ChevronDown className={cn("w-3.5 h-3.5 transition-transform", !catSection && "-rotate-90")} />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="px-4 pb-3 space-y-2.5">
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
                <Checkbox checked={showBusiness} onCheckedChange={(v) => setShowBusiness(!!v)} className="h-3.5 w-3.5 rounded" />
                <span className="text-xs text-foreground group-hover:text-foreground/80">Work</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <Checkbox checked={showLife} onCheckedChange={(v) => setShowLife(!!v)} className="h-3.5 w-3.5 rounded" />
                <span className="text-xs text-foreground group-hover:text-foreground/80">Personal</span>
              </label>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* ===== CENTER CANVAS ===== */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border bg-card">
          <div>
            <h3 className="text-lg font-bold text-foreground leading-tight">{headerTitle}</h3>
            {headerSubtitle && (
              <p className="text-[11px] text-muted-foreground">{headerSubtitle}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
              <button
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                  viewMode === "week"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setViewMode("week")}
              >
                Week
              </button>
              <button
                className={cn(
                  "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                  viewMode === "month"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setViewMode("month")}
              >
                Month
              </button>
            </div>
            <Button variant="outline" size="sm" onClick={goToday} className="text-xs h-7">
              Today
            </Button>
            <div className="flex items-center">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goPrev}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={goNext}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {viewMode === "week" ? (
          /* ========== WEEKLY VIEW ========== */
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Day column headers */}
            <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-border bg-muted/20 shrink-0">
              <div className="border-r border-border" />
              {weekDays.map((day) => {
                const isToday = isSameDay(day, now);
                return (
                  <div
                    key={day.toISOString()}
                    className="text-center py-3 border-r border-border last:border-r-0"
                  >
                    <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                      {format(day, "EEE")}
                    </div>
                    <div
                      className={cn(
                        "text-sm font-semibold mt-0.5 w-7 h-7 flex items-center justify-center mx-auto rounded-full transition-colors",
                        isToday && "bg-primary text-primary-foreground"
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
                className="grid grid-cols-[56px_repeat(7,1fr)] relative"
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
                {weekDays.map((day) => {
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

                      {/* Event cards — pastel style */}
                      {dayTasks.map((task, taskIdx) => {
                        const pos = getTaskPosition(task);
                        if (!pos) return null;
                        const isEvent = task.task_type === "event";
                        const isDone = task.column_id === "done";
                        const style = getCardStyle(task);
                        return (
                          <button
                            key={task.id}
                            className={cn(
                              "absolute left-1 right-1 z-10 rounded-lg px-2 py-1.5 text-left overflow-hidden border transition-all group",
                              "hover:shadow-lg hover:-translate-y-px hover:z-30",
                              style,
                              isDone && "opacity-50 line-through"
                            )}
                            style={{
                              top: pos.top + 1,
                              height: pos.height - 2,
                              ...(taskIdx > 0
                                ? { left: `${taskIdx * 6 + 4}px` }
                                : {}),
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditTask(task);
                            }}
                          >
                            <div className="flex items-start gap-1">
                              {isEvent ? (
                                <CalendarIcon className="w-3 h-3 mt-0.5 shrink-0 opacity-60" />
                              ) : (
                                <CheckCircle2
                                  className={cn(
                                    "w-3 h-3 mt-0.5 shrink-0 opacity-60",
                                    isDone && "fill-current"
                                  )}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onToggleComplete?.(task);
                                  }}
                                />
                              )}
                              <span className="text-[10px] font-semibold truncate leading-tight">
                                {task.title}
                              </span>
                            </div>
                            {pos.height > 36 && task.start_at && task.end_at && (
                              <div className="text-[9px] opacity-60 mt-0.5 ml-4">
                                {format(parseISO(task.start_at), "h:mm a")} –{" "}
                                {format(parseISO(task.end_at), "h:mm a")}
                              </div>
                            )}
                            {/* Hover edit icon */}
                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
          <div className="flex-1 overflow-auto p-2">
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div
                  key={d}
                  className="text-center text-[11px] font-medium text-muted-foreground py-2 bg-muted/30"
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
                      "min-h-[90px] p-1.5 bg-card cursor-pointer hover:bg-accent/10 transition-colors",
                      !isCurrentMonth && "opacity-35"
                    )}
                    onClick={() => onCreateTask?.({ due_at: day.toISOString() })}
                  >
                    <div
                      className={cn(
                        "text-[11px] font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                        isCurrentDay && "bg-primary text-primary-foreground"
                      )}
                    >
                      {format(day, "d")}
                    </div>
                    <div className="space-y-0.5">
                      {dayTasks.slice(0, 2).map((task) => {
                        const style = getCardStyle(task);
                        return (
                          <button
                            key={task.id}
                            className={cn(
                              "w-full text-left text-[10px] px-1.5 py-0.5 rounded-md border truncate transition-colors",
                              style
                            )}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditTask(task);
                            }}
                          >
                            {task.start_at && (
                              <span className="font-semibold">
                                {format(parseISO(task.start_at), "h:mm")}{" "}
                              </span>
                            )}
                            {task.title}
                          </button>
                        );
                      })}
                      {dayTasks.length > 2 && (
                        <div className="text-[10px] text-muted-foreground px-1.5 font-medium">
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

      {/* ===== RIGHT SIDEBAR ===== */}
      <div className="lg:w-64 shrink-0 border-t lg:border-t-0 lg:border-l border-border bg-muted/10 flex flex-col">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
          <CalendarIcon className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Unscheduled</span>
          <Badge variant="secondary" className="text-[10px] ml-auto">
            {unscheduledTasks.length}
          </Badge>
        </div>
        <ScrollArea className="flex-1 max-h-[600px] lg:max-h-none">
          <div className="p-3 space-y-1.5">
            {unscheduledTasks.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                No unscheduled items
              </p>
            ) : (
              unscheduledTasks.map((task) => {
                const catDot = CATEGORY_DOTS[task.category || "business"] || CATEGORY_DOTS.business;
                return (
                  <button
                    key={task.id}
                    className="flex items-center gap-2 w-full text-left p-2 rounded-lg border border-border hover:bg-accent/20 hover:shadow-sm transition-all group"
                    onClick={() => onEditTask(task)}
                  >
                    <div className={cn("w-2 h-2 rounded-full shrink-0", catDot)} />
                    <span className="text-xs truncate flex-1 text-foreground">
                      {task.title}
                    </span>
                    {task.task_type === "event" && (
                      <Badge
                        variant="outline"
                        className="text-[8px] px-1 py-0 border-blue-300 text-blue-600 dark:text-blue-400 shrink-0"
                      >
                        Event
                      </Badge>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
