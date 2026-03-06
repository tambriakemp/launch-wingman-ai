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
  differenceInMinutes,
  setHours,
  setMinutes,
} from "date-fns";
import { ChevronLeft, ChevronRight, ChevronDown, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { PlannerTask } from "./PlannerTaskDialog";

interface PlannerCalendarViewProps {
  tasks: PlannerTask[];
  onEditTask: (task: PlannerTask) => void;
  onCreateTask?: (defaults: { due_at?: string }) => void;
}

const HOUR_HEIGHT = 60;
const START_HOUR = 6;
const END_HOUR = 22;
const TOTAL_HOURS = END_HOUR - START_HOUR;

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

export const PlannerCalendarView = ({ tasks, onEditTask, onCreateTask }: PlannerCalendarViewProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [unschedOpen, setUnschedOpen] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const scheduledTasks = useMemo(
    () => tasks.filter((t) => t.start_at && t.end_at),
    [tasks]
  );

  const unscheduledTasks = useMemo(
    () => tasks.filter((t) => !t.start_at && t.column_id !== "done"),
    [tasks]
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
  const monthCalStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const monthCalEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const monthDays = eachDayOfInterval({ start: monthCalStart, end: monthCalEnd });

  const getTasksForDay = (day: Date) =>
    scheduledTasks.filter((t) => t.start_at && isSameDay(parseISO(t.start_at), day));

  const handleSlotClick = (day: Date, hour: number) => {
    if (!onCreateTask) return;
    const d = setMinutes(setHours(new Date(day), hour), 0);
    onCreateTask({ due_at: d.toISOString() });
  };

  const hours = Array.from({ length: TOTAL_HOURS }, (_, i) => START_HOUR + i);

  // Week navigation
  const goToday = () => setCurrentDate(new Date());
  const goPrev = () => setCurrentDate(viewMode === "week" ? subWeeks(currentDate, 1) : subMonths(currentDate, 1));
  const goNext = () => setCurrentDate(viewMode === "week" ? addWeeks(currentDate, 1) : addMonths(currentDate, 1));

  const headerTitle = viewMode === "week"
    ? format(currentDate, "MMMM yyyy")
    : format(currentDate, "MMMM yyyy");

  const headerSubtitle = viewMode === "week"
    ? `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`
    : null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-lg font-bold text-foreground leading-tight">{headerTitle}</h3>
            {headerSubtitle && (
              <p className="text-xs text-muted-foreground">{headerSubtitle}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-border bg-muted/30 p-0.5">
            <button
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                viewMode === "week" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setViewMode("week")}
            >
              Week
            </button>
            <button
              className={cn(
                "px-3 py-1 text-xs font-medium rounded-md transition-colors",
                viewMode === "month" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
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
        <div className="border border-border rounded-xl overflow-hidden bg-card">
          {/* Day column headers */}
          <div className="grid grid-cols-[56px_repeat(7,1fr)] border-b border-border bg-muted/30">
            <div className="border-r border-border" /> {/* gutter spacer */}
            {weekDays.map((day) => {
              const isToday = isSameDay(day, now);
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "text-center py-3 border-r border-border last:border-r-0",
                  )}
                >
                  <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                    {format(day, "EEE")}
                  </div>
                  <div className={cn(
                    "text-sm font-semibold mt-0.5 w-7 h-7 flex items-center justify-center mx-auto rounded-full",
                    isToday && "bg-primary text-primary-foreground"
                  )}>
                    {format(day, "d")}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Scrollable time grid */}
          <div ref={scrollRef} className="overflow-y-auto max-h-[600px]">
            <div className="grid grid-cols-[56px_repeat(7,1fr)] relative" style={{ height: TOTAL_HOURS * HOUR_HEIGHT }}>
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
              {weekDays.map((day, dayIdx) => {
                const dayTasks = getTasksForDay(day);
                const isToday = isSameDay(day, now);
                return (
                  <div
                    key={day.toISOString()}
                    className={cn("relative border-r border-border last:border-r-0", isToday && "bg-primary/[0.02]")}
                  >
                    {/* Hour lines */}
                    {hours.map((h) => (
                      <div
                        key={h}
                        className="absolute w-full border-t border-border/50 cursor-pointer hover:bg-accent/20 transition-colors"
                        style={{ top: (h - START_HOUR) * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                        onClick={() => handleSlotClick(day, h)}
                      />
                    ))}

                    {/* Current time indicator */}
                    {isToday && showNowLine && (
                      <div className="absolute left-0 right-0 z-20 pointer-events-none" style={{ top: nowTop }}>
                        <div className="flex items-center">
                          <div className="w-2 h-2 rounded-full bg-destructive -ml-1 shrink-0" />
                          <div className="h-[2px] bg-destructive flex-1" />
                        </div>
                      </div>
                    )}

                    {/* Event cards */}
                    {dayTasks.map((task, taskIdx) => {
                      const pos = getTaskPosition(task);
                      if (!pos) return null;
                      const isEvent = task.task_type === "event";
                      return (
                        <button
                          key={task.id}
                          className={cn(
                            "absolute left-0.5 right-0.5 z-10 rounded-md px-1.5 py-1 text-left overflow-hidden transition-shadow hover:shadow-md cursor-pointer",
                            isEvent
                              ? "bg-primary/15 border border-primary/25 text-primary"
                              : "bg-accent border border-border text-accent-foreground"
                          )}
                          style={{
                            top: pos.top + 1,
                            height: pos.height - 2,
                            ...(taskIdx > 0 ? { left: `${taskIdx * 8 + 2}px` } : {}),
                          }}
                          onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
                        >
                          <div className="text-[10px] font-semibold truncate leading-tight">
                            {task.title}
                          </div>
                          {pos.height > 30 && task.start_at && task.end_at && (
                            <div className="text-[9px] opacity-70 mt-0.5">
                              {format(parseISO(task.start_at), "h:mm a")} – {format(parseISO(task.end_at), "h:mm a")}
                            </div>
                          )}
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
        /* ========== MONTHLY VIEW (fallback) ========== */
        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-2 bg-muted/50">{d}</div>
          ))}
          {monthDays.map((day) => {
            const dayTasks = getTasksForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isCurrentDay = isSameDay(day, new Date());
            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[80px] p-1 bg-card cursor-pointer hover:bg-accent/20 transition-colors",
                  !isCurrentMonth && "opacity-40"
                )}
                onClick={() => onCreateTask?.({ due_at: day.toISOString() })}
              >
                <div className={cn(
                  "text-[11px] font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                  isCurrentDay && "bg-primary text-primary-foreground"
                )}>
                  {format(day, "d")}
                </div>
                <div className="space-y-0.5">
                  {dayTasks.slice(0, 3).map((task) => (
                    <button
                      key={task.id}
                      className={cn(
                        "w-full text-left text-[10px] px-1 py-0.5 rounded truncate transition-colors",
                        task.task_type === "event"
                          ? "bg-primary/10 text-primary hover:bg-primary/20"
                          : "bg-accent hover:bg-accent/80 text-accent-foreground"
                      )}
                      onClick={(e) => { e.stopPropagation(); onEditTask(task); }}
                    >
                      {task.start_at && (
                        <span className="font-medium">{format(parseISO(task.start_at), "h:mm")} </span>
                      )}
                      {task.title}
                    </button>
                  ))}
                  {dayTasks.length > 3 && (
                    <div className="text-[10px] text-muted-foreground px-1">+{dayTasks.length - 3} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Unscheduled Tasks — collapsible bottom list */}
      {unscheduledTasks.length > 0 && (
        <Collapsible open={unschedOpen} onOpenChange={setUnschedOpen}>
          <CollapsibleTrigger asChild>
            <button className="flex items-center gap-2 w-full text-left px-1 py-2 hover:bg-accent/30 rounded-md transition-colors">
              <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", !unschedOpen && "-rotate-90")} />
              <CalendarIcon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium">Unscheduled</span>
              <Badge variant="secondary" className="text-[10px] ml-1">{unscheduledTasks.length}</Badge>
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-1 pl-6">
              {unscheduledTasks.map((task) => (
                <button
                  key={task.id}
                  className="flex items-center gap-2 text-left p-2 rounded-md border border-border hover:bg-accent/40 transition-colors"
                  onClick={() => onEditTask(task)}
                >
                  <span className="text-sm truncate flex-1">{task.title}</span>
                  {task.category && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 shrink-0">{task.category}</Badge>
                  )}
                  {task.task_type === "event" && (
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-primary/30 text-primary shrink-0">Event</Badge>
                  )}
                </button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};
