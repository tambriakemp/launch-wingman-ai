import { useMemo, useCallback } from "react";
import { format, parseISO } from "date-fns";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { CheckCircle2, Circle, Plus, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { PlannerTask } from "./PlannerTaskDialog";
import type { PlannerSpace, SpaceCategory } from "@/hooks/usePlannerSpaces";

interface PlannerKanbanViewProps {
  tasks: PlannerTask[];
  isLoading: boolean;
  onEditTask: (task: PlannerTask) => void;
  onToggleComplete?: (task: PlannerTask) => void;
  onAddTask?: () => void;
  onMoveTask?: (taskId: string, newColumnId: string) => void;
  categories?: SpaceCategory[];
  spaces?: PlannerSpace[];
}

const COLUMNS = [
  { id: "todo", label: "To Do", dotColor: "bg-muted-foreground" },
  { id: "in-progress", label: "In Progress", dotColor: "bg-blue-500" },
  { id: "done", label: "Done", dotColor: "bg-emerald-500" },
];

function getPriorityOrder(p: string | null | undefined): number {
  switch (p) {
    case "urgent": return 0;
    case "high": return 1;
    case "normal": return 2;
    case "low": return 3;
    default: return 4;
  }
}

function getPriorityBadge(priority: string | null | undefined) {
  switch (priority) {
    case "urgent":
      return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-red-500/15 text-red-600 dark:text-red-400">Urgent</span>;
    case "high":
      return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-orange-500/15 text-orange-600 dark:text-orange-400">High</span>;
    case "low":
      return <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-muted text-muted-foreground">Low</span>;
    default:
      return null;
  }
}

export const PlannerKanbanView = ({
  tasks,
  isLoading,
  onEditTask,
  onToggleComplete,
  onAddTask,
  onMoveTask,
  categories = [],
  spaces = [],
}: PlannerKanbanViewProps) => {
  const columnTasks = useMemo(() => {
    const map: Record<string, PlannerTask[]> = { todo: [], "in-progress": [], done: [] };
    for (const task of tasks) {
      const col = task.column_id === "in_progress" ? "in-progress" : (task.column_id || "todo");
      if (map[col]) map[col].push(task);
      else map.todo.push(task);
    }
    for (const key of Object.keys(map)) {
      map[key].sort((a, b) => {
        const pa = getPriorityOrder((a as any).priority);
        const pb = getPriorityOrder((b as any).priority);
        if (pa !== pb) return pa - pb;
        if (a.due_at && b.due_at) return parseISO(a.due_at).getTime() - parseISO(b.due_at).getTime();
        if (a.due_at) return -1;
        if (b.due_at) return 1;
        return 0;
      });
    }
    return map;
  }, [tasks]);

  const handleDragEnd = useCallback((result: DropResult) => {
    const { draggableId, destination, source } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;
    onMoveTask?.(draggableId, destination.droppableId);
  }, [onMoveTask]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 p-4 h-full overflow-x-auto">
        {COLUMNS.map((col) => {
          const colTasks = columnTasks[col.id] || [];
          return (
            <div key={col.id} className="flex flex-col w-[320px] min-w-[280px] shrink-0">
              {/* Column header */}
              <div className="flex items-center gap-2 px-3 py-2 mb-2">
                <div className={cn("w-2 h-2 rounded-full", col.dotColor)} />
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {col.label}
                </span>
                <span className="text-xs text-muted-foreground/60 ml-1">{colTasks.length}</span>
              </div>

              {/* Droppable column */}
              <Droppable droppableId={col.id}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className={cn(
                      "flex-1 overflow-y-auto space-y-2 px-1 pb-4 rounded-xl transition-colors min-h-[120px]",
                      snapshot.isDraggingOver && "bg-accent/40 ring-2 ring-primary/20"
                    )}
                  >
                    {colTasks.map((task, index) => {
                      const space = spaces.find(s => s.id === (task as any).space_id);
                      const cat = categories.find(c => c.id === task.category);
                      const isDone = col.id === "done";
                      const spaceColor = space?.color || "#71717a";

                      return (
                        <Draggable key={task.id} draggableId={task.id} index={index}>
                          {(dragProvided, dragSnapshot) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                              className={cn(
                                "w-full text-left rounded-xl border border-border bg-card p-3 hover:shadow-md transition-all group cursor-pointer",
                                isDone && "opacity-60",
                                dragSnapshot.isDragging && "shadow-lg ring-2 ring-primary/30 rotate-1"
                              )}
                              onClick={() => onEditTask(task)}
                            >
                              <div className="flex items-start gap-2">
                                {/* Drag handle */}
                                <div
                                  {...dragProvided.dragHandleProps}
                                  className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground" />
                                </div>
                                {/* Space accent bar */}
                                <div
                                  className="w-1 rounded-full shrink-0 self-stretch min-h-[24px]"
                                  style={{ background: spaceColor }}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className={cn(
                                      "text-sm font-medium text-foreground leading-snug",
                                      isDone && "line-through text-muted-foreground"
                                    )}>
                                      {task.title}
                                    </p>
                                    {onToggleComplete && (
                                      <button
                                        className="shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => { e.stopPropagation(); onToggleComplete(task); }}
                                      >
                                        {isDone
                                          ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                          : <Circle className="w-4 h-4 text-muted-foreground hover:text-primary" />
                                        }
                                      </button>
                                    )}
                                  </div>

                                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                    {getPriorityBadge((task as any).priority)}
                                    {cat && (
                                      <span
                                        className="px-1.5 py-0.5 rounded text-[9px] font-medium"
                                        style={{ background: `${cat.color}20`, color: cat.color }}
                                      >
                                        {cat.name}
                                      </span>
                                    )}
                                    {space && (
                                      <span className="text-[9px] text-muted-foreground">
                                        {space.name}
                                      </span>
                                    )}
                                  </div>

                                  {task.due_at && (
                                    <p className="text-[10px] text-muted-foreground mt-1.5">
                                      {format(parseISO(task.due_at), "MMM d, yyyy")}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      );
                    })}
                    {provided.placeholder}

                    {col.id === "todo" && colTasks.length === 0 && (
                      <div className="text-center py-8">
                        <p className="text-xs text-muted-foreground mb-2">No tasks yet</p>
                        {onAddTask && (
                          <Button variant="outline" size="sm" className="gap-1.5" onClick={onAddTask}>
                            <Plus className="w-3.5 h-3.5" /> Add task
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </div>
          );
        })}
      </div>
    </DragDropContext>
  );
};
