import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { format, parseISO, isPast, isToday } from "date-fns";
import { GripVertical, MoreHorizontal, Pencil, Trash2, Calendar, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskDialog, Task } from "@/components/TaskDialog";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";

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
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  
  // Dialog state
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("position", { ascending: true });

    if (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks");
    } else {
      setTasks(data || []);
    }
    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async (data: { title: string; description: string; due_date: Date | null; column_id: string }) => {
    if (!user) return;

    const { error } = await supabase.from("tasks").insert({
      project_id: projectId,
      user_id: user.id,
      title: data.title,
      description: data.description || null,
      due_date: data.due_date ? format(data.due_date, "yyyy-MM-dd") : null,
      column_id: data.column_id,
      position: tasks.filter(t => t.column_id === data.column_id).length,
    });

    if (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
      throw error;
    }

    toast.success("Task created");
    fetchTasks();
  };

  const handleUpdateTask = async (data: { title: string; description: string; due_date: Date | null; column_id: string }) => {
    if (!editingTask) return;

    const { error } = await supabase
      .from("tasks")
      .update({
        title: data.title,
        description: data.description || null,
        due_date: data.due_date ? format(data.due_date, "yyyy-MM-dd") : null,
        column_id: data.column_id,
      })
      .eq("id", editingTask.id);

    if (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
      throw error;
    }

    toast.success("Task updated");
    setEditingTask(null);
    fetchTasks();
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    setIsDeleting(true);
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskToDelete.id);

    if (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    } else {
      toast.success("Task deleted");
      fetchTasks();
    }
    
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  const handleEditClick = (task: Task) => {
    setEditingTask(task);
    setTaskDialogOpen(true);
  };

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

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

  const handleDrop = async (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    if (draggedTask && draggedTask.column_id !== columnId) {
      // Optimistic update
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === draggedTask.id ? { ...task, column_id: columnId } : task
        )
      );

      // Update in database
      const { error } = await supabase
        .from("tasks")
        .update({ column_id: columnId })
        .eq("id", draggedTask.id);

      if (error) {
        console.error("Error moving task:", error);
        toast.error("Failed to move task");
        fetchTasks(); // Revert on error
      }
    }
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedTask(null);
    setDragOverColumn(null);
  };

  const getTasksByColumn = (columnId: string) =>
    tasks.filter((task) => task.column_id === columnId);

  const getDueDateColor = (dueDateStr: string | null) => {
    if (!dueDateStr) return "";
    const dueDate = parseISO(dueDateStr);
    if (isPast(dueDate) && !isToday(dueDate)) return "text-destructive";
    if (isToday(dueDate)) return "text-warning";
    return "text-muted-foreground";
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button onClick={() => { setEditingTask(null); setTaskDialogOpen(true); }}>
          <Plus className="w-4 h-4" />
          Add Task
        </Button>
      </div>

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
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-medium text-foreground text-sm">{column.label}</h4>
              <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {getTasksByColumn(column.id).length}
              </span>
            </div>
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
                  <div className="flex items-start gap-2">
                    <GripVertical className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium text-foreground line-clamp-2">{task.title}</span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                              <MoreHorizontal className="w-3 h-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditClick(task)}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDeleteClick(task)}
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                      {task.description && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
                      )}
                      {task.due_date && (
                        <div className={cn("flex items-center gap-1 mt-2 text-xs", getDueDateColor(task.due_date))}>
                          <Calendar className="w-3 h-3" />
                          <span>{format(parseISO(task.due_date), "MMM d, yyyy")}</span>
                        </div>
                      )}
                    </div>
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

      {/* Task Dialog */}
      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={(open) => {
          setTaskDialogOpen(open);
          if (!open) setEditingTask(null);
        }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        editTask={editingTask}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        description={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        isDeleting={isDeleting}
      />
    </>
  );
};
