import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { format, parseISO, isPast, isToday } from "date-fns";
import { GripVertical, MoreHorizontal, Pencil, Trash2, Calendar, Plus, ListTodo, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TaskDialog, Task, TASK_LABELS } from "@/components/TaskDialog";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { LoadLaunchTasksDialog } from "@/components/LoadLaunchTasksDialog";

const COLUMNS = [
  { id: "todo", label: "To Do" },
  { id: "blocked", label: "Blocked/Waiting" },
  { id: "in-progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
];

interface ProjectBoardProps {
  projectId: string;
  projectType: "launch" | "prelaunch";
}

export const ProjectBoard = ({ projectId, projectType }: ProjectBoardProps) => {
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

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Refs for synced scrolling
  const topScrollRef = useRef<HTMLDivElement>(null);
  const boardScrollRef = useRef<HTMLDivElement>(null);

  // Sync scroll between top scrollbar and board
  const handleTopScroll = () => {
    if (topScrollRef.current && boardScrollRef.current) {
      boardScrollRef.current.scrollLeft = topScrollRef.current.scrollLeft;
    }
  };

  const handleBoardScroll = () => {
    if (topScrollRef.current && boardScrollRef.current) {
      topScrollRef.current.scrollLeft = boardScrollRef.current.scrollLeft;
    }
  };

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    
    const { data: tasksData, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("position", { ascending: true });

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
      toast.error("Failed to load tasks");
      setIsLoading(false);
      return;
    }

    // Fetch subtask counts for all tasks
    const taskIds = tasksData?.map(t => t.id) || [];
    if (taskIds.length > 0) {
      const { data: subtaskCounts, error: subtaskError } = await supabase
        .from("subtasks")
        .select("task_id")
        .in("task_id", taskIds);

      if (!subtaskError && subtaskCounts) {
        const countMap = subtaskCounts.reduce((acc, s) => {
          acc[s.task_id] = (acc[s.task_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        setTasks(tasksData.map(t => ({
          ...t,
          subtask_count: countMap[t.id] || 0
        })));
      } else {
        setTasks(tasksData || []);
      }
    } else {
      setTasks(tasksData || []);
    }
    
    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async (data: { title: string; description: string; due_date: Date | null; column_id: string; labels: string[] }) => {
    if (!user) return;

    const { error } = await supabase.from("tasks").insert({
      project_id: projectId,
      user_id: user.id,
      title: data.title,
      description: data.description || null,
      due_date: data.due_date ? format(data.due_date, "yyyy-MM-dd") : null,
      column_id: data.column_id,
      labels: data.labels,
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

  const handleUpdateTask = async (data: { title: string; description: string; due_date: Date | null; column_id: string; labels: string[] }) => {
    if (!editingTask) return;

    const { error } = await supabase
      .from("tasks")
      .update({
        title: data.title,
        description: data.description || null,
        due_date: data.due_date ? format(data.due_date, "yyyy-MM-dd") : null,
        column_id: data.column_id,
        labels: data.labels,
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

  const handleCardClick = (task: Task, e: React.MouseEvent) => {
    // Don't open dialog if clicking on dropdown menu or grip
    if ((e.target as HTMLElement).closest('[data-no-click]')) return;
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

  const toggleLabelFilter = (labelId: string) => {
    setSelectedLabels(prev =>
      prev.includes(labelId)
        ? prev.filter(id => id !== labelId)
        : [...prev, labelId]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedLabels([]);
    setSelectedStatus("all");
  };

  const hasActiveFilters = searchQuery || selectedLabels.length > 0 || selectedStatus !== "all";

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    // Search filter
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Label filter
    if (selectedLabels.length > 0 && !selectedLabels.some(label => task.labels?.includes(label))) {
      return false;
    }
    // Status filter
    if (selectedStatus !== "all" && task.column_id !== selectedStatus) {
      return false;
    }
    return true;
  });

  const getTasksByColumn = (columnId: string) =>
    filteredTasks.filter((task) => task.column_id === columnId);

  const getDueDateColor = (dueDateStr: string | null) => {
    if (!dueDateStr) return "text-muted-foreground/50";
    const dueDate = parseISO(dueDateStr);
    if (isPast(dueDate) && !isToday(dueDate)) return "text-destructive";
    if (isToday(dueDate)) return "text-warning";
    return "text-muted-foreground";
  };

  const getLabelInfo = (labelId: string) => {
    return TASK_LABELS.find((l) => l.id === labelId);
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
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-48 h-9"
            />
          </div>
          
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-40 h-9">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {COLUMNS.map((column) => (
                <SelectItem key={column.id} value={column.id}>
                  {column.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-9">
                <Filter className="w-4 h-4 mr-2" />
                Labels
                {selectedLabels.length > 0 && (
                  <Badge variant="secondary" className="ml-2 h-5 px-1.5">
                    {selectedLabels.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Filter by label</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {TASK_LABELS.map((label) => (
                <DropdownMenuCheckboxItem
                  key={label.id}
                  checked={selectedLabels.includes(label.id)}
                  onCheckedChange={() => toggleLabelFilter(label.id)}
                >
                  <span className={cn("px-2 py-0.5 rounded text-xs", label.color)}>
                    {label.label}
                  </span>
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2">
          <LoadLaunchTasksDialog
            projectId={projectId}
            projectType={projectType}
            onTasksLoaded={fetchTasks}
            taskCount={tasks.length}
          />
          <Button onClick={() => { setEditingTask(null); setTaskDialogOpen(true); }}>
            <Plus className="w-4 h-4" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Top scrollbar */}
      <div 
        ref={topScrollRef}
        onScroll={handleTopScroll}
        className="overflow-x-auto h-3 mb-2"
      >
        <div className="h-1" style={{ width: `${COLUMNS.length * 280 + (COLUMNS.length - 1) * 16}px` }} />
      </div>

      {/* Board - scrollable container */}
      <div 
        ref={boardScrollRef}
        onScroll={handleBoardScroll}
        className="overflow-x-auto pb-4"
      >
        <div className="flex gap-4 min-w-max py-1">
          {COLUMNS.map((column) => (
            <div
              key={column.id}
              className={cn(
                "bg-muted/50 rounded-lg p-4 min-h-[300px] w-[280px] flex-shrink-0 transition-colors",
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
                      "p-3 bg-card rounded-lg border shadow-sm cursor-pointer hover:shadow-md transition-shadow group",
                      draggedTask?.id === task.id && "opacity-50"
                    )}
                    draggable
                    onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent, task)}
                    onDragEnd={handleDragEnd}
                    onClick={(e) => handleCardClick(task, e)}
                  >
                    <div className="flex items-start gap-2">
                      <GripVertical 
                        data-no-click
                        className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-0.5 flex-shrink-0 cursor-grab active:cursor-grabbing" 
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-sm font-medium text-foreground line-clamp-2">{task.title}</span>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                data-no-click
                                variant="ghost" 
                                size="icon" 
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="w-3 h-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditingTask(task); setTaskDialogOpen(true); }}>
                                <Pencil className="w-4 h-4 mr-2" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive"
                                onClick={(e) => { e.stopPropagation(); handleDeleteClick(task); }}
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
                        {/* Labels */}
                        {task.labels && task.labels.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {task.labels.map((labelId) => {
                              const labelInfo = getLabelInfo(labelId);
                              if (!labelInfo) return null;
                              return (
                                <Badge
                                  key={labelId}
                                  variant="outline"
                                  className={cn("text-[10px] px-1.5 py-0", labelInfo.color)}
                                >
                                  {labelInfo.label}
                                </Badge>
                              );
                            })}
                          </div>
                        )}
                        {/* Due date */}
                        <div className={cn("flex items-center gap-1 text-xs mt-2", getDueDateColor(task.due_date))}>
                          <Calendar className="w-3 h-3" />
                          <span>{task.due_date ? format(parseISO(task.due_date), "MMM d") : "No date"}</span>
                        </div>
                        {/* Subtask indicator - always show icon */}
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1.5">
                          <ListTodo className="w-3 h-3" />
                          {task.subtask_count && task.subtask_count > 0 && (
                            <span>{task.subtask_count} subtask{task.subtask_count > 1 ? 's' : ''}</span>
                          )}
                        </div>
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
        onSubtasksChange={fetchTasks}
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