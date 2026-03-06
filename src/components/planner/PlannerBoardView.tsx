import { useMemo } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { CheckCircle2, Circle, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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

const BOARD_COLUMNS = [
  { id: "todo", label: "To Do" },
  { id: "in-progress", label: "Doing" },
  { id: "done", label: "Done" },
];

interface PlannerBoardViewProps {
  tasks: PlannerTask[];
  onToggleComplete: (task: PlannerTask) => void;
  onEditTask: (task: PlannerTask) => void;
  onDeleteTask: (taskId: string) => void;
  onStatusChange: (taskId: string, newStatus: string) => void;
}

export const PlannerBoardView = ({ tasks, onToggleComplete, onEditTask, onDeleteTask, onStatusChange }: PlannerBoardViewProps) => {
  // Only show tasks (not events) in board view
  const boardTasks = useMemo(() => tasks.filter((t) => t.task_type !== "event"), [tasks]);

  const columns = useMemo(() => {
    const map: Record<string, PlannerTask[]> = {};
    BOARD_COLUMNS.forEach((c) => (map[c.id] = []));
    boardTasks.forEach((t) => {
      const col = map[t.column_id] ? t.column_id : "todo";
      map[col].push(t);
    });
    return map;
  }, [boardTasks]);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const taskId = result.draggableId;
    const newStatus = result.destination.droppableId;
    onStatusChange(taskId, newStatus);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {BOARD_COLUMNS.map((col) => (
          <Droppable key={col.id} droppableId={col.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "rounded-lg border border-border bg-muted/20 min-h-[200px]",
                  snapshot.isDraggingOver && "bg-accent/20"
                )}
              >
                <div className="px-3 py-2 border-b border-border">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    {col.label}
                    <Badge variant="secondary" className="text-[10px]">{columns[col.id].length}</Badge>
                  </h4>
                </div>
                <div className="p-2 space-y-2">
                  {columns[col.id].map((task, index) => (
                    <Draggable key={task.id} draggableId={task.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={cn(
                            "p-3 rounded-md border border-border bg-card hover:shadow-sm transition-shadow cursor-pointer",
                            snapshot.isDragging && "shadow-md"
                          )}
                          onClick={() => onEditTask(task)}
                        >
                          <p className={cn("text-sm font-medium", task.column_id === "done" && "line-through text-muted-foreground")}>{task.title}</p>
                          <div className="flex items-center gap-1 mt-1.5">
                            {task.category && (
                              <Badge variant="outline" className="text-[9px] px-1 py-0">{task.category}</Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
};
