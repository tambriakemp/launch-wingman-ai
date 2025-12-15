import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, isPast, isToday } from "date-fns";
import { ChevronRight, ChevronDown, MoreHorizontal, Pencil, Trash2, Calendar, Plus, ListTodo, X, ChevronsUpDown, Settings, ListChecks, Search } from "lucide-react";
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
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { TaskDialog, Task, TASK_LABELS, TASK_PHASES } from "@/components/TaskDialog";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { LoadLaunchTasksDialog } from "@/components/LoadLaunchTasksDialog";
import { FilterPopover } from "@/components/FilterPopover";

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
  const [selectedPhase, setSelectedPhase] = useState<string>("all");

  // Collapsible phase state - includes "unassigned" for tasks with no phase
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set([...TASK_PHASES.map(p => p.id), "unassigned"]));

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedPhases(new Set([...TASK_PHASES.map(p => p.id), "unassigned"]));
  };

  const collapseAll = () => {
    setExpandedPhases(new Set());
  };

  const allExpanded = expandedPhases.size === TASK_PHASES.length + 1;

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

  const handleCreateTask = async (data: { title: string; description: string; due_date: Date | null; column_id: string; labels: string[]; phase: string | null }) => {
    if (!user) return;

    const { error } = await supabase.from("tasks").insert({
      project_id: projectId,
      user_id: user.id,
      title: data.title,
      description: data.description || null,
      due_date: data.due_date ? format(data.due_date, "yyyy-MM-dd") : null,
      column_id: data.column_id,
      labels: data.labels,
      phase: data.phase,
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

  const handleUpdateTask = async (data: { title: string; description: string; due_date: Date | null; column_id: string; labels: string[]; phase: string | null }) => {
    if (!editingTask) return;

    const { error } = await supabase
      .from("tasks")
      .update({
        title: data.title,
        description: data.description || null,
        due_date: data.due_date ? format(data.due_date, "yyyy-MM-dd") : null,
        column_id: data.column_id,
        labels: data.labels,
        phase: data.phase,
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


  // Label filter is now handled by FilterPopover

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedLabels([]);
    setSelectedStatus("all");
    setSelectedPhase("all");
  };

  const hasActiveFilters = searchQuery || selectedLabels.length > 0 || selectedStatus !== "all" || selectedPhase !== "all";

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
    // Phase filter
    if (selectedPhase !== "all" && task.phase !== selectedPhase) {
      return false;
    }
    return true;
  });

  const getTasksByPhase = (phaseId: string | null) =>
    filteredTasks.filter((task) => task.phase === phaseId);

  const getStatusInfo = (columnId: string) => {
    const column = COLUMNS.find(c => c.id === columnId);
    return column || { id: "todo", label: "To Do" };
  };

  const getStatusColor = (columnId: string) => {
    switch (columnId) {
      case "done": return "bg-emerald-500";
      case "in-progress": return "bg-blue-500";
      case "review": return "bg-purple-500";
      case "blocked": return "bg-amber-500";
      default: return "bg-muted-foreground";
    }
  };

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

  const getPhaseInfo = (phaseId: string | null) => {
    if (!phaseId) return null;
    return TASK_PHASES.find((p) => p.id === phaseId);
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
      {/* Toolbar - Streamlined */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Search & Filters */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-52 h-9 pl-8"
            />
          </div>

          <FilterPopover
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            selectedLabels={selectedLabels}
            onLabelsChange={setSelectedLabels}
            selectedPhase={selectedPhase}
            onPhaseChange={setSelectedPhase}
            onClear={clearFilters}
          />

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-muted-foreground">
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-muted-foreground"
            onClick={allExpanded ? collapseAll : expandAll}
          >
            <ChevronsUpDown className="w-4 h-4 mr-1" />
            {allExpanded ? "Collapse" : "Expand"}
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Board Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <LoadLaunchTasksDialog
                projectId={projectId}
                projectType={projectType}
                onTasksLoaded={fetchTasks}
                taskCount={tasks.length}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <ListChecks className="w-4 h-4 mr-2" />
                    Load Launch Tasks
                  </DropdownMenuItem>
                }
              />
              {tasks.length > 0 && (
                <LoadLaunchTasksDialog
                  projectId={projectId}
                  projectType={projectType}
                  onTasksLoaded={fetchTasks}
                  taskCount={tasks.length}
                  showDeleteOnly
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete All Tasks
                    </DropdownMenuItem>
                  }
                />
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => { setEditingTask(null); setTaskDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Phase-grouped task list */}
      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ListTodo className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No tasks yet</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-md">
            Get started by adding your first task or loading a pre-built launch task template.
          </p>
          <div className="flex gap-3">
            <Button onClick={() => { setEditingTask(null); setTaskDialogOpen(true); }}>
              <Plus className="w-4 h-4 mr-2" />
              Add Task
            </Button>
            <LoadLaunchTasksDialog
              projectId={projectId}
              projectType={projectType}
              onTasksLoaded={fetchTasks}
              taskCount={0}
              trigger={
                <Button variant="outline">
                  <ListChecks className="w-4 h-4 mr-2" />
                  Load Launch Tasks
                </Button>
              }
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Render phases in order */}
        {TASK_PHASES.map((phase) => {
          const phaseTasks = getTasksByPhase(phase.id);
          const isExpanded = expandedPhases.has(phase.id);
          
          return (
            <div key={phase.id} className="border rounded-lg overflow-hidden bg-card">
              {/* Phase header */}
              <button
                onClick={() => togglePhase(phase.id)}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                <Badge className={cn("text-xs", phase.color)}>
                  {phase.label}
                </Badge>
                <span className="text-sm text-muted-foreground ml-auto">
                  {phaseTasks.length}
                </span>
              </button>

              {/* Phase tasks */}
              <AnimatePresence initial={false}>
                {isExpanded && phaseTasks.length > 0 && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t">
                      {/* Column headers */}
                      <div className="grid grid-cols-[1fr,120px,100px,100px] gap-2 px-4 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/30">
                        <span>Name</span>
                        <span>Status</span>
                        <span>Due date</span>
                        <span className="text-right">Actions</span>
                      </div>
                      {/* Task rows */}
                      {phaseTasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={(e) => handleCardClick(task, e)}
                          className="grid grid-cols-[1fr,120px,100px,100px] gap-2 px-4 py-2.5 items-center hover:bg-muted/30 cursor-pointer transition-colors group border-b last:border-b-0"
                        >
                          {/* Task name with labels */}
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium text-foreground truncate">
                              {task.title}
                            </span>
                            <div className="flex items-center gap-0.5 text-xs text-muted-foreground flex-shrink-0">
                              <ListTodo className="w-3.5 h-3.5" />
                              <span>{task.subtask_count || 0}</span>
                            </div>
                            {task.labels && task.labels.length > 0 && (
                              <div className="flex gap-1 flex-shrink-0">
                                {task.labels.slice(0, 2).map((labelId) => {
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
                                {task.labels.length > 2 && (
                                  <span className="text-xs text-muted-foreground">+{task.labels.length - 2}</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Status badge */}
                          <div className="flex items-center gap-2">
                            <span className={cn("w-2 h-2 rounded-full", getStatusColor(task.column_id))} />
                            <span className="text-xs text-muted-foreground">{getStatusInfo(task.column_id).label}</span>
                          </div>

                          {/* Due date */}
                          <div className={cn("flex items-center gap-1 text-xs", getDueDateColor(task.due_date))}>
                            <Calendar className="w-3 h-3" />
                            <span>{task.due_date ? format(parseISO(task.due_date), "MMM d") : "-"}</span>
                          </div>

                          {/* Actions */}
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  data-no-click
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="w-4 h-4" />
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
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}

        {/* Unassigned phase for tasks without a phase */}
        {(() => {
          const unassignedTasks = getTasksByPhase(null);
          const isExpanded = expandedPhases.has("unassigned");
          
          if (unassignedTasks.length === 0) return null;
          
          return (
            <div className="border rounded-lg overflow-hidden bg-card">
              <button
                onClick={() => togglePhase("unassigned")}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
                <Badge variant="secondary" className="text-xs">
                  Unassigned
                </Badge>
                <span className="text-sm text-muted-foreground ml-auto">
                  {unassignedTasks.length}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="border-t">
                      <div className="grid grid-cols-[1fr,120px,100px,100px] gap-2 px-4 py-2 text-xs font-medium text-muted-foreground border-b bg-muted/30">
                        <span>Name</span>
                        <span>Status</span>
                        <span>Due date</span>
                        <span className="text-right">Actions</span>
                      </div>
                      {unassignedTasks.map((task) => (
                        <div
                          key={task.id}
                          onClick={(e) => handleCardClick(task, e)}
                          className="grid grid-cols-[1fr,120px,100px,100px] gap-2 px-4 py-2.5 items-center hover:bg-muted/30 cursor-pointer transition-colors group border-b last:border-b-0"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-sm font-medium text-foreground truncate">
                              {task.title}
                            </span>
                            <div className="flex items-center gap-0.5 text-xs text-muted-foreground flex-shrink-0">
                              <ListTodo className="w-3.5 h-3.5" />
                              <span>{task.subtask_count || 0}</span>
                            </div>
                            {task.labels && task.labels.length > 0 && (
                              <div className="flex gap-1 flex-shrink-0">
                                {task.labels.slice(0, 2).map((labelId) => {
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
                                {task.labels.length > 2 && (
                                  <span className="text-xs text-muted-foreground">+{task.labels.length - 2}</span>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn("w-2 h-2 rounded-full", getStatusColor(task.column_id))} />
                            <span className="text-xs text-muted-foreground">{getStatusInfo(task.column_id).label}</span>
                          </div>
                          <div className={cn("flex items-center gap-1 text-xs", getDueDateColor(task.due_date))}>
                            <Calendar className="w-3 h-3" />
                            <span>{task.due_date ? format(parseISO(task.due_date), "MMM d") : "-"}</span>
                          </div>
                          <div className="flex justify-end">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button 
                                  data-no-click
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreHorizontal className="w-4 h-4" />
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
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })()}

          {/* Empty state for filtered results */}
          {filteredTasks.length === 0 && tasks.length > 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center border rounded-lg bg-muted/30">
              <p className="text-muted-foreground">No tasks found</p>
            </div>
          )}
        </div>
      )}
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