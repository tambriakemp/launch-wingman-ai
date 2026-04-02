import { useState } from "react";
import { format, parseISO, isPast, isToday, startOfWeek, endOfWeek, isBefore, isAfter } from "date-fns";
import { CheckCircle2, Circle, ChevronDown, ChevronRight, MoreHorizontal, Pencil, Trash2, Plus } from "lucide-react";
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
  onAddTask?: () => void;
}

type GroupKey = "overdue" | "today" | "this_week" | "anytime" | "completed";

const GROUP_CONFIG: { key: GroupKey; label: string; defaultOpen: boolean; color: string }[] = [
  { key: "overdue", label: "OVERDUE", defaultOpen: true, color: "bg-destructive" },
  { key: "today", label: "TODAY", defaultOpen: true, color: "bg-blue-500" },
  { key: "this_week", label: "THIS WEEK", defaultOpen: true, color: "bg-amber-500" },
  { key: "anytime", label: "ANYTIME", defaultOpen: true, color: "bg-muted-foreground" },
  { key: "completed", label: "DONE", defaultOpen: false, color: "bg-emerald-500" },
];

function groupTasks(tasks: PlannerTask[]): Record<GroupKey, PlannerTask[]> {
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

  const groups: Record<GroupKey, PlannerTask[]> = {
    overdue: [], today: [], this_week: [], anytime: [], completed: [],
  };

  for (const task of tasks) {
    if (task.column_id === "done") { groups.completed.push(task); continue; }
    const due = task.due_at ? parseISO(task.due_at) : null;
    if (due) {
      if (isToday(due)) groups.today.push(task);
      else if (isPast(due)) groups.overdue.push(task);
      else if (!isBefore(due, weekStart) && !isAfter(due, weekEnd)) groups.this_week.push(task);
      else groups.anytime.push(task);
    } else {
      groups.anytime.push(task);
    }
  }
  return groups;
}

function getStatusBadge(columnId: string) {
  switch (columnId) {
    case "done":
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">Done</span>;
    case "in_progress":
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-blue-500/15 text-blue-600 dark:text-blue-400">In Progress</span>;
    default:
      return <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider bg-muted text-muted-foreground">To Do</span>;
  }
}

export const PlannerListView = ({ tasks, isLoading, onToggleComplete, onEditTask, onDeleteTask, onAddTask }: PlannerListViewProps) => {
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(GROUP_CONFIG.map((g) => [g.key, g.defaultOpen]))
  );




  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  const grouped = groupTasks(tasks);
  const toggleGroup = (key: string) => setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="px-4 pb-4">
      {/* Column headers */}
      <div className="grid grid-cols-[minmax(0,1fr)_100px_100px_90px_36px] gap-2 items-center px-4 py-1.5 border-b border-border text-[11px] font-medium uppercase tracking-wider text-muted-foreground select-none sticky top-0 bg-background z-10">
        <span className="pl-8">Name</span>
        <span>Due Date</span>
        <span>Category</span>
        <span>Status</span>
        <span />
      </div>

      {GROUP_CONFIG.map(({ key, label, color }) => {
        const items = grouped[key];
        if (items.length === 0) return null;
        const isOpen = expandedGroups[key];

        return (
          <div key={key} className="mt-1">
            {/* Group header */}
            <button
              type="button"
              className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted/40 transition-colors text-left rounded-sm"
              onClick={() => toggleGroup(key)}
            >
              {isOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
              <span className={cn("w-2 h-2 rounded-full shrink-0", color)} />
              <span className="text-xs font-semibold tracking-wide text-foreground">{label}</span>
              <span className="text-[10px] text-muted-foreground ml-1">{items.length}</span>
            </button>

            {isOpen && (
              <div>
                {items.map((task) => (
                  <TaskRow key={task.id} task={task} onToggleComplete={onToggleComplete} onEdit={onEditTask} onDelete={onDeleteTask} />
                ))}
                {/* Add task row */}
                {onAddTask && (
                  <button
                    type="button"
                    className="w-full flex items-center gap-2 px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors pl-12"
                    onClick={onAddTask}
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Task</span>
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {tasks.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-sm font-medium">No tasks yet</p>
          <p className="text-xs mt-1 mb-4">Get started by adding your first task.</p>
          {onAddTask && (
            <Button size="sm" className="gap-1.5" onClick={onAddTask}>
              <Plus className="w-4 h-4" /> Add Task
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

function TaskRow({ task, onToggleComplete, onEdit, onDelete }: { task: PlannerTask; onToggleComplete: (t: PlannerTask) => void; onEdit: (t: PlannerTask) => void; onDelete: (id: string) => void }) {
  const isDone = task.column_id === "done";

  const getCategoryName = (id: string | null | undefined) => {
    if (!id) return "—";
    const DEFAULT_CATEGORIES: Record<string, string> = { business: "Work", life: "Personal", health: "Health", finance: "Finance" };
    try {
      const stored = localStorage.getItem("planner-categories");
      if (stored) {
        const cats = JSON.parse(stored);
        const found = cats.find((c: any) => c.id === id);
        if (found) return found.name;
      }
    } catch {}
    return DEFAULT_CATEGORIES[id] || id;
  };

  return (
    <div
      className="grid grid-cols-[minmax(0,1fr)_100px_100px_90px_36px] gap-2 items-center px-4 h-9 hover:bg-accent/40 transition-colors cursor-pointer group border-b border-border/50"
      onClick={() => onEdit(task)}
    >
      {/* Name */}
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          className="shrink-0"
          onClick={(e) => { e.stopPropagation(); onToggleComplete(task); }}
        >
          {isDone
            ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            : <Circle className="w-4 h-4 text-muted-foreground/50 hover:text-primary transition-colors" />
          }
        </button>
        <span className={cn("text-sm truncate", isDone && "line-through text-muted-foreground")}>{task.title}</span>
      </div>

      {/* Due Date */}
      <span className={cn(
        "text-xs truncate",
        task.due_at && isPast(parseISO(task.due_at)) && !isToday(parseISO(task.due_at)) && !isDone
          ? "text-destructive"
          : "text-muted-foreground"
      )}>
        {task.due_at ? format(parseISO(task.due_at), "MMM d") : "—"}
      </span>

      {/* Category */}
      <span className="text-xs text-muted-foreground truncate capitalize">
        {getCategoryName(task.category)}
      </span>

      {/* Status */}
      {getStatusBadge(task.column_id)}

      {/* Actions */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
            <MoreHorizontal className="w-3.5 h-3.5" />
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
