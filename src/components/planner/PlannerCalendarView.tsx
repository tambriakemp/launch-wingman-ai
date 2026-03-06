import { useState, useMemo } from "react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
  parseISO,
} from "date-fns";
import { ChevronLeft, ChevronRight, CalendarCheck, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { PlannerTask } from "./PlannerTaskDialog";

interface PlannerCalendarViewProps {
  tasks: PlannerTask[];
  onEditTask: (task: PlannerTask) => void;
}

export const PlannerCalendarView = ({ tasks, onEditTask }: PlannerCalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const scheduledTasks = useMemo(
    () => tasks.filter((t) => t.start_at && t.end_at),
    [tasks]
  );

  const unscheduledTasks = useMemo(
    () => tasks.filter((t) => !t.start_at && t.column_id !== "done"),
    [tasks]
  );

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getTasksForDay = (day: Date) =>
    scheduledTasks.filter((t) => t.start_at && isSameDay(parseISO(t.start_at), day));

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Calendar Grid */}
      <div className="flex-1">
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <h3 className="text-sm font-semibold">{format(currentMonth, "MMMM yyyy")}</h3>
          <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
          {weekDays.map((d) => (
            <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-2 bg-muted/50">{d}</div>
          ))}
          {days.map((day) => {
            const dayTasks = getTasksForDay(day);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={day.toISOString()}
                className={cn(
                  "min-h-[80px] p-1 bg-card",
                  !isCurrentMonth && "opacity-40"
                )}
              >
                <div className={cn(
                  "text-[11px] font-medium mb-1 w-6 h-6 flex items-center justify-center rounded-full",
                  isToday && "bg-primary text-primary-foreground"
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
                      onClick={() => onEditTask(task)}
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
      </div>

      {/* Unscheduled Sidebar */}
      <div className="w-full lg:w-64 shrink-0">
        <div className="border border-border rounded-lg">
          <div className="px-3 py-2 border-b border-border bg-muted/30">
            <h4 className="text-sm font-medium flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-muted-foreground" />
              Unscheduled
              <Badge variant="secondary" className="text-[10px] ml-auto">{unscheduledTasks.length}</Badge>
            </h4>
          </div>
          <ScrollArea className="max-h-[400px]">
            <div className="p-2 space-y-1">
              {unscheduledTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-4">All items scheduled!</p>
              ) : (
                unscheduledTasks.map((task) => (
                  <button
                    key={task.id}
                    className="w-full text-left p-2 rounded-md hover:bg-accent/50 transition-colors"
                    onClick={() => onEditTask(task)}
                  >
                    <p className="text-sm truncate">{task.title}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {task.category && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0">{task.category}</Badge>
                      )}
                      {task.task_type === "event" && (
                        <Badge variant="outline" className="text-[9px] px-1 py-0 border-primary/30 text-primary">Event</Badge>
                      )}
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
};
