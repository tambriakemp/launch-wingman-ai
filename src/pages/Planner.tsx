import { useState, useCallback, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  addDays,
  
  format,
  startOfDay,
  startOfWeek,
  endOfWeek,
  getISOWeek,
} from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { toTitleCase, cn } from "@/lib/utils";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { PlannerCalendarView } from "@/components/planner/PlannerCalendarView";
import { PlannerListView } from "@/components/planner/PlannerListView";
import { PlannerKanbanView } from "@/components/planner/PlannerKanbanView";
import { PlannerWeekBoardView } from "@/components/planner/PlannerWeekBoardView";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlannerTaskDialog, type PlannerTask } from "@/components/planner/PlannerTaskDialog";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { CalendarDays, Plus, ListTodo, ChevronLeft, ChevronRight, LayoutGrid, Calendar as CalendarIcon, Check, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SpacesSidebar } from "@/components/planner/SpacesSidebar";
import { SpacesFilterDropdown } from "@/components/planner/SpacesFilterDropdown";
import { PlannerWeekRail } from "@/components/planner/PlannerWeekRail";
import { usePlannerSpaces } from "@/hooks/usePlannerSpaces";
import { useCalendarSync } from "@/hooks/useCalendarSync";
import { useStatusVisibility } from "@/hooks/useStatusVisibility";
import { StatusVisibilitySettings } from "@/components/planner/StatusVisibilitySettings";
import { PageLoader } from "@/components/ui/page-loader";

const Planner = () => {
  const { user } = useAuth();
  const location = useLocation();
  // Both /planner and /planner/tasks land here. Default the legacy /planner/tasks URL into List view.
  const isTodoUrl = location.pathname.endsWith("/tasks");

  const { hasAccess, isLoading: accessLoading } = useFeatureAccess();
  // Unified calendar views: "board" | "month" | "list"
  const [sunsamaView, setSunsamaView] = useState<"board" | "month" | "list">(isTodoUrl ? "list" : "board");
  // Anchor date for the visible week — shifts in 7-day increments via prev/next.
  const [anchorDate, setAnchorDate] = useState<Date>(() => startOfDay(new Date()));
  const [scrollNonce, setScrollNonce] = useState(0);
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PlannerTask | null>(null);
  const [defaultDueAt, setDefaultDueAt] = useState<Date | null>(null);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const { syncTask, hasConnections } = useCalendarSync();
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

  // Filter tasks by selected space — status visibility ONLY applies in List view
  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (selectedSpaceId) {
      result = result.filter(t => (t as any).space_id === selectedSpaceId);
    }
    if (sunsamaView === "list") {
      result = result.filter(t => isVisible(t.column_id === "in_progress" ? "in-progress" : (t.column_id || "todo")));
    }
    return result;
  }, [tasks, selectedSpaceId, isVisible, sunsamaView]);

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
      title: toTitleCase(data.title!),
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

  const PageIcon = CalendarDays;
  const pageTitle = "Calendar";
  const pageSubtitle = "Plan your week, schedule your day.";
  const iconBg = "bg-amber-100/50 dark:bg-amber-900/20";
  const iconColor = "text-amber-600 dark:text-amber-400";

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

  const selectedSpace = spaces.find((s) => s.id === selectedSpaceId) || null;

  // ===== Editorial calendar header =====
  const handleTodayClick = () => setAnchorDate(startOfDay(new Date()));
  const shiftWeek = (deltaDays: number) =>
    setAnchorDate((prev) => startOfDay(addDays(prev, deltaDays)));

  const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(anchorDate, { weekStartsOn: 1 });
  const weekNumber = getISOWeek(anchorDate);
  const monthLabel = format(anchorDate, "MMMM yyyy");
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const rangeLabel =
    format(weekStart, "MMM") === format(weekEnd, "MMM")
      ? `${format(weekStart, "MMM d")} — ${format(weekEnd, "d")}`
      : `${format(weekStart, "MMM d")} — ${format(weekEnd, "MMM d")}`;

  return (
    <ProjectLayout>
      <div className="h-[calc(100vh-3rem-48px)] overflow-hidden flex flex-col -my-4 md:-my-6 bg-[hsl(var(--paper-200))]">
        {/* Top breadcrumb + sync strip */}
        <div className="flex items-center gap-3.5 px-6 md:px-8 py-3.5 border-b border-[hsl(var(--border-hairline))] bg-[hsl(var(--paper-100))]">
          <div className="flex items-center gap-2 text-[13px] text-muted-foreground">
            <span className="text-foreground/70 font-medium">Planner</span>
            <span>/</span>
            <span className="text-foreground font-semibold">Calendar</span>
          </div>
          <div className="flex-1" />
          {hasConnections && (
            <div
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11.5px] font-semibold tracking-wide"
              style={{ background: "rgba(126,144,110,0.12)", color: "#475838" }}
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: "#7E906E" }} />
              Synced with Google Calendar
            </div>
          )}
        </div>

        <div className="px-6 md:px-8 pt-7 pb-6 border-b border-[hsl(var(--border-hairline))] bg-[hsl(var(--paper-100))]">
          <div className="flex items-end justify-between gap-6 flex-wrap">
            {/* Editorial title block */}
            <div className="min-w-0">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-2.5">
                Week {weekNumber} · {monthLabel.toUpperCase()}
              </div>
              <h1 className="font-serif italic font-normal text-4xl md:text-5xl leading-[1.02] tracking-tight text-foreground m-0">
                {rangeLabel}
              </h1>
            </div>

            {/* Right cluster: prev/today/next pill, view toggle, action */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* Date nav pill */}
              <div className="inline-flex items-center bg-card border border-border rounded-full p-0.5">
                <button
                  type="button"
                  onClick={() => shiftWeek(-7)}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-full text-foreground/70 hover:bg-muted transition-colors"
                  aria-label="Previous week"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleTodayClick}
                  className="px-3.5 h-7 rounded-full text-[12px] font-semibold text-foreground hover:bg-muted transition-colors"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => shiftWeek(7)}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-full text-foreground/70 hover:bg-muted transition-colors"
                  aria-label="Next week"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Segmented Week / Month / List toggle */}
              <div className="inline-flex items-center bg-muted/60 border border-border rounded-full p-[3px]">
                {([
                  { key: "board", label: "Week" },
                  { key: "month", label: "Month" },
                  { key: "list", label: "List" },
                ] as const).map((opt) => {
                  const isActive = sunsamaView === opt.key;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      onClick={() => setSunsamaView(opt.key)}
                      className={cn(
                        "px-3.5 py-1.5 rounded-full text-[12px] font-semibold tracking-tight transition-colors",
                        isActive
                          ? "bg-background text-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>

              {/* Spaces filter (compact) */}
              <SpacesFilterDropdown
                spaces={spaces}
                selectedSpaceId={selectedSpaceId}
                onSelectSpace={setSelectedSpaceId}
                onCreateSpace={createSpace}
              />

              {sunsamaView === "list" && (
                <StatusVisibilitySettings visibility={visibility} onToggle={toggleVisibility} />
              )}

              {/* Primary action — terracotta-like rounded pill */}
              <Button
                size="sm"
                className="gap-1.5 h-8 rounded-full px-4 text-[12.5px] font-semibold shadow-sm"
                onClick={handleAddTask}
              >
                <Plus className="w-3.5 h-3.5" /> New task
              </Button>
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
          ) : sunsamaView === "list" ? (
            <div className="flex-1 overflow-hidden">
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
            </div>
          ) : (
            <div className="flex-1 overflow-hidden flex">
              <div className="flex-1 min-w-0 overflow-y-auto">
                <PlannerWeekBoardView
                  tasks={filteredTasks}
                  days={weekDays}
                  isLoading={isLoading}
                  spaces={spaces}
                  categories={activeCategories}
                  onEditTask={handleEditTask}
                  onCreateTask={handleQuickCreate}
                  onToggleComplete={handleToggleComplete}
                  onTasksChanged={fetchTasks}
                />
              </div>
              <PlannerWeekRail
                tasks={filteredTasks}
                weekStart={weekStart}
                weekEnd={weekEnd}
                spaces={spaces}
                categories={activeCategories}
              />
            </div>
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
