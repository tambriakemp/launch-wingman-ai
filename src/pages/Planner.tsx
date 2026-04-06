import { useState, useCallback, useEffect, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { PlannerCalendarView } from "@/components/planner/PlannerCalendarView";
import { PlannerListView } from "@/components/planner/PlannerListView";
import { PlannerKanbanView } from "@/components/planner/PlannerKanbanView";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlannerTaskDialog, type PlannerTask } from "@/components/planner/PlannerTaskDialog";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { CalendarDays, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpacesSidebar } from "@/components/planner/SpacesSidebar";
import { usePlannerSpaces } from "@/hooks/usePlannerSpaces";
import { useCalendarSync } from "@/hooks/useCalendarSync";

const Planner = () => {
  const { user } = useAuth();
  const { hasAccess, isLoading: accessLoading } = useFeatureAccess();
  const [view, setView] = useState<"list" | "calendar">("calendar");
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PlannerTask | null>(null);
  const [defaultDueAt, setDefaultDueAt] = useState<Date | null>(null);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const { syncTask } = useCalendarSync();

  const {
    spaces,
    categories,
    isLoading: spacesLoading,
    createSpace,
    updateSpace,
    deleteSpace,
    createCategory,
    deleteCategory,
    getCategoriesForSpace,
  } = usePlannerSpaces();

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

  // Filter tasks by selected space
  const filteredTasks = useMemo(() => {
    if (!selectedSpaceId) return tasks;
    return tasks.filter(t => (t as any).space_id === selectedSpaceId);
  }, [tasks, selectedSpaceId]);

  // Get categories for the current context
  const activeCategories = useMemo(() => {
    return getCategoriesForSpace(selectedSpaceId);
  }, [selectedSpaceId, categories, getCategoriesForSpace]);

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
      category: data.category || null,
      priority: (data as any).priority || "normal",
      due_at: data.due_at || null,
      start_at: data.start_at || null,
      end_at: data.end_at || null,
      location: data.location || null,
      position: 0,
      recurrence_rule: data.recurrence_rule || null,
      space_id: (data as any).space_id || selectedSpaceId || null,
    } as any);

    if (error) {
      console.error("Error creating planner task:", error);
      toast.error("Failed to create task");
      return;
    }

    toast.success("Task created");
    // Fetch tasks first to get the new task ID, then sync
    const { data: latestTasks } = await supabase
      .from("tasks")
      .select("id")
      .eq("user_id", user.id)
      .eq("task_scope", "planner")
      .order("created_at", { ascending: false })
      .limit(1);
    if (latestTasks?.[0]?.id) {
      syncTask(latestTasks[0].id, "create");
    }
    fetchTasks();
  };

  const handleUpdateTask = async (data: Partial<PlannerTask>) => {
    if (!editingTask) return;

    // Defensive normalization: end_at cannot exist without start_at
    let finalStartAt = data.start_at !== undefined ? (data.start_at || null) : null;
    let finalEndAt = data.end_at !== undefined ? (data.end_at || null) : null;
    if (finalEndAt && !finalStartAt) {
      finalEndAt = null;
    }

    const { error } = await supabase
      .from("tasks")
      .update({
        title: data.title,
        description: data.description || null,
        column_id: data.column_id || "todo",
        task_type: data.task_type || "task",
        category: data.category || null,
        priority: (data as any).priority || "normal",
        due_at: data.due_at !== undefined ? (data.due_at || null) : null,
        start_at: finalStartAt,
        end_at: finalEndAt,
        location: data.location || null,
        recurrence_rule: data.recurrence_rule !== undefined ? data.recurrence_rule : editingTask.recurrence_rule,
        space_id: (data as any).space_id !== undefined ? (data as any).space_id : (editingTask as any).space_id,
      } as any)
      .eq("id", editingTask.id);

    if (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
      return;
    }

    toast.success("Task updated");
    syncTask(editingTask.id, "update");
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
    syncTask(task.id, "update");
    fetchTasks();
  };

  const handleDeleteTask = async (taskId: string) => {
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) {
      toast.error("Failed to delete task");
      return;
    }
    syncTask(taskId, "delete");
    toast.success("Task deleted");
    fetchTasks();
  };

  const handleBulkDelete = async (ids: string[]) => {
    const { error } = await supabase.from("tasks").delete().in("id", ids);
    if (error) { toast.error("Failed to delete tasks"); return; }
    toast.success(`${ids.length} task(s) deleted`);
    fetchTasks();
  };

  const handleBulkMoveSpace = async (ids: string[], spaceId: string) => {
    const { error } = await supabase.from("tasks").update({ space_id: spaceId } as any).in("id", ids);
    if (error) { toast.error("Failed to move tasks"); return; }
    toast.success(`${ids.length} task(s) moved`);
    fetchTasks();
  };

  const handleBulkUpdateCategory = async (ids: string[], categoryId: string) => {
    const { error } = await supabase.from("tasks").update({ category: categoryId } as any).in("id", ids);
    if (error) { toast.error("Failed to update category"); return; }
    toast.success(`Category updated for ${ids.length} task(s)`);
    fetchTasks();
  };

  const handleBulkUpdateStatus = async (ids: string[], status: string) => {
    const { error } = await supabase.from("tasks").update({ column_id: status } as any).in("id", ids);
    if (error) { toast.error("Failed to update status"); return; }
    toast.success(`Status updated for ${ids.length} task(s)`);
    fetchTasks();
  };

  const handleEditTask = (task: PlannerTask) => {
    if ((task as any)._isVirtualRecurrence) {
      const parentId = (task as any)._parentId;
      const parent = tasks.find(t => t.id === parentId);
      if (parent) {
        setEditingTask(parent);
        setDefaultDueAt(null);
        setDialogOpen(true);
      }
      return;
    }
    setEditingTask(task);
    setDefaultDueAt(null);
    setDialogOpen(true);
  };

  const handleQuickCreate = (defaults: { due_at?: string }) => {
    setEditingTask(null);
    setDefaultDueAt(defaults.due_at ? new Date(defaults.due_at) : null);
    setDialogOpen(true);
  };

  const handleAddTask = () => {
    setEditingTask(null);
    setDefaultDueAt(null);
    setDialogOpen(true);
  };

  if (accessLoading || spacesLoading) {
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
      <div className="h-[calc(100vh-3rem-48px)] overflow-hidden flex flex-col -my-4 md:-my-6">
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
                {view === "list" && (
                  <Button size="sm" className="gap-1.5" onClick={handleAddTask}>
                    <Plus className="w-4 h-4" /> Task
                  </Button>
                )}
              </div>
            </div>
          </div>
          <Tabs value={view} onValueChange={(v) => setView(v as "list" | "calendar")}>
            <TabsList>
              <TabsTrigger value="list">Tasks</TabsTrigger>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex-1 overflow-hidden flex">
          <SpacesSidebar
            spaces={spaces}
            categories={categories}
            tasks={tasks}
            selectedSpaceId={selectedSpaceId}
            onSelectSpace={setSelectedSpaceId}
            onCreateSpace={createSpace}
            onUpdateSpace={updateSpace}
            onDeleteSpace={deleteSpace}
            onCreateCategory={createCategory}
            onDeleteCategory={deleteCategory}
          />
          <div className="flex-1 overflow-hidden">
            {view === "calendar" && (
              <PlannerCalendarView
                tasks={filteredTasks}
                isLoading={isLoading}
                onEditTask={handleEditTask}
                onCreateTask={handleQuickCreate}
                onToggleComplete={handleToggleComplete}
                onDeleteTask={handleDeleteTask}
                onAddTask={handleAddTask}
                categories={activeCategories}
                spaces={spaces}
                allTasks={tasks}
              />
            )}
            {view === "list" && (
              <PlannerListView
                tasks={filteredTasks}
                isLoading={isLoading}
                onEditTask={handleEditTask}
                onToggleComplete={handleToggleComplete}
                onDeleteTask={handleDeleteTask}
                onAddTask={handleAddTask}
                categories={activeCategories}
                spaces={spaces}
                onBulkMoveSpace={handleBulkMoveSpace}
                onBulkDelete={handleBulkDelete}
                onBulkUpdateCategory={handleBulkUpdateCategory}
                onBulkUpdateStatus={handleBulkUpdateStatus}
                onCreateCategory={createCategory}
                selectedSpaceId={selectedSpaceId}
                allCategories={categories}
                onUpdateSpace={updateSpace}
              />
            )}
          </div>
        </div>
      </div>

      <PlannerTaskDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingTask(null); setDefaultDueAt(null); } }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        editTask={editingTask}
        defaultDueAt={defaultDueAt}
        spaces={spaces}
        categories={activeCategories}
        allCategories={categories}
        selectedSpaceId={selectedSpaceId}
        onCreateCategory={createCategory}
      />
    </ProjectLayout>
  );
};

export default Planner;
