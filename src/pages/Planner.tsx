import { useState, useCallback, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import {
  addDays,
  addMonths,
  subMonths,
  format,
  startOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  getISOWeek,
} from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { toTitleCase, cn } from "@/lib/utils";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { PageContainer } from "@/components/layout/PageContainer";
import { PlannerCalendarView } from "@/components/planner/PlannerCalendarView";
import { PlannerListView } from "@/components/planner/PlannerListView";
import { PlannerKanbanView } from "@/components/planner/PlannerKanbanView";
import { PlannerWeekBoardView } from "@/components/planner/PlannerWeekBoardView";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlannerTaskDialog, type PlannerTask } from "@/components/planner/PlannerTaskDialog";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { Plus, ListTodo, ChevronLeft, ChevronRight, LayoutGrid, Calendar as CalendarIcon, Check, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SpacePicker } from "@/components/planner/SpacePicker";
import { ManageSpacesSheet } from "@/components/planner/ManageSpacesSheet";
import { usePlannerSpaces } from "@/hooks/usePlannerSpaces";
import { useCalendarSync } from "@/hooks/useCalendarSync";
import { useStatusVisibility } from "@/hooks/useStatusVisibility";
import { PageLoader } from "@/components/ui/page-loader";
import { MobilePlanner } from "@/components/planner/mobile/MobilePlanner";
import { MobileAddTaskSheet } from "@/components/planner/mobile/MobileAddTaskSheet";
import { useIsMobile } from "@/hooks/use-mobile";

const Planner = () => {
  const isMobile = useIsMobile();
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
  /**
   * Per-task subtask completion counts. Used by every view to render the
   * % badge next to tasks that have subtasks. Refreshes on every
   * fetchTasks() so the badge updates after the task dialog closes.
   */
  const [subtaskProgress, setSubtaskProgress] = useState<Record<string, { total: number; done: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<PlannerTask | null>(null);
  const [editingOccurrenceDate, setEditingOccurrenceDate] = useState<string | null>(null);
  const [defaultDueAt, setDefaultDueAt] = useState<Date | null>(null);
  // Unified space + category filter (replaces the old multi-source
  // spaceVisibility / categoryVisibility / selectedSpaceId trio). Both
  // persist so the user's filter survives reload and view switches.
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(() => {
    try { return localStorage.getItem("planner_selected_space_id"); } catch { return null; }
  });
  const handleSelectSpace = useCallback((id: string | null) => {
    setSelectedSpaceId(id);
    try {
      if (id) localStorage.setItem("planner_selected_space_id", id);
      else localStorage.removeItem("planner_selected_space_id");
    } catch { /* storage unavailable */ }
  }, []);

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("planner_selected_category_ids");
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });
  const persistCategoryIds = useCallback((next: string[]) => {
    try { localStorage.setItem("planner_selected_category_ids", JSON.stringify(next)); }
    catch { /* storage unavailable */ }
  }, []);
  const handleToggleCategory = useCallback((id: string) => {
    setSelectedCategoryIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      persistCategoryIds(next);
      return next;
    });
  }, [persistCategoryIds]);
  const handleClearCategories = useCallback(() => {
    setSelectedCategoryIds([]);
    persistCategoryIds([]);
  }, [persistCategoryIds]);

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
    // Fetch tasks + subtask completion aggregates in parallel — the badge
    // displayed per task in every view needs the subtask counts, so we
    // hydrate them in the same trip and keep them in sync.
    const [tasksRes, subtasksRes] = await Promise.all([
      supabase
        .from("tasks")
        .select("*")
        .eq("user_id", user.id)
        .eq("task_scope", "planner")
        .order("created_at", { ascending: false })
        .limit(500),
      supabase
        .from("subtasks")
        .select("task_id, completed")
        .eq("user_id", user.id),
    ]);

    if (tasksRes.error) {
      console.error("Error fetching planner tasks:", tasksRes.error);
      toast.error("Failed to load planner tasks");
    } else {
      setTasks((tasksRes.data as unknown as PlannerTask[]) || []);
    }

    if (!subtasksRes.error && subtasksRes.data) {
      const map: Record<string, { total: number; done: number }> = {};
      for (const s of subtasksRes.data as Array<{ task_id: string | null; completed: boolean | null }>) {
        if (!s.task_id) continue;
        if (!map[s.task_id]) map[s.task_id] = { total: 0, done: 0 };
        map[s.task_id].total += 1;
        if (s.completed) map[s.task_id].done += 1;
      }
      setSubtaskProgress(map);
    }

    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Filter tasks by selected space + categories. Status visibility ONLY
  // applies in List view (separate from space/category filtering).
  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (selectedSpaceId) {
      result = result.filter((t) => (t as any).space_id === selectedSpaceId);
      if (selectedCategoryIds.length > 0) {
        result = result.filter((t) => {
          const cid = (t as any).category;
          return cid && selectedCategoryIds.includes(cid);
        });
      }
    }
    if (sunsamaView === "list") {
      result = result.filter((t) =>
        isVisible(t.column_id === "in_progress" ? "in-progress" : (t.column_id || "todo"))
      );
    }
    return result;
  }, [tasks, selectedSpaceId, selectedCategoryIds, isVisible, sunsamaView]);

  // Week board hides abandoned entirely
  const weekBoardTasks = useMemo(
    () => filteredTasks.filter(t => t.column_id !== "abandoned"),
    [filteredTasks]
  );

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

    const { data: inserted, error } = await supabase.from("tasks").insert({
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
    } as any).select("id").single();

    if (error) {
      console.error("Error creating planner task:", error);
      toast.error("Failed to create task");
      return;
    }

    if (!(data as any)._silent) toast.success("Task created");
    if (inserted?.id) {
      syncTask(inserted.id, "create");
    }
    fetchTasks();
    return inserted?.id as string | undefined;
  };

  const handleUpdateTask = async (data: Partial<PlannerTask>) => {
    if (!editingTask) return;

    let finalStartAt = data.start_at !== undefined ? (data.start_at || null) : null;
    let finalEndAt = data.end_at !== undefined ? (data.end_at || null) : null;
    if (finalEndAt && !finalStartAt) {
      finalEndAt = null;
    }

    const scope = (data as any)._scope as "single" | "series" | undefined;
    const isRecurring = !!editingTask.recurrence_rule;

    // Recurring + "single" → materialize new standalone task for that occurrence + add exception
    if (isRecurring && scope === "single" && user) {
      const occurrenceDate =
        editingOccurrenceDate ||
        (editingTask.due_at ? editingTask.due_at.slice(0, 10) : null) ||
        (editingTask.start_at ? editingTask.start_at.slice(0, 10) : null);
      if (!occurrenceDate) {
        toast.error("Could not determine occurrence date");
        return;
      }

      const { error: insertErr } = await supabase.from("tasks").insert({
        project_id: editingTask.project_id,
        user_id: user.id,
        title: data.title,
        description: data.description || null,
        column_id: data.column_id || "todo",
        task_origin: editingTask.task_origin || "user",
        task_scope: editingTask.task_scope || "planner",
        task_type: data.task_type || "task",
        category: data.category || null,
        priority: (data as any).priority || "normal",
        due_at: data.due_at !== undefined ? (data.due_at || null) : null,
        start_at: finalStartAt,
        end_at: finalEndAt,
        location: data.location || null,
        position: 0,
        recurrence_rule: null,
        recurrence_parent_id: editingTask.id,
        space_id: (data as any).space_id !== undefined ? (data as any).space_id : (editingTask as any).space_id,
      } as any);

      if (insertErr) {
        console.error(insertErr);
        toast.error("Failed to save occurrence");
        return;
      }

      const existing = editingTask.recurrence_exception_dates || [];
      if (!existing.includes(occurrenceDate)) {
        await supabase
          .from("tasks")
          .update({ recurrence_exception_dates: [...existing, occurrenceDate] } as any)
          .eq("id", editingTask.id);
      }

      toast.success("Occurrence updated");
      setEditingTask(null);
      setEditingOccurrenceDate(null);
      fetchTasks();
      return;
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

    toast.success(isRecurring ? "Series updated" : "Task updated");
    syncTask(editingTask.id, "update");
    setEditingTask(null);
    setEditingOccurrenceDate(null);
    fetchTasks();
  };

  const handleToggleComplete = async (task: PlannerTask) => {
    // Recurring virtual instance: materialize a real "done" occurrence for that single date.
    if ((task as any)._isVirtualRecurrence) {
      const parentId = (task as any)._parentId as string;
      const occurrenceDate = (task as any)._occurrenceDate as string; // YYYY-MM-DD
      const parent = tasks.find(t => t.id === parentId);
      if (!parent || !user) return;

      const { error: insertErr } = await supabase.from("tasks").insert({
        project_id: parent.project_id,
        user_id: user.id,
        title: parent.title,
        description: parent.description || null,
        column_id: "done",
        task_origin: parent.task_origin || "user",
        task_scope: parent.task_scope || "planner",
        task_type: parent.task_type || "task",
        category: parent.category || null,
        priority: (parent as any).priority || "normal",
        due_at: task.due_at,
        start_at: task.start_at,
        end_at: task.end_at,
        location: parent.location || null,
        position: 0,
        recurrence_rule: null,
        recurrence_parent_id: parentId,
        space_id: (parent as any).space_id || null,
      } as any);

      if (insertErr) {
        console.error(insertErr);
        toast.error("Failed to complete occurrence");
        return;
      }

      const existingExceptions = parent.recurrence_exception_dates || [];
      if (!existingExceptions.includes(occurrenceDate)) {
        const { error: updErr } = await supabase
          .from("tasks")
          .update({ recurrence_exception_dates: [...existingExceptions, occurrenceDate] } as any)
          .eq("id", parentId);
        if (updErr) {
          console.error(updErr);
        }
      }
      fetchTasks();
      return;
    }

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
        setEditingOccurrenceDate((task as any)._occurrenceDate || null);
        setDefaultDueAt(null);
        setDialogOpen(true);
      }
      return;
    }
    setEditingTask(task);
    setEditingOccurrenceDate(null);
    setDefaultDueAt(null);
    setDialogOpen(true);
  };

  const handleQuickCreate = (defaults: { due_at?: string }) => {
    setEditingTask(null);
    setDefaultDueAt(defaults.due_at ? new Date(defaults.due_at) : null);
    setDialogOpen(true);
  };

  const [mobileAddOpen, setMobileAddOpen] = useState(false);
  const [manageSpacesOpen, setManageSpacesOpen] = useState(false);

  const handleAddTask = () => {
    setEditingTask(null);
    setDefaultDueAt(null);
    setDialogOpen(true);
  };

  if (accessLoading || spacesLoading) {
    // No legacy icon+title header here — render only the loader on the
    // canonical paper canvas so we don't flash a different layout before
    // the editorial header renders below.
    return (
      <ProjectLayout>
        <div className="h-[calc(100vh-3rem-48px)] bg-[hsl(var(--paper-100))]">
          <PageLoader containerClassName="flex items-center justify-center min-h-[50vh]" />
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

  const selectedSpace = spaces.find((s) => s.id === selectedSpaceId) || null;

  // ===== Editorial calendar header =====
  const handleTodayClick = () => {
    setAnchorDate(startOfDay(new Date()));
    setScrollNonce((n) => n + 1);
  };
  // Navigation step adapts to the active view: week board scrolls by a
  // week at a time, month + list step by a full month so the header
  // label and content stay in sync.
  const shiftView = (direction: -1 | 1) => {
    setAnchorDate((prev) =>
      sunsamaView === "board"
        ? startOfDay(addDays(prev, direction * 7))
        : startOfDay(
            direction === 1 ? addMonths(prev, 1) : subMonths(prev, 1),
          ),
    );
    setScrollNonce((n) => n + 1);
  };

  const weekStart = startOfWeek(anchorDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(anchorDate, { weekStartsOn: 1 });
  const weekNumber = getISOWeek(anchorDate);
  const monthLabel = format(anchorDate, "MMMM yyyy");
  // 61-day window centered on anchorDate (30 back, today, 30 forward) —
  // used only by the week-board view; month + list use the full month.
  const weekDays = Array.from({ length: 61 }, (_, i) => addDays(startOfDay(anchorDate), i - 30));
  const weekRangeLabel =
    format(weekStart, "MMM") === format(weekEnd, "MMM")
      ? `${format(weekStart, "MMM d")} — ${format(weekEnd, "d")}`
      : `${format(weekStart, "MMM d")} — ${format(weekEnd, "MMM d")}`;

  // Title + eyebrow adapt per view: week shows the date range with an
  // ISO-week eyebrow; month + list show just "Month YYYY" with the
  // calendar/year as the eyebrow.
  const isMonthOrList = sunsamaView === "month" || sunsamaView === "list";
  const headerTitleText = isMonthOrList ? format(anchorDate, "MMMM yyyy") : weekRangeLabel;
  const headerEyebrowText = isMonthOrList
    ? format(anchorDate, "yyyy")
    : `Week ${weekNumber} · ${monthLabel}`;

  if (isMobile) {
    const mobileEditing = dialogOpen ? editingTask : null;
    return (
      <>
        <MobilePlanner
          tasks={tasks}
          spaces={spaces}
          categories={categories}
          selectedSpaceId={selectedSpaceId}
          selectedCategoryIds={selectedCategoryIds}
          onSelectSpace={handleSelectSpace}
          onToggleCategory={handleToggleCategory}
          onClearCategories={handleClearCategories}
          onEditTask={handleEditTask}
          onToggleComplete={handleToggleComplete}
          onDeleteTask={handleDeleteTask}
          onAddTask={() => { setEditingTask(null); setDefaultDueAt(null); setMobileAddOpen(true); }}
          onManageSpaces={() => setManageSpacesOpen(true)}
        />
        <MobileAddTaskSheet
          open={mobileAddOpen || (!!mobileEditing)}
          onClose={() => {
            setMobileAddOpen(false);
            setDialogOpen(false);
            setEditingTask(null);
            setDefaultDueAt(null);
          }}
          onCreate={handleCreateTask}
          onUpdate={async (id, d) => {
            const dueIso = d.due_at !== undefined ? (d.due_at || null) : undefined;
            const startIso = d.start_at !== undefined ? (d.start_at || null) : undefined;
            const endIso = d.end_at !== undefined ? (d.end_at || null) : undefined;
            const payload: any = {};
            if (d.title !== undefined) payload.title = d.title;
            if (d.description !== undefined) payload.description = d.description || null;
            if (d.column_id !== undefined) payload.column_id = d.column_id;
            if (d.task_type !== undefined) payload.task_type = d.task_type;
            if (d.category !== undefined) payload.category = d.category || null;
            if ((d as any).priority !== undefined) payload.priority = (d as any).priority;
            if (dueIso !== undefined) payload.due_at = dueIso;
            if (startIso !== undefined) payload.start_at = startIso;
            if (endIso !== undefined) payload.end_at = endIso;
            if (d.location !== undefined) payload.location = d.location || null;
            if ((d as any).space_id !== undefined) payload.space_id = (d as any).space_id;
            const { error } = await supabase.from("tasks").update(payload).eq("id", id);
            if (error) { toast.error("Failed to save"); return; }
            syncTask(id, "update");
            fetchTasks();
          }}
          onDelete={handleDeleteTask}
          spaces={spaces}
          categories={categories}
          selectedSpaceId={selectedSpaceId}
          onCreateCategory={createCategory}
          onCreateSpace={createSpace}
          editTask={mobileEditing}
        />

        <ManageSpacesSheet
          open={manageSpacesOpen}
          onOpenChange={setManageSpacesOpen}
          spaces={spaces}
          taskCountsBySpace={tasks.reduce<Record<string, number>>((acc, t) => {
            const sid = (t as any).space_id;
            if (sid) acc[sid] = (acc[sid] ?? 0) + 1;
            return acc;
          }, {})}
          onCreateSpace={createSpace}
          onUpdateSpace={async (id, updates) => {
            await updateSpace(id, updates);
          }}
          onDeleteSpace={async (id) => {
            await deleteSpace(id);
            if (selectedSpaceId === id) {
              handleSelectSpace(null);
            }
          }}
        />
      </>
    );
  }

  return (
    <ProjectLayout>
      <div className="h-[calc(100vh-3rem-48px)] overflow-hidden flex flex-col bg-[hsl(var(--paper-100))] mx-auto w-full" style={{ maxWidth: 1600, paddingLeft: 24, paddingRight: 24 }}>
        <div style={{ paddingTop: 36 }}>
          <div className="flex items-end justify-between gap-3 md:gap-6 pb-7 border-b border-[hsl(var(--border-hairline))]">
            {/* Editorial title block — matches Goals + Habits page rhythm */}
            <div className="min-w-0 flex-shrink">

              <div
                className="font-semibold uppercase"
                style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  color: "hsl(var(--terracotta-500))",
                }}
              >
                {headerEyebrowText}
              </div>
              <h1 className="font-serif italic font-normal text-2xl sm:text-3xl md:text-5xl leading-[1.15] tracking-tight text-foreground m-0 mt-1.5 pr-2 pb-1 overflow-visible whitespace-nowrap">
                {headerTitleText}
              </h1>
            </div>

            {/* Right cluster: space picker, prev/today/next pill, view toggle, action */}
            <div className="flex items-center gap-2 md:gap-3 flex-wrap justify-end shrink-0">
              <SpacePicker
                spaces={spaces}
                categories={categories}
                tasks={tasks as any}
                selectedSpaceId={selectedSpaceId}
                selectedCategoryIds={selectedCategoryIds}
                onSelectSpace={handleSelectSpace}
                onToggleCategory={handleToggleCategory}
                onClearCategories={handleClearCategories}
                onManageSpaces={() => setManageSpacesOpen(true)}
              />
              {/* Date nav pill — week steps in week view, month steps in month/list */}
              <div className="inline-flex items-center bg-card border border-border rounded-full p-0.5">
                <button
                  type="button"
                  onClick={() => shiftView(-1)}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-full text-foreground/70 hover:bg-muted transition-colors"
                  aria-label={isMonthOrList ? "Previous month" : "Previous week"}
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
                  onClick={() => shiftView(1)}
                  className="w-8 h-8 inline-flex items-center justify-center rounded-full text-foreground/70 hover:bg-muted transition-colors"
                  aria-label={isMonthOrList ? "Next month" : "Next week"}
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


              {/* Status visibility now lives inside PlannerListView's Layout
                  options popover (the gear icon at the right of the list
                  header row), so the toolbar no longer needs its own
                  status filter. */}

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
              hideSidebar
              controlledDate={anchorDate}
              subtaskProgress={subtaskProgress}
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
                subtaskProgress={subtaskProgress}
                statusVisibility={visibility}
                onToggleStatus={toggleVisibility}
              />
            </div>
          ) : (
            <div className="flex-1 min-w-0 overflow-hidden">
              <PlannerWeekBoardView
                tasks={weekBoardTasks}
                days={weekDays}
                anchorDate={anchorDate}
                scrollToAnchorNonce={scrollNonce}
                isLoading={isLoading}
                spaces={spaces}
                categories={activeCategories}
                onEditTask={handleEditTask}
                onCreateTask={handleQuickCreate}
                onToggleComplete={handleToggleComplete}
                onTasksChanged={fetchTasks}
                subtaskProgress={subtaskProgress}
              />
            </div>
          )}
        </div>
      </div>

      <PlannerTaskDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) { setEditingTask(null); setEditingOccurrenceDate(null); setDefaultDueAt(null); } }}
        onSubmit={async (d) => { if (editingTask) { await handleUpdateTask(d); } else { return await handleCreateTask(d); } }}
        editTask={editingTask}
        editingOccurrenceDate={editingOccurrenceDate}
        defaultDueAt={defaultDueAt}
        spaces={spaces}
        categories={activeCategories}
        allCategories={categories}
        selectedSpaceId={selectedSpaceId}
        onCreateCategory={createCategory}
      />

      <ManageSpacesSheet
        open={manageSpacesOpen}
        onOpenChange={setManageSpacesOpen}
        spaces={spaces}
        taskCountsBySpace={tasks.reduce<Record<string, number>>((acc, t) => {
          const sid = (t as any).space_id;
          if (sid) acc[sid] = (acc[sid] ?? 0) + 1;
          return acc;
        }, {})}
        onCreateSpace={createSpace}
        onUpdateSpace={async (id, updates) => {
          await updateSpace(id, updates);
        }}
        onDeleteSpace={async (id) => {
          await deleteSpace(id);
          // If the deleted space was selected, clear the filter.
          if (selectedSpaceId === id) {
            handleSelectSpace(null);
          }
        }}
      />
    </ProjectLayout>
  );
};

export default Planner;
