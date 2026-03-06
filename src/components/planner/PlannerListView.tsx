import { useState } from "react";
import { format, parseISO, isPast, isToday, startOfWeek, endOfWeek, isBefore, isAfter } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Circle, Calendar, MapPin, ChevronDown, ChevronRight, MoreHorizontal, Pencil, Trash2, CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PlannerTask } from "./PlannerTaskDialog";

interface PlannerListViewProps {
  tasks: PlannerTask[];
  isLoading: boolean;
  onToggleComplete: (task: PlannerTask) => void;
  onEditTask: (task: PlannerTask) => void;
  onDeleteTask: (taskId: string) => void;
}

type GroupKey = "overdue" | "today" | "this_week" | "anytime" | "completed";

const GROUP_CONFIG: { key: GroupKey; label: string; defaultOpen: boolean }[] = [
  { key: "overdue", label: "Overdue", defaultOpen: true },
  { key: "today", label: "Today", defaultOpen: true },
  { key: "this_week", label: "This Week", defaultOpen: true },
  { key: "anytime", label: "Anytime", defaultOpen: true },
  { key: "completed", label: "Completed", defaultOpen: false },
];

function groupTasks(tasks: PlannerTask[]): Record<GroupKey, PlannerTask[]> {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const groups: Record<GroupKey, PlannerTask[]> = {
    overdue: [],
    today: [],
    this_week: [],
    anytime: [],
    completed: [],
  };

  for (const task of tasks) {
    if (task.column_id === "done") {
      groups.completed.push(task);
      continue;
    }

    const due = task.due_at ? parseISO(task.due_at) : null;
    if (due) {
      if (isToday(due)) {
        groups.today.push(task);
      } else if (isPast(due)) {
        groups.overdue.push(task);
      } else if (!isBefore(due, weekStart) && !isAfter(due, weekEnd)) {
        groups.this_week.push(task);
      } else {
        groups.anytime.push(task);
      }
    } else {
      groups.anytime.push(task);
    }
  }

  return groups;
}

export const PlannerListView = ({ tasks, isLoading, onToggleComplete, onEditTask, onDeleteTask }: PlannerListViewProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(GROUP_CONFIG.map((g) => [g.key, g.defaultOpen]))
  );

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  const grouped = groupTasks(tasks);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-3">
      {GROUP_CONFIG.map(({ key, label }) => {
        const groupTasks = grouped[key];
        if (groupTasks.length === 0) return null;
        const isOpen = expandedGroups[key];

        return (
          <div key={key} className="border border-border rounded-lg overflow-hidden">
            <button
              type="button"
              className="w-full flex items-center gap-2 px-4 py-2.5 bg-muted/30 hover:bg-muted/50 transition-colors text-left"
              onClick={() => toggleGroup(key)}
            >
              {isOpen ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              <span className={cn("font-medium text-sm", key === "overdue" && "text-destructive")}>{label}</span>
              <Badge variant="secondary" className="ml-auto text-xs">{groupTasks.length}</Badge>
            </button>
            <AnimatePresence>
              {isOpen && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                  <div className="divide-y divide-border">
                    {groupTasks.map((task) => (
                      <TaskRow key={task.id} task={task} onToggleComplete={onToggleComplete} onEdit={onEditTask} onDelete={onDeleteTask} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {tasks.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <CalendarCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No planner items yet. Click "Add" to get started.</p>
        </div>
      )}
    </div>
  );
};

function TaskRow({ task, onToggleComplete, onEdit, onDelete }: { task: PlannerTask; onToggleComplete: (t: PlannerTask) => void; onEdit: (t: PlannerTask) => void; onDelete: (id: string) => void }) {
  const isDone = task.column_id === "done";
  const isEvent = task.task_type === "event";

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-accent/30 transition-colors group cursor-pointer" onClick={() => onEdit(task)}>
      <button
        type="button"
        className="shrink-0"
        onClick={(e) => { e.stopPropagation(); onToggleComplete(task); }}
      >
        {isDone ? <CheckCircle2 className="w-5 h-5 text-primary" /> : <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-medium truncate", isDone && "line-through text-muted-foreground")}>{task.title}</span>
          {isEvent && <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/30 text-primary">Event</Badge>}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {task.category && (
            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{task.category}</Badge>
          )}
          {task.due_at && (
            <span className={cn("text-[10px] flex items-center gap-0.5", isPast(parseISO(task.due_at)) && !isToday(parseISO(task.due_at)) && task.column_id !== "done" ? "text-destructive" : "text-muted-foreground")}>
              <Calendar className="w-3 h-3" />
              {format(parseISO(task.due_at), "MMM d")}
            </span>
          )}
          {task.start_at && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <Calendar className="w-3 h-3" />
              {format(parseISO(task.start_at), "MMM d, h:mm a")}
            </span>
          )}
          {task.location && (
            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
              <MapPin className="w-3 h-3" />
              {task.location}
            </span>
          )}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(task); }}>
            <Pencil className="w-4 h-4 mr-2" /> Edit
          </DropdownMenuItem>
          <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}>
            <Trash2 className="w-4 h-4 mr-2" /> Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
