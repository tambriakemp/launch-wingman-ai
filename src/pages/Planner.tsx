import { useState, useCallback, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  addDays,
  subDays,
  format,
  startOfDay,
} from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { PlannerCalendarView } from "@/components/planner/PlannerCalendarView";
import { PlannerListView } from "@/components/planner/PlannerListView";
import { PlannerKanbanView } from "@/components/planner/PlannerKanbanView";
import { PlannerWeekBoardView } from "@/components/planner/PlannerWeekBoardView";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlannerTaskDialog, type PlannerTask } from "@/components/planner/PlannerTaskDialog";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { CalendarDays, Plus, ListTodo, ChevronLeft, ChevronRight, LayoutGrid, Calendar as CalendarIcon, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SpacesSidebar } from "@/components/planner/SpacesSidebar";
import { usePlannerSpaces } from "@/hooks/usePlannerSpaces";
import { useCalendarSync } from "@/hooks/useCalendarSync";
import { useStatusVisibility } from "@/hooks/useStatusVisibility";
import { StatusVisibilitySettings } from "@/components/planner/StatusVisibilitySettings";
import { PageLoader } from "@/components/ui/page-loader";

const Planner = () => {
  const { user } = useAuth();
  const location = useLocation();
  const isTodoMode = location.pathname.endsWith("/tasks");

  const { hasAccess, isLoading: accessLoading } = useFeatureAccess();
  // Sunsama mode: "board" | "month". Tasks mode: list | kanban
  const [sunsamaView, setSunsamaView] = useState<"board" | "month">("board");
  const [tasksView, setTasksView] = useState<"list" | "kanban">("list");
  // Board window: 15 days back from today, 30 days forward (46 columns).
  const [boardStartDate, setBoardStartDate] = useState<Date>(() => startOfDay(subDays(new Date(), 15)));
  const BOARD_DAY_COUNT = 46;
  const [scrollToTodayNonce, setScrollToTodayNonce] = useState(0);
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PlannerTask | null>(null);
  const [defaultDueAt, setDefaultDueAt] = useState<Date | null>(null);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const { syncTask } = useCalendarSync();
  const { visibility, toggle: toggleVisibility, isVisible } = useStatusVisibility();

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

  // Filter tasks by selected space — status visibility ONLY applies in Tasks (To do) mode
  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (selectedSpaceId) {
      result = result.filter(t => (t as any).space_id === selectedSpaceId);
    }
    if (isTodoMode) {
      result = result.filter(t => isVisible(t.column_id === "in_progress" ? "in-progress" : (t.column_id || "todo")));
    }
    return result;
  }, [tasks, selectedSpaceId, isVisible, isTodoMode]);

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

  const handleMoveTask = async (taskId: string, newColumnId: string) => {
    const { error } = await supabase.from("tasks").update({ column_id: newColumnId } as any).eq("id", taskId);
    if (error) { toast.error("Failed to move task"); return; }
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

  const PageIcon = isTodoMode ? ListTodo : CalendarDays;
  const pageTitle = isTodoMode ? "To do" : "Calendar";
  const pageSubtitle = isTodoMode
    ? "All your tasks in one place. Filter by status, space, or category."
    : "Plan your week, schedule your day.";
  const iconBg = isTodoMode
    ? "bg-blue-100/50 dark:bg-blue-900/20"
    : "bg-amber-100/50 dark:bg-amber-900/20";
  const iconColor = isTodoMode
    ? "text-blue-600 dark:text-blue-400"
    : "text-amber-600 dark:text-amber-400";

  if (accessLoading || spacesLoading) {
    return (
      <ProjectLayout>
        <div className="px-4 pt-6 pb-2">
          <div className="flex items-start gap-4 mb-4">
            <div className={`p-3 ${iconBg} rounded-xl shrink-0`}>
              <PageIcon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-foreground">{pageTitle}</h1>
              <p className="text-sm text-muted-foreground hidden sm:block">{pageSubtitle}</p>
            </div>
          </div>
        </div>
        <PageLoader containerClassName="flex items-center justify-center min-h-[50vh]" />
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

  // ===== TASKS (TO DO) MODE =====
  if (isTodoMode) {
    return (
      <ProjectLayout>
        <div className="h-[calc(100vh-3rem-48px)] overflow-hidden flex flex-col -my-4 md:-my-6">
          <div className="px-4 pt-6 pb-2">
            <div className="flex items-start gap-4 mb-4">
              <div className={`p-3 ${iconBg} rounded-xl shrink-0`}>
                <PageIcon className={`w-6 h-6 ${iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-semibold text-foreground">{pageTitle}</h1>
                    <p className="text-sm text-muted-foreground hidden sm:block">{pageSubtitle}</p>
                  </div>
                  <Button size="sm" className="gap-1.5" onClick={handleAddTask}>
                    <Plus className="w-4 h-4" /> Task
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Tabs value={tasksView} onValueChange={(v) => setTasksView(v as "list" | "kanban")}>
                <TabsList>
                  <TabsTrigger value="list">List</TabsTrigger>
                  <TabsTrigger value="kanban">Board</TabsTrigger>
                </TabsList>
              </Tabs>
              <StatusVisibilitySettings visibility={visibility} onToggle={toggleVisibility} />
            </div>
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
              {tasksView === "list" ? (
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
              ) : (
                <PlannerKanbanView
                  tasks={filteredTasks}
                  isLoading={isLoading}
                  onEditTask={handleEditTask}
                  onToggleComplete={handleToggleComplete}
                  onAddTask={handleAddTask}
                  onMoveTask={handleMoveTask}
                  categories={activeCategories}
                  spaces={spaces}
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
  }

  // ===== SUNSAMA-STYLE CALENDAR MODE =====
  const weekStart = startOfWeek(boardWeekDate, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(boardWeekDate, { weekStartsOn: 0 });
  const weekLabel = `${format(weekStart, "MMM d")} – ${format(weekEnd, "MMM d, yyyy")}`;

  return (
    <ProjectLayout>
      <div className="h-[calc(100vh-3rem-48px)] overflow-hidden flex flex-col -my-4 md:-my-6">
        <div className="px-4 pt-6 pb-3 border-b border-border">
          <div className="flex items-start gap-4 mb-3">
            <div className={`p-3 ${iconBg} rounded-xl shrink-0`}>
              <PageIcon className={`w-6 h-6 ${iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <h1 className="text-2xl font-semibold text-foreground">{pageTitle}</h1>
                  <p className="text-sm text-muted-foreground hidden sm:block">{pageSubtitle}</p>
                </div>
                <div className="flex items-center gap-2">
                  {sunsamaView === "board" && (
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setBoardWeekDate(subWeeks(boardWeekDate, 1))}>
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-xs h-8" onClick={() => setBoardWeekDate(new Date())}>
                        Today
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setBoardWeekDate(addWeeks(boardWeekDate, 1))}>
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                      <span className="text-xs text-muted-foreground ml-2 hidden md:inline">{weekLabel}</span>
                    </div>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1.5 h-8">
                        {sunsamaView === "board" ? <LayoutGrid className="w-3.5 h-3.5" /> : <CalendarIcon className="w-3.5 h-3.5" />}
                        {sunsamaView === "board" ? "Board" : "Calendar · Month"}
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <div className="px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Views</div>
                      <DropdownMenuItem onClick={() => setSunsamaView("board")} className="gap-2">
                        <LayoutGrid className="w-4 h-4" />
                        <span className="flex-1">Board</span>
                        {sunsamaView === "board" && <Check className="w-3.5 h-3.5" />}
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setSunsamaView("month")} className="gap-2">
                        <CalendarIcon className="w-4 h-4" />
                        <span className="flex-1">Calendar · Month</span>
                        {sunsamaView === "month" && <Check className="w-3.5 h-3.5" />}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-hidden flex">
          {sunsamaView === "month" ? (
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
              lockedView="month"
              sidebarTopSlot={
                <SpacesSidebar
                  embedded
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
              }
            />
          ) : (
            <>
              <div className="hidden lg:flex flex-col w-[260px] shrink-0 border-r border-border bg-background overflow-y-auto">
                <SpacesSidebar
                  embedded
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
              </div>
              <div className="flex-1 overflow-hidden">
                <PlannerWeekBoardView
                  tasks={filteredTasks}
                  weekStartDate={boardWeekDate}
                  isLoading={isLoading}
                  spaces={spaces}
                  categories={activeCategories}
                  onEditTask={handleEditTask}
                  onCreateTask={handleQuickCreate}
                  onToggleComplete={handleToggleComplete}
                  onTasksChanged={fetchTasks}
                />
              </div>
            </>
          )}
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
