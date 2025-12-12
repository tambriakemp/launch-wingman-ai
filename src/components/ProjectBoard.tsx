import { useState } from "react";
import { motion } from "framer-motion";
import { GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  column: string;
}

const COLUMNS = [
  { id: "todo", label: "To Do" },
  { id: "blocked", label: "Blocked/Waiting" },
  { id: "in-progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
];

interface ProjectBoardProps {
  projectId: string;
}

export const ProjectBoard = ({ projectId }: ProjectBoardProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOverColumn(columnId);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (draggedTask && draggedTask.column !== columnId) {
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === draggedTask.id ? { ...task, column: columnId } : task
        )
      );
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const getTasksByColumn = (columnId: string) =>
    tasks.filter((task) => task.column === columnId);

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto">
      {COLUMNS.map((column) => (
        <div
          key={column.id}
          className={cn(
            "bg-muted/50 rounded-lg p-4 min-h-[300px] transition-colors",
            dragOverColumn === column.id && "bg-primary/10 ring-2 ring-primary/30"
          )}
          onDragOver={(e) => handleDragOver(e, column.id)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, column.id)}
        >
          <h4 className="font-medium text-foreground mb-4 text-sm">{column.label}</h4>
          <div className="space-y-2">
            {getTasksByColumn(column.id).map((task) => (
              <motion.div
                key={task.id}
                layout
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn(
                  "p-3 bg-card rounded-lg border shadow-sm cursor-grab active:cursor-grabbing group",
                  draggedTask?.id === task.id && "opacity-50"
                )}
                draggable
                onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, task)}
                onDragEnd={handleDragEnd}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  <span className="text-sm text-foreground">{task.title}</span>
                </div>
              </motion.div>
            ))}
            {getTasksByColumn(column.id).length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="text-sm text-muted-foreground">No tasks</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
