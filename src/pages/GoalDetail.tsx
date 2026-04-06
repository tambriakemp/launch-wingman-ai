import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Button } from "@/components/ui/button";

import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import { AddTargetPanel } from "@/components/goals/AddTargetPanel";
import { UpdateTargetPanel } from "@/components/goals/UpdateTargetPanel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Target,
  CalendarDays,
  Plus,
  CheckCircle2,
  Circle,
  TrendingUp,
  DollarSign,
  ToggleLeft,
  ListChecks,
  Hash,
  ChevronRight,
  ChevronDown,
  Folder,
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
  X,
  FolderInput,
  FolderMinus,
  Archive,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parseISO, differenceInDays } from "date-fns";
import type { Goal, GoalTarget, GoalTargetUpdate } from "@/pages/Goals";

const TYPE_ICONS: Record<string, React.ElementType> = {
  number: Hash,
  currency: DollarSign,
  true_false: ToggleLeft,
  tasks: ListChecks,
};

interface TaskInfo {
  id: string;
  title: string;
  column_id: string;
  space_id: string | null;
}

interface TaskProgress {
  total: number;
  done: number;
  spaceNames: string[];
  individualTasks: TaskInfo[];
  spaceTasks: Record<string, TaskInfo[]>;
}


const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$", EUR: "€", GBP: "£", JPY: "¥", CAD: "CA$", AUD: "A$",
  CHF: "CHF", CNY: "¥", INR: "₹", MXN: "MX$", BRL: "R$", KRW: "₩",
  SGD: "S$", HKD: "HK$", NOK: "kr", SEK: "kr", DKK: "kr", NZD: "NZ$",
  ZAR: "R", RUB: "₽", TRY: "₺", AED: "د.إ", SAR: "﷼", PLN: "zł",
  THB: "฿", IDR: "Rp", PHP: "₱", COP: "COL$", NGN: "₦", EGP: "E£",
};

function getCurrencySymbol(unit: string | null): string {
  if (!unit) return "$";
  return CURRENCY_SYMBOLS[unit] || unit;
}

interface GoalFolder {
  id: string;
  name: string;
}

interface AllFolder {
  id: string;
  name: string;
}

const GoalDetail = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [goal, setGoal] = useState<Goal | null>(null);
  const [targets, setTargets] = useState<GoalTarget[]>([]);
  const [updates, setUpdates] = useState<GoalTargetUpdate[]>([]);
  const [folder, setFolder] = useState<GoalFolder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [allFolders, setAllFolders] = useState<AllFolder[]>([]);
  const [taskProgressMap, setTaskProgressMap] = useState<Record<string, TaskProgress>>({});

  const [expandedTargets, setExpandedTargets] = useState<Set<string>>(new Set());
  const [updatePanelTarget, setUpdatePanelTarget] = useState<GoalTarget | null>(null);

  const [showAddTarget, setShowAddTarget] = useState(false);

  // Description editing
  const [descriptionValue, setDescriptionValue] = useState("");
  const [isEditingDescription, setIsEditingDescription] = useState(false);

  const fetchGoal = useCallback(async () => {
    if (!user || !goalId) return;
    const { data } = await supabase
      .from("goals" as any)
      .select("*")
      .eq("id", goalId)
      .eq("user_id", user.id)
      .single();
    const g = (data as unknown as Goal) || null;
    setGoal(g);
    if (g) setDescriptionValue(g.description || "");
    // Fetch folder if goal has folder_id
    if (g && (g as any).folder_id) {
      const { data: folderData } = await supabase
        .from("goal_folders" as any)
        .select("id, name")
        .eq("id", (g as any).folder_id)
        .single();
      setFolder((folderData as unknown as GoalFolder) || null);
    } else {
      setFolder(null);
    }
  }, [user, goalId]);

  const fetchTargets = useCallback(async () => {
    if (!user || !goalId) return;
    const { data } = await supabase
      .from("goal_targets" as any)
      .select("*")
      .eq("goal_id", goalId)
      .eq("user_id", user.id)
      .order("position", { ascending: true });
    setTargets((data as unknown as GoalTarget[]) || []);
  }, [user, goalId]);

  const fetchUpdates = useCallback(async () => {
    if (!user || !goalId) return;
    const { data: targetData } = await supabase
      .from("goal_targets" as any)
      .select("id")
      .eq("goal_id", goalId)
      .eq("user_id", user.id);
    if (!targetData || targetData.length === 0) {
      setUpdates([]);
      return;
    }
    const targetIds = (targetData as any[]).map((t) => t.id);
    const { data } = await supabase
      .from("goal_target_updates" as any)
      .select("*")
      .in("target_id", targetIds)
      .order("created_at", { ascending: false });
    setUpdates((data as unknown as GoalTargetUpdate[]) || []);
  }, [user, goalId]);

  // Compute dynamic progress for task-type targets
  const fetchTaskProgress = useCallback(async () => {
    if (!user || targets.length === 0) return;
    const taskTargets = targets.filter(t => t.target_type === "tasks" && t.unit);
    if (taskTargets.length === 0) return;

    const progressMap: Record<string, TaskProgress> = {};

    for (const target of taskTargets) {
      let parsed: { taskIds?: string[]; spaceIds?: string[] } = {};
      try { parsed = JSON.parse(target.unit || "{}"); } catch { continue; }
      const { taskIds = [], spaceIds = [] } = parsed;

      let totalCount = 0;
      let doneCount = 0;
      const spaceNames: string[] = [];
      const individualTasks: TaskInfo[] = [];
      const spaceTasks: Record<string, TaskInfo[]> = {};

      // Fetch individual tasks
      if (taskIds.length > 0) {
        const { data: taskData } = await supabase
          .from("tasks")
          .select("id, title, column_id, space_id")
          .in("id", taskIds);
        if (taskData) {
          for (const t of taskData as any[]) {
            individualTasks.push({ id: t.id, title: t.title, column_id: t.column_id, space_id: t.space_id });
          }
          totalCount += taskData.length;
          doneCount += taskData.filter((t: any) => t.column_id === "done").length;
        }
      }

      // Fetch tasks in spaces
      for (const spaceId of spaceIds) {
        const { data: spaceName } = await supabase
          .from("planner_spaces" as any)
          .select("name")
          .eq("id", spaceId)
          .single();
        if (spaceName) spaceNames.push((spaceName as any).name);

        const { data: sTaskData } = await supabase
          .from("tasks")
          .select("id, title, column_id, space_id")
          .eq("space_id", spaceId)
          .eq("user_id", user.id)
          .eq("task_scope", "planner");
        if (sTaskData) {
          spaceTasks[spaceId] = (sTaskData as any[]).map((t: any) => ({
            id: t.id, title: t.title, column_id: t.column_id, space_id: t.space_id,
          }));
          totalCount += sTaskData.length;
          doneCount += sTaskData.filter((t: any) => t.column_id === "done").length;
        }
      }

      progressMap[target.id] = { total: totalCount || 1, done: doneCount, spaceNames, individualTasks, spaceTasks };

      // Update the target's current_value and target_value in the database
      const isDone = doneCount >= totalCount && totalCount > 0;
      await supabase
        .from("goal_targets" as any)
        .update({ current_value: doneCount, target_value: totalCount || 1, is_done: isDone })
        .eq("id", target.id);
    }

    setTaskProgressMap(progressMap);
  }, [user, targets]);

  const fetchAllFolders = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("goal_folders" as any)
      .select("id, name")
      .eq("user_id", user.id)
      .order("position", { ascending: true });
    setAllFolders((data as unknown as AllFolder[]) || []);
  }, [user]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchGoal(), fetchTargets(), fetchUpdates(), fetchAllFolders()]);
      setIsLoading(false);
    };
    load();
  }, [fetchGoal, fetchTargets, fetchUpdates, fetchAllFolders]);

  useEffect(() => {
    if (targets.length > 0) {
      fetchTaskProgress();
    }
  }, [targets, fetchTaskProgress]);

  const handleSaveDescription = async () => {
    if (!goal || !user) return;
    await supabase
      .from("goals" as any)
      .update({ description: descriptionValue.trim() || null, updated_at: new Date().toISOString() })
      .eq("id", goal.id);
    setIsEditingDescription(false);
    fetchGoal();
  };

  const handleUpdateTargetSave = async (targetId: string, newCurrentValue: number, newStartValue: number, newTargetValue: number, note: string) => {
    if (!user) return;
    const target = targets.find(t => t.id === targetId);
    if (!target) return;
    const previousValue = Number(target.current_value);
    await supabase.from("goal_target_updates" as any).insert({
      target_id: targetId,
      user_id: user.id,
      previous_value: previousValue,
      new_value: newCurrentValue,
      note: note || null,
    });
    const isDone = newCurrentValue >= newTargetValue;
    await supabase
      .from("goal_targets" as any)
      .update({ current_value: newCurrentValue, start_value: newStartValue, target_value: newTargetValue, is_done: isDone })
      .eq("id", targetId);
    toast.success("Progress updated");
    setUpdatePanelTarget(null);
    fetchTargets();
    fetchUpdates();
  };

  // Goal-level actions
  const handleMoveGoalToFolder = async (newFolderId: string | null) => {
    if (!goal) return;
    await supabase
      .from("goals" as any)
      .update({ folder_id: newFolderId })
      .eq("id", goal.id);
    toast.success(newFolderId ? "Goal moved to folder" : "Goal removed from folder");
    fetchGoal();
  };

  const handleArchiveGoal = async () => {
    if (!goal) return;
    const newStatus = goal.status === "archived" ? "active" : "archived";
    await supabase
      .from("goals" as any)
      .update({ status: newStatus })
      .eq("id", goal.id);
    toast.success(newStatus === "archived" ? "Goal archived" : "Goal unarchived");
    fetchGoal();
  };

  const handleDeleteGoal = async () => {
    if (!goal) return;
    await supabase.from("goal_targets" as any).delete().eq("goal_id", goal.id);
    await supabase.from("goals" as any).delete().eq("id", goal.id);
    toast.success("Goal deleted");
    navigate("/goals");
  };

  const [isRenamingGoal, setIsRenamingGoal] = useState(false);
  const [renameGoalValue, setRenameGoalValue] = useState("");

  const handleRenameGoal = async () => {
    if (!goal || !renameGoalValue.trim()) return;
    await supabase
      .from("goals" as any)
      .update({ title: renameGoalValue.trim(), updated_at: new Date().toISOString() })
      .eq("id", goal.id);
    toast.success("Goal renamed");
    setIsRenamingGoal(false);
    fetchGoal();
  };

  const toggleExpanded = (targetId: string) => {
    setExpandedTargets(prev => {
      const next = new Set(prev);
      if (next.has(targetId)) next.delete(targetId);
      else next.add(targetId);
      return next;
    });
  };

  const handleRemoveTaskFromTarget = async (target: GoalTarget, taskIdToRemove: string) => {
    if (!target.unit) return;
    let parsed: { taskIds?: string[]; spaceIds?: string[] } = {};
    try { parsed = JSON.parse(target.unit); } catch { return; }
    const newTaskIds = (parsed.taskIds || []).filter(id => id !== taskIdToRemove);
    const newUnit = JSON.stringify({ taskIds: newTaskIds, spaceIds: parsed.spaceIds || [] });
    await supabase
      .from("goal_targets" as any)
      .update({ unit: newUnit })
      .eq("id", target.id);
    toast.success("Task removed from target");
    fetchTargets();
  };

  const handleRemoveSpaceFromTarget = async (target: GoalTarget, spaceIdToRemove: string) => {
    if (!target.unit) return;
    let parsed: { taskIds?: string[]; spaceIds?: string[] } = {};
    try { parsed = JSON.parse(target.unit); } catch { return; }
    const newSpaceIds = (parsed.spaceIds || []).filter(id => id !== spaceIdToRemove);
    const newUnit = JSON.stringify({ taskIds: parsed.taskIds || [], spaceIds: newSpaceIds });
    await supabase
      .from("goal_targets" as any)
      .update({ unit: newUnit })
      .eq("id", target.id);
    toast.success("List removed from target");
    fetchTargets();
  };

  const handleDeleteTarget = async (targetId: string) => {
    await supabase.from("goal_target_updates" as any).delete().eq("target_id", targetId);
    await supabase.from("goal_targets" as any).delete().eq("id", targetId);
    toast.success("Target removed");
    fetchTargets();
    fetchUpdates();
  };

  if (isLoading) {
    return (
      <ProjectLayout>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </ProjectLayout>
    );
  }

  if (!goal) {
    return (
      <ProjectLayout>
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-muted-foreground">Goal not found</p>
          <Button variant="outline" onClick={() => navigate("/goals")}>
            Back to Goals
          </Button>
        </div>
      </ProjectLayout>
    );
  }

  const doneTargets = targets.filter((t) => t.is_done).length;
  const totalTargets = targets.length;
  const overallProgress =
    totalTargets > 0 ? Math.round((doneTargets / totalTargets) * 100) : 0;

  const daysLeft = goal.target_date
    ? differenceInDays(parseISO(goal.target_date), new Date())
    : null;
  const isOverdue = daysLeft !== null && daysLeft < 0 && goal.status === "active";

  const circumference = 2 * Math.PI * 52;
  const strokeDash = (overallProgress / 100) * circumference;

  return (
    <ProjectLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm">
            <button
              onClick={() => navigate("/goals")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              All Goals
            </button>
            {folder && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                <button
                  onClick={() => navigate(`/goals/folder/${folder.id}`)}
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Folder className="w-3.5 h-3.5" />
                  {folder.name}
                </button>
              </>
            )}
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            <span className="font-medium text-foreground truncate">{goal.title}</span>
          </div>

          {/* Goal header card — ClickUp style */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="h-1.5" style={{ backgroundColor: goal.color }} />
            <div className="p-6">
              {/* Target date */}
              {goal.target_date && (
                <div className={cn(
                  "flex items-center gap-1.5 text-xs mb-4",
                  isOverdue ? "text-destructive" : "text-muted-foreground"
                )}>
                  <CalendarDays className="w-3.5 h-3.5" />
                  {format(parseISO(goal.target_date), "MMM d, yyyy")}
                  {isOverdue
                    ? ` · ${Math.abs(daysLeft!)}d overdue`
                    : daysLeft === 0
                    ? " · Due today"
                    : ` · ${daysLeft}d left`}
                </div>
              )}

              <div className="flex items-start gap-6">
                {/* Large progress ring */}
                <div className="relative w-28 h-28 shrink-0">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 120 120">
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="8"
                    />
                    <circle
                      cx="60"
                      cy="60"
                      r="52"
                      fill="none"
                      stroke={goal.color}
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${strokeDash} ${circumference}`}
                      className="transition-all duration-500"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-foreground">
                    {overallProgress}%
                  </span>
                </div>

                {/* Title + meta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      {isRenamingGoal ? (
                        <form onSubmit={(e) => { e.preventDefault(); handleRenameGoal(); }} className="flex items-center gap-2">
                          <input
                            autoFocus
                            value={renameGoalValue}
                            onChange={(e) => setRenameGoalValue(e.target.value)}
                            onBlur={() => setIsRenamingGoal(false)}
                            className="text-2xl font-semibold text-foreground bg-transparent border-b border-border focus:border-primary focus:outline-none w-full"
                          />
                        </form>
                      ) : (
                        <h1 className="text-2xl font-semibold text-foreground">{goal.title}</h1>
                      )}
                      {goal.status === "completed" && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            Completed ✓
                          </span>
                        </div>
                      )}
                    </div>
                    {/* Ellipsis menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                          <MoreHorizontal className="w-5 h-5" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => { setRenameGoalValue(goal.title); setIsRenamingGoal(true); }}>
                          <Pencil className="w-3.5 h-3.5 mr-2" /> Rename
                        </DropdownMenuItem>
                        {allFolders.filter(f => f.id !== (goal as any).folder_id).length > 0 && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                <FolderInput className="w-3.5 h-3.5 mr-2" /> Move to Folder
                              </DropdownMenuItem>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="right" align="start">
                              {allFolders.filter(f => f.id !== (goal as any).folder_id).map((f) => (
                                <DropdownMenuItem key={f.id} onClick={() => handleMoveGoalToFolder(f.id)}>
                                  {f.name}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                        <DropdownMenuItem onClick={handleArchiveGoal}>
                          <Archive className="w-3.5 h-3.5 mr-2" /> {goal.status === "archived" ? "Unarchive" : "Archive"}
                        </DropdownMenuItem>
                        {(goal as any).folder_id && (
                          <DropdownMenuItem onClick={() => handleMoveGoalToFolder(null)}>
                            <FolderMinus className="w-3.5 h-3.5 mr-2" /> Remove from Folder
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={handleDeleteGoal} className="text-destructive">
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {goal.why_statement && (
                    <p className="text-sm text-muted-foreground italic mt-1">
                      "{goal.why_statement}"
                    </p>
                  )}

                   {/* Description area */}
                  <div className="mt-2 rounded-lg bg-muted/40 p-3">
                    {isEditingDescription ? (
                      <div className="space-y-2">
                        <AutoResizeTextarea
                          autoFocus
                          value={descriptionValue}
                          onChange={(e) => setDescriptionValue(e.target.value)}
                          placeholder="Add notes or description..."
                          className="text-sm whitespace-pre-wrap bg-transparent border-0 focus-visible:ring-0 p-0 min-h-0"
                          minRows={4}
                          maxLength={2000}
                        />
                        <div className="flex gap-2">
                          <Button size="sm" className="h-7 text-xs" onClick={handleSaveDescription}>
                            Save
                          </Button>
                          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => {
                            setIsEditingDescription(false);
                            setDescriptionValue(goal.description || "");
                          }}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => setIsEditingDescription(true)}
                        className="w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[40px] whitespace-pre-wrap"
                      >
                        {goal.description || "Add a description..."}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Targets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <Target className="w-4 h-4" />
                Targets
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddTarget(true)}
                className="gap-1.5 h-8 text-xs"
              >
                <Plus className="w-3 h-3" /> Add
              </Button>
            </div>

            <AddTargetPanel
              open={showAddTarget}
              onOpenChange={setShowAddTarget}
              onSave={async (t) => {
                if (!user || !goalId) return;
                const isTF = t.target_type === "true_false";
                const { error } = await supabase.from("goal_targets" as any).insert({
                  goal_id: goalId,
                  user_id: user.id,
                  name: t.name,
                  target_type: t.target_type,
                  unit: isTF ? null : t.unit || null,
                  start_value: t.start_value,
                  target_value: t.target_value,
                  current_value: t.start_value,
                  position: targets.length,
                });
                if (error) {
                  toast.error("Failed to add target");
                } else {
                  toast.success("Target added");
                  fetchTargets();
                }
              }}
            />

            <UpdateTargetPanel
              open={!!updatePanelTarget}
              onOpenChange={(open) => { if (!open) setUpdatePanelTarget(null); }}
              target={updatePanelTarget}
              onSave={handleUpdateTargetSave}
            />

            {targets.length === 0 && !showAddTarget && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No targets yet. Add a measurable target above.
              </p>
            )}

            {targets.map((target) => {
              const Icon = TYPE_ICONS[target.target_type] || Hash;
              const isTaskTarget = target.target_type === "tasks";
              const taskProgress = isTaskTarget ? taskProgressMap[target.id] : null;
              const displayCurrent = isTaskTarget && taskProgress ? taskProgress.done : Number(target.current_value);
              const displayTotal = isTaskTarget && taskProgress ? taskProgress.total : Number(target.target_value);
              const range = displayTotal - Number(target.start_value);
              const current = displayCurrent - Number(target.start_value);
              const pct =
                range > 0
                  ? Math.min(100, Math.round((current / range) * 100))
                  : target.is_done
                  ? 100
                  : 0;
              const isExpanded = expandedTargets.has(target.id);

              // Parse unit for task targets
              let parsedUnit: { taskIds?: string[]; spaceIds?: string[] } | null = null;
              if (isTaskTarget && target.unit) {
                try { parsedUnit = JSON.parse(target.unit); } catch {}
              }

              const individualTaskCount = parsedUnit?.taskIds?.length || 0;
              const spaceCount = parsedUnit?.spaceIds?.length || 0;

              return (
                <div
                  key={target.id}
                  className="rounded-xl border border-border bg-card overflow-hidden group"
                >
                  {/* Header row */}
                  <div className="flex items-center gap-3 p-4">
                    <button
                      onClick={() => isTaskTarget ? toggleExpanded(target.id) : setUpdatePanelTarget(target)}
                      className="flex-1 flex items-center gap-3 text-left hover:bg-muted/30 transition-colors rounded-lg -m-1 p-1"
                    >
                      {target.is_done ? (
                        <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      ) : (
                        <Circle className="w-5 h-5 text-muted-foreground/40 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className={cn(
                            "font-medium text-sm",
                            target.is_done && "line-through text-muted-foreground"
                          )}>
                            {target.name}
                          </span>
                          {isTaskTarget && (
                            <span className="text-[10px] text-primary font-medium">
                              {spaceCount > 0 && `${spaceCount} List${spaceCount !== 1 ? "s" : ""}`}
                              {spaceCount > 0 && individualTaskCount > 0 && " · "}
                              {individualTaskCount > 0 && `${individualTaskCount} task${individualTaskCount !== 1 ? "s" : ""}`}
                            </span>
                          )}
                          {isTaskTarget && (
                            <ChevronDown className={cn("w-3.5 h-3.5 text-muted-foreground transition-transform", isExpanded && "rotate-180")} />
                          )}
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {format(parseISO(target.created_at), "MMM d, yyyy 'at' h:mm a")}
                        </p>
                      </div>
                    </button>

                    {/* Progress label with unit */}
                    <span className="text-xs text-muted-foreground font-mono whitespace-nowrap flex items-center gap-1.5">
                      {target.target_type === "true_false" ? (
                        target.is_done ? "1/1" : "0/1"
                      ) : isTaskTarget ? (
                        <>tasks {displayCurrent}/{displayTotal}</>
                      ) : (
                        <>
                          {target.target_type === "number" && target.unit && (
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{target.unit}</span>
                          )}
                          {target.target_type === "currency" && target.unit && (
                            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">{target.unit}</span>
                          )}
                          {Number(target.current_value).toLocaleString()}/{Number(target.target_value).toLocaleString()}
                        </>
                      )}
                    </span>

                    {/* Progress bar */}
                    <div className="w-24 h-2 bg-border rounded-full overflow-hidden shrink-0">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button className="p-1 rounded hover:bg-muted transition-colors text-muted-foreground opacity-0 group-hover:opacity-100">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {!isTaskTarget && (
                          <DropdownMenuItem onClick={() => setUpdatePanelTarget(target)}>
                            <TrendingUp className="w-3.5 h-3.5 mr-2" /> Log Progress
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => handleDeleteTarget(target.id)} className="text-destructive">
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Expanded content for TASK targets — show tasks & lists */}
                  {isExpanded && isTaskTarget && taskProgress && (
                    <div className="border-t border-border bg-muted/5">
                      {/* Lists (Spaces) */}
                      {parsedUnit?.spaceIds && parsedUnit.spaceIds.length > 0 && parsedUnit.spaceIds.map((spaceId, idx) => {
                        const spaceName = taskProgress.spaceNames[idx] || "List";
                        const sTasks = taskProgress.spaceTasks[spaceId] || [];
                        const sDone = sTasks.filter(t => t.column_id === "done").length;
                        return (
                          <div key={spaceId} className="border-b border-border last:border-b-0">
                            <div className="flex items-center gap-3 px-4 py-3">
                              <ListChecks className="w-4 h-4 text-muted-foreground shrink-0" />
                              <button
                                type="button"
                                onClick={() => navigate(`/planner?space=${spaceId}`)}
                                className="font-medium text-sm text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                              >
                                {spaceName}
                                <ExternalLink className="w-3 h-3 text-muted-foreground" />
                              </button>
                              <span className="text-xs text-muted-foreground ml-auto font-mono">
                                tasks {sDone}/{sTasks.length}
                              </span>
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                                <div
                                  className="h-full rounded-full bg-primary/60 transition-all"
                                  style={{ width: `${sTasks.length > 0 ? Math.round((sDone / sTasks.length) * 100) : 0}%` }}
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveSpaceFromTarget(target, spaceId)}
                                className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors"
                                title="Remove list from target"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {/* Show tasks inside the space */}
                            {sTasks.length > 0 && (
                              <div className="pl-11 pr-4 pb-2 space-y-0.5">
                                {sTasks.map(task => (
                                  <div key={task.id} className="flex items-center gap-2 py-1 text-sm">
                                    {task.column_id === "done" ? (
                                      <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                                    ) : (
                                      <Circle className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                                    )}
                                    <span className={cn(
                                      "text-foreground",
                                      task.column_id === "done" && "line-through text-muted-foreground"
                                    )}>
                                      {task.title}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Individual tasks */}
                      {taskProgress.individualTasks.length > 0 && (
                        <div className="px-4 py-2 space-y-0.5">
                          {taskProgress.individualTasks.map(task => (
                            <div key={task.id} className="flex items-center gap-2 py-1.5 group/task">
                              {task.column_id === "done" ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
                              )}
                              <span className={cn(
                                "text-sm flex-1",
                                task.column_id === "done" && "line-through text-muted-foreground"
                              )}>
                                {task.title}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleRemoveTaskFromTarget(target, task.id)}
                                className="p-0.5 rounded hover:bg-muted text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover/task:opacity-100"
                                title="Remove task from target"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {/* Timeline */}
          {updates.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Activity Timeline
              </h2>
              <div className="space-y-2">
                {updates.map((update) => {
                  const target = targets.find((t) => t.id === update.target_id);
                  const diff = Number(update.new_value) - Number(update.previous_value);
                  const isPositive = diff >= 0;
                  const absDiff = Math.abs(diff);
                  const unitPrefix = target?.target_type === "currency" ? getCurrencySymbol(target?.unit ?? null) : "";
                  const unitSuffix = target?.target_type === "number" && target?.unit ? ` ${target.unit}` : "";

                  // Build descriptive action text
                  let actionText = "";
                  if (diff === 0) {
                    actionText = `set to ${unitPrefix}${Number(update.new_value).toLocaleString()}${unitSuffix}`;
                  } else if (isPositive) {
                    actionText = `increased by ${unitPrefix}${absDiff.toLocaleString()}${unitSuffix} → ${unitPrefix}${Number(update.new_value).toLocaleString()}${unitSuffix}`;
                  } else {
                    actionText = `decreased by ${unitPrefix}${absDiff.toLocaleString()}${unitSuffix} → ${unitPrefix}${Number(update.new_value).toLocaleString()}${unitSuffix}`;
                  }

                  return (
                    <div
                      key={update.id}
                      className="flex items-start gap-3 rounded-lg border border-border bg-card p-3"
                    >
                      <div
                        className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 mt-0.5",
                          isPositive
                            ? "bg-primary/10 text-primary"
                            : "bg-destructive/10 text-destructive"
                        )}
                      >
                        {isPositive ? "+" : "−"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          <span className="font-medium">
                            {target?.name || "Target"}
                          </span>{" "}
                          {actionText}
                        </p>
                        {update.note && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {update.note}
                          </p>
                        )}
                      </div>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {format(parseISO(update.created_at), "MMM d, h:mm a")}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </ProjectLayout>
  );
};

export default GoalDetail;
