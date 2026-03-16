import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { PlannerCalendarView } from "@/components/planner/PlannerCalendarView";
import { PlannerListView } from "@/components/planner/PlannerListView";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlannerTaskDialog, type PlannerTask } from "@/components/planner/PlannerTaskDialog";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradePrompt } from "@/components/UpgradePrompt";

const Planner = () => {
  const { user } = useAuth();
  const { hasAccess, isLoading: accessLoading } = useFeatureAccess();
  const [view, setView] = useState<"list" | "calendar">("calendar");
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PlannerTask | null>(null);
  const [defaultTaskType, setDefaultTaskType] = useState<"task" | "event">("task");
  const [defaultDueAt, setDefaultDueAt] = useState<Date | null>(null);

  const fetchTasks = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("user_id", user.id)
      .eq("task_scope", "planner")
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) {
      console.error("Error fetching planner tasks:", error);
      toast.error("Failed to load planner tasks");
    } else {
      setTasks((data as unknown as PlannerTask[]) || []);
    }
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleCreateTask = async (data: Partial<PlannerTask>) => {
    if (!user) return;

    let projectId: string | null = null;
    try {
      const stored = localStorage.getItem("lastProjectInfo");
      if (stored) projectId = JSON.parse(stored).id;
    } catch {}

    if (!projectId) {
      const { data: projects } = await supabase
        .from("projects")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);
      projectId = projects?.[0]?.id || null;
    }

    if (!projectId) {
      toast.error("No project found. Create a project first.");
      return;
    }

    const { error } = await supabase.from("tasks").insert({
      project_id: projectId,
      user_id: user.id,
      title: data.title!,
      description: data.description || null,
      column_id: data.column_id || "todo",
      task_origin: "user",
      task_scope: "planner",
      task_type: data.task_type || "task",
      category: data.category || "business",
      due_at: data.due_at || null,
      start_at: data.start_at || null,
      end_at: data.end_at || null,
      location: data.location || null,
      position: 0,
      recurrence_rule: data.recurrence_rule || null,
    } as any);

    if (error) {
      console.error("Error creating planner task:", error);
      toast.error("Failed to create task");
      return;
    }

    toast.success("Task created");
    fetchTasks();
  };

  const handleUpdateTask = async (data: Partial<PlannerTask>) => {
    if (!editingTask) return;

    const { error } = await supabase
      .from("tasks")
      .update({
        title: data.title,
        description: data.description || null,
        column_id: data.column_id || "todo",
        task_type: data.task_type || "task",
        category: data.category || null,
        due_at: data.due_at || null,
        start_at: data.start_at || null,
        end_at: data.end_at || null,
        location: data.location || null,
        recurrence_rule: data.recurrence_rule !== undefined ? data.recurrence_rule : editingTask.recurrence_rule,
      } as any)
      .eq("id", editingTask.id);

    if (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
      return;
    }

    toast.success("Task updated");
    setEditingTask(null);
    fetchTasks();
  };

  const handleToggleComplete = async (task: PlannerTask) => {
    const newStatus = task.column_id === "done" ? "todo" : "done";
    const { error } = await supabase
      .from("tasks")
      .update({ column_id: newStatus } as any)
      .eq("id", task.id);

    if (error) {
      toast.error("Failed to update task");
      return;
    }
    fetchTasks();
  };

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) {
      toast.error("Failed to delete task");
      return;
    }
    toast.success("Task deleted");
    fetchTasks();
  };

  const handleEditTask = (task: PlannerTask) => {
    // If it's a virtual recurrence instance, find the parent task
    if ((task as any)._isVirtualRecurrence) {
      const parentId = (task as any)._parentId;
      const parent = tasks.find(t => t.id === parentId);
      if (parent) {
        setEditingTask(parent);
        setDefaultTaskType(parent.task_type as "task" | "event" || "task");
        setDefaultDueAt(null);
        setDialogOpen(true);
      }
      return;
    }
    setEditingTask(task);
    setDefaultTaskType(task.task_type as "task" | "event" || "task");
    setDefaultDueAt(null);
    setDialogOpen(true);
  };

  const handleQuickCreate = (defaults: { due_at?: string }) => {
    setEditingTask(null);
    setDefaultTaskType("task");
    setDefaultDueAt(defaults.due_at ? new Date(defaults.due_at) : null);
    setDialogOpen(true);
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setDefaultTaskType("task");
    setDefaultDueAt(null);
    setDialogOpen(true);
  };

  if (accessLoading) {
    return (
      <ProjectLayout>
        <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </ProjectLayout>
    );
  }

  if (!hasAccess('social_calendar')) {
    return (
      <ProjectLayout>
        <div className="h-[calc(100vh-3.5rem)] flex items-center justify-center p-8">
          <UpgradePrompt feature="social_calendar" />
        </div>
      </ProjectLayout>
    );
  }

  return (
    <ProjectLayout>
      <div className="h-[calc(100vh-3.5rem)] overflow-hidden flex flex-col">
        <div className="px-4 pt-6 pb-2">
          <div className="flex items-start gap-4 mb-4">
            <div className="p-3 bg-amber-100/50 dark:bg-amber-900/20 rounded-xl shrink-0">
              <CalendarDays className="w-6 h-6 text-amber-600 dark:text-amber-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-semibold text-foreground">Calendar</h1>
                  <p className="text-sm text-muted-foreground hidden sm:block">Plan your schedule, track tasks, and stay on top of your week.</p>
                </div>
              </div>
            </div>
          </div>
          <Tabs value={view} onValueChange={(v) => setView(v as "list" | "calendar")}>
            <TabsList>
              <TabsTrigger value="list">List</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex-1 overflow-hidden">
          {view === "calendar" && (
            <PlannerCalendarView
              tasks={tasks}
              isLoading={isLoading}
              onEditTask={handleEditTask}
              onCreateTask={handleQuickCreate}
              onToggleComplete={handleToggleComplete}
              onDeleteTask={handleDeleteTask}
              onAddTask={handleAddTask}
            />
          )}
          {view === "list" && (
            <PlannerListView
              tasks={tasks}
              isLoading={isLoading}
              onEditTask={handleEditTask}
              onToggleComplete={handleToggleComplete}
              onDeleteTask={handleDeleteTask}
              onAddTask={handleAddTask}
            />
          )}
        </div>
      </div>

      <PlannerTaskDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingTask(null); setDefaultDueAt(null); } }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        editTask={editingTask}
        defaultTaskType={defaultTaskType}
        defaultDueAt={defaultDueAt}
      />
    </ProjectLayout>
  );
};

export default Planner;
