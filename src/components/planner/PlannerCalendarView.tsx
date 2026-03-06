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

export const PlannerCalendarView = ({ tasks, onEditTask, onCreateTask }: PlannerCalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [unschedOpen, setUnschedOpen] = useState(true);

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

  const handleDayClick = (day: Date) => {
    if (onCreateTask) {
      onCreateTask({ due_at: day.toISOString() });
    }
  };

  return (
    <div className="space-y-4">
      {/* Calendar Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h3 className="text-sm font-semibold">{format(currentMonth, "MMMM yyyy")}</h3>
        <Button variant="ghost" size="icon" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {weekDays.map((d) => (
          <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-2 bg-muted/50">{d}</div>
        ))}
        {days.map((day) => {
          const dayTasks = getTasksForDay(day);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentDay = isSameDay(day, new Date());

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[80px] p-1 bg-card cursor-pointer hover:bg-accent/20 transition-colors",
                !isCurrentMonth && "opacity-40"
              )}
              onClick={() => handleDayClick(day)}
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
