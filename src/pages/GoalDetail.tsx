import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
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
  CalendarDays,
  Plus,
  Check,
  Circle,
  TrendingUp,
  DollarSign,
  ToggleLeft,
  ListChecks,
  Hash,
  Folder,
  MoreHorizontal,
  Pencil,
  Trash2,
  ExternalLink,
  X,
  FolderInput,
  FolderMinus,
  Archive,
  Sparkles,
  BookOpen,
  Flag,
  Compass,
  ShoppingBag,
  ChevronDown,
} from "lucide-react";
import { PageLoader } from "@/components/ui/page-loader";
import { cn } from "@/lib/utils";
import { format, parseISO, differenceInDays, formatDistanceToNow } from "date-fns";
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

// ——— Editorial primitives ———

const Ring = ({ pct, size = 160, stroke = 10 }: { pct: number; size?: number; stroke?: number }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <svg width={size} height={size} className="block">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(251,247,241,0.15)"
        strokeWidth={stroke}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="hsl(var(--terracotta-500))"
        strokeWidth={stroke}
        strokeDasharray={c}
        strokeDashoffset={c - (pct / 100) * c}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 600ms cubic-bezier(0.22,1,0.36,1)" }}
      />
      <text
        x={size / 2}
        y={size / 2 + 2}
        textAnchor="middle"
        dominantBaseline="middle"
        style={{
          fontFamily: "var(--font-display, 'Playfair Display', serif)",
          fontWeight: 300,
          fontSize: size / 4,
          fill: "#fff",
          letterSpacing: "-0.02em",
        }}
      >
        {pct}%
      </text>
    </svg>
  );
};

const Pill = ({
  done,
  onClick,
}: {
  done: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "w-[22px] h-[22px] rounded-full inline-flex items-center justify-center shrink-0 transition-all",
      done
        ? "border-0"
        : "border-[1.5px] border-[hsl(var(--ink-900)/0.15)] hover:border-[hsl(var(--terracotta-500))]"
    )}
    style={done ? { background: "hsl(var(--moss-500, 110 30% 38%))" } : undefined}
    aria-label={done ? "Mark as incomplete" : "Mark as complete"}
  >
    {done && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
  </button>
);

// Map target_type → editorial icon
function targetIcon(type: string) {
  switch (type) {
    case "currency":
      return ShoppingBag;
    case "true_false":
      return Flag;
    case "tasks":
      return Compass;
    case "number":
    default:
      return BookOpen;
  }
}

function targetIconColor(type: string): string {
  switch (type) {
    case "currency":
      return "hsl(var(--moss-500, 110 30% 38%))";
    case "true_false":
    case "tasks":
      return "hsl(var(--terracotta-500))";
    case "number":
    default:
      return "hsl(var(--ink-800, 30 9% 18%))";
  }
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
  const [hideCompleted, setHideCompleted] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);

  // Description editing
  const [descriptionValue, setDescriptionValue] = useState("");

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

  const fetchTaskProgress = useCallback(async () => {
    if (!user || targets.length === 0) return;
    const taskTargets = targets.filter((t) => t.target_type === "tasks" && t.unit);
    if (taskTargets.length === 0) return;

    const progressMap: Record<string, TaskProgress> = {};

    for (const target of taskTargets) {
      let parsed: { taskIds?: string[]; spaceIds?: string[] } = {};
      try {
        parsed = JSON.parse(target.unit || "{}");
      } catch {
        continue;
      }
      const { taskIds = [], spaceIds = [] } = parsed;

      let totalCount = 0;
      let doneCount = 0;
      const spaceNames: string[] = [];
      const individualTasks: TaskInfo[] = [];
      const spaceTasks: Record<string, TaskInfo[]> = {};

      if (taskIds.length > 0) {
        const { data: taskData } = await supabase
          .from("tasks")
          .select("id, title, column_id, space_id")
          .in("id", taskIds);
        if (taskData) {
          for (const t of taskData as any[]) {
            individualTasks.push({
              id: t.id,
              title: t.title,
              column_id: t.column_id,
              space_id: t.space_id,
            });
          }
          totalCount += taskData.length;
          doneCount += taskData.filter((t: any) => t.column_id === "done").length;
        }
      }

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
            id: t.id,
            title: t.title,
            column_id: t.column_id,
            space_id: t.space_id,
          }));
          totalCount += sTaskData.length;
          doneCount += sTaskData.filter((t: any) => t.column_id === "done").length;
        }
      }

      progressMap[target.id] = {
        total: totalCount || 1,
        done: doneCount,
        spaceNames,
        individualTasks,
        spaceTasks,
      };

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
    setNoteOpen(false);
    fetchGoal();
  };

  const handleUpdateTargetSave = async (
    targetId: string,
    newCurrentValue: number,
    newStartValue: number,
    newTargetValue: number,
    note: string
  ) => {
    if (!user) return;
    const target = targets.find((t) => t.id === targetId);
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
      .update({
        current_value: newCurrentValue,
        start_value: newStartValue,
        target_value: newTargetValue,
        is_done: isDone,
      })
      .eq("id", targetId);
    toast.success("Progress updated");
    setUpdatePanelTarget(null);
    fetchTargets();
    fetchUpdates();
  };

  const handleToggleTargetDone = async (target: GoalTarget) => {
    const newDone = !target.is_done;
    const newCurrent = newDone ? Number(target.target_value) : Number(target.start_value);
    await supabase
      .from("goal_targets" as any)
      .update({ is_done: newDone, current_value: newCurrent })
      .eq("id", target.id);
    fetchTargets();
  };

  // Goal-level actions
  const handleMoveGoalToFolder = async (newFolderId: string | null) => {
    if (!goal) return;
    await supabase.from("goals" as any).update({ folder_id: newFolderId }).eq("id", goal.id);
    toast.success(newFolderId ? "Goal moved to folder" : "Goal removed from folder");
    fetchGoal();
  };

  const handleArchiveGoal = async () => {
    if (!goal) return;
    const newStatus = goal.status === "archived" ? "active" : "archived";
    await supabase.from("goals" as any).update({ status: newStatus }).eq("id", goal.id);
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

  // Inline add target composer
  const [quickTargetName, setQuickTargetName] = useState("");
  const handleQuickAddTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !goalId || !quickTargetName.trim()) return;
    await supabase.from("goal_targets" as any).insert({
      goal_id: goalId,
      user_id: user.id,
      name: quickTargetName.trim(),
      target_type: "true_false",
      unit: null,
      start_value: 0,
      target_value: 1,
      current_value: 0,
      position: targets.length,
    });
    setQuickTargetName("");
    fetchTargets();
  };

  // Delete confirmation state
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [pendingDeleteAction, setPendingDeleteAction] = useState<(() => void) | null>(null);
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState("");

  const confirmDelete = (title: string, action: () => void) => {
    setDeleteConfirmTitle(title);
    setPendingDeleteAction(() => action);
    setDeleteConfirmOpen(true);
  };

  const toggleExpanded = (targetId: string) => {
    setExpandedTargets((prev) => {
      const next = new Set(prev);
      if (next.has(targetId)) next.delete(targetId);
      else next.add(targetId);
      return next;
    });
  };

  const handleRemoveTaskFromTarget = async (target: GoalTarget, taskIdToRemove: string) => {
    if (!target.unit) return;
    let parsed: { taskIds?: string[]; spaceIds?: string[] } = {};
    try {
      parsed = JSON.parse(target.unit);
    } catch {
      return;
    }
    const newTaskIds = (parsed.taskIds || []).filter((id) => id !== taskIdToRemove);
    const newUnit = JSON.stringify({ taskIds: newTaskIds, spaceIds: parsed.spaceIds || [] });
    await supabase.from("goal_targets" as any).update({ unit: newUnit }).eq("id", target.id);
    toast.success("Task removed from target");
    fetchTargets();
  };

  const handleRemoveSpaceFromTarget = async (target: GoalTarget, spaceIdToRemove: string) => {
    if (!target.unit) return;
    let parsed: { taskIds?: string[]; spaceIds?: string[] } = {};
    try {
      parsed = JSON.parse(target.unit);
    } catch {
      return;
    }
    const newSpaceIds = (parsed.spaceIds || []).filter((id) => id !== spaceIdToRemove);
    const newUnit = JSON.stringify({ taskIds: parsed.taskIds || [], spaceIds: newSpaceIds });
    await supabase.from("goal_targets" as any).update({ unit: newUnit }).eq("id", target.id);
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

  // ——— Derived ———

  const totalTargets = targets.length;
  const doneTargets = targets.filter((t) => t.is_done).length;

  const overallProgress = useMemo(() => {
    if (totalTargets === 0) return 0;
    return Math.round(
      targets.reduce((sum, t) => {
        const range = Number(t.target_value) - Number(t.start_value);
        const current = Number(t.current_value) - Number(t.start_value);
        return sum + (range > 0 ? Math.min(100, (current / range) * 100) : t.is_done ? 100 : 0);
      }, 0) / totalTargets
    );
  }, [targets, totalTargets]);

  const daysLeft = goal?.target_date
    ? differenceInDays(parseISO(goal.target_date), new Date())
    : null;
  const isOverdue = daysLeft !== null && daysLeft < 0 && goal?.status === "active";

  const goalState: "in-motion" | "planning" | "not-started" | "done" | "archived" = useMemo(() => {
    if (!goal) return "planning";
    if (goal.status === "archived") return "archived";
    if (goal.status === "completed") return "done";
    if (targets.length === 0) return "planning";
    if (targets.every((t) => t.is_done)) return "done";
    const hasMotion = targets.some((t) => Number(t.current_value) > Number(t.start_value) || t.is_done);
    return hasMotion ? "in-motion" : "not-started";
  }, [goal, targets]);

  const stateLabel: Record<typeof goalState, string> = {
    "in-motion": "In motion",
    planning: "Planning",
    "not-started": "Not started",
    done: "Done",
    archived: "Archived",
  };

  // "Up next" — first incomplete target with closest due date (fallback: first incomplete)
  const upNext = useMemo(() => {
    const incomplete = targets.filter((t) => !t.is_done);
    if (incomplete.length === 0) return null;
    return incomplete[0];
  }, [targets]);

  // Visible targets (filter)
  const visibleTargets = useMemo(
    () => (hideCompleted ? targets.filter((t) => !t.is_done) : targets),
    [targets, hideCompleted]
  );

  if (isLoading) {
    return (
      <ProjectLayout>
        <PageLoader containerClassName="flex-1 flex items-center justify-center min-h-[60vh] bg-[hsl(var(--paper-100,30_30%_97%))]" />
      </ProjectLayout>
    );
  }

  if (!goal) {
    return (
      <ProjectLayout>
        <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[hsl(var(--paper-100,30_30%_97%))]">
          <p className="text-muted-foreground">Goal not found</p>
          <Button variant="outline" onClick={() => navigate("/goals")}>
            Back to Goals
          </Button>
        </div>
      </ProjectLayout>
    );
  }

  const notePreview =
    (goal.description || "").split("\n").filter(Boolean)[0] || "Add a note…";

  return (
    <ProjectLayout>
      <div
        className="flex-1 overflow-y-auto"
        style={{
          background: "hsl(var(--paper-100, 30 30% 97%))",
          fontFamily: "var(--font-body, 'Inter', sans-serif)",
          color: "hsl(var(--ink-900, 30 9% 10%))",
        }}
      >
        <div className="max-w-[1240px] mx-auto px-6 sm:px-10 pt-7 pb-32">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[13px] text-[hsl(var(--ink-900)/0.55)] mb-[22px] flex-wrap">
            <button
              onClick={() => navigate("/goals")}
              className="hover:text-[hsl(var(--ink-900))] transition-colors"
            >
              All Goals
            </button>
            {folder && (
              <>
                <span>/</span>
                <Folder className="w-3 h-3" />
                <button
                  onClick={() => navigate(`/goals/folder/${folder.id}`)}
                  className="hover:text-[hsl(var(--ink-900))] transition-colors"
                >
                  {folder.name}
                </button>
              </>
            )}
            <span>/</span>
            <span className="text-[hsl(var(--ink-900))] font-medium truncate">{goal.title}</span>
          </div>

          {/* HERO */}
          <div
            className="relative overflow-hidden rounded-[20px] px-7 sm:px-11 py-9 sm:py-10 grid gap-10"
            style={{
              background: "linear-gradient(135deg, hsl(var(--ink-900, 30 9% 10%)) 0%, #2E2822 100%)",
              color: "hsl(var(--paper-100, 30 30% 97%))",
              gridTemplateColumns: "1fr auto",
            }}
          >
            {/* Decorative blob */}
            <div
              aria-hidden
              className="pointer-events-none absolute"
              style={{
                right: -120,
                top: -120,
                width: 360,
                height: 360,
                borderRadius: 999,
                background:
                  "radial-gradient(circle, hsl(var(--terracotta-500) / 0.25), transparent 65%)",
              }}
            />

            <div className="relative z-[1] min-w-0">
              {/* State pill */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold tracking-[0.06em]"
                style={{
                  background: "hsl(var(--terracotta-500) / 0.18)",
                  color: "hsl(var(--terracotta-500))",
                }}
              >
                {goalState === "in-motion" && (
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: "hsl(var(--terracotta-500))" }}
                  />
                )}
                {stateLabel[goalState].toUpperCase()}
              </div>

              {/* Title */}
              {isRenamingGoal ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleRenameGoal();
                  }}
                  className="mt-4"
                >
                  <input
                    autoFocus
                    value={renameGoalValue}
                    onChange={(e) => setRenameGoalValue(e.target.value)}
                    onBlur={() => setIsRenamingGoal(false)}
                    className="w-full bg-transparent border-b border-white/30 focus:border-white focus:outline-none text-white"
                    style={{
                      fontFamily: "var(--font-display, 'Playfair Display', serif)",
                      fontWeight: 300,
                      fontSize: "clamp(36px, 5vw, 56px)",
                      letterSpacing: "-0.025em",
                      lineHeight: 1.02,
                    }}
                  />
                </form>
              ) : (
                <h1
                  onClick={() => {
                    setRenameGoalValue(goal.title);
                    setIsRenamingGoal(true);
                  }}
                  className="cursor-text"
                  style={{
                    fontFamily: "var(--font-display, 'Playfair Display', serif)",
                    fontWeight: 300,
                    fontSize: "clamp(36px, 5vw, 56px)",
                    letterSpacing: "-0.025em",
                    lineHeight: 1.02,
                    margin: "16px 0 0",
                    color: "hsl(var(--paper-100))",
                  }}
                >
                  {goal.title}
                </h1>
              )}

              {goal.why_statement && (
                <p
                  style={{
                    fontFamily: "var(--font-display, 'Playfair Display', serif)",
                    fontStyle: "italic",
                    fontWeight: 300,
                    fontSize: 19,
                    lineHeight: 1.5,
                    color: "rgba(251,247,241,0.78)",
                    marginTop: 14,
                    maxWidth: 540,
                  }}
                >
                  "{goal.why_statement}"
                </p>
              )}

              {/* Stat bar */}
              <div className="grid gap-8 mt-8" style={{ gridTemplateColumns: "repeat(4, auto)", alignItems: "end" }}>
                <Stat value={String(overallProgress)} suffix="%" label="Complete" />
                <Stat
                  value={String(doneTargets)}
                  suffix={`/${totalTargets}`}
                  label="Targets"
                />
                {daysLeft !== null ? (
                  <Stat
                    value={String(Math.abs(daysLeft))}
                    suffix="d"
                    label={isOverdue ? "Overdue" : `Til ${format(parseISO(goal.target_date!), "MMM d")}`}
                  />
                ) : (
                  <Stat value="—" label="No due date" />
                )}
                <Stat value={String(updates.length)} label="Updates" />
              </div>

              {/* Actions */}
              <div className="flex gap-2.5 mt-7 flex-wrap">
                <button
                  onClick={() => setShowAddTarget(true)}
                  className="inline-flex items-center gap-2 rounded-full px-[18px] py-2.5 text-[13px] font-medium text-white whitespace-nowrap transition-colors"
                  style={{ background: "hsl(var(--terracotta-500))" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "hsl(var(--terracotta-700))")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "hsl(var(--terracotta-500))")}
                >
                  <Plus className="w-3.5 h-3.5" strokeWidth={2} /> Add target
                </button>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[13px] font-medium whitespace-nowrap"
                      style={{
                        background: "rgba(251,247,241,0.08)",
                        color: "hsl(var(--paper-100))",
                        border: "1px solid rgba(251,247,241,0.15)",
                      }}
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" /> More
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuItem
                      onClick={() => {
                        setRenameGoalValue(goal.title);
                        setIsRenamingGoal(true);
                      }}
                    >
                      <Pencil className="w-3.5 h-3.5 mr-2" /> Rename
                    </DropdownMenuItem>
                    {allFolders.filter((f) => f.id !== (goal as any).folder_id).length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <FolderInput className="w-3.5 h-3.5 mr-2" /> Move to Folder
                          </DropdownMenuItem>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent side="right" align="start">
                          {allFolders
                            .filter((f) => f.id !== (goal as any).folder_id)
                            .map((f) => (
                              <DropdownMenuItem key={f.id} onClick={() => handleMoveGoalToFolder(f.id)}>
                                {f.name}
                              </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                    {(goal as any).folder_id && (
                      <DropdownMenuItem onClick={() => handleMoveGoalToFolder(null)}>
                        <FolderMinus className="w-3.5 h-3.5 mr-2" /> Remove from Folder
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={handleArchiveGoal}>
                      <Archive className="w-3.5 h-3.5 mr-2" />{" "}
                      {goal.status === "archived" ? "Unarchive" : "Archive"}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => confirmDelete("Delete this goal?", handleDeleteGoal)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            {/* Right: Ring */}
            <div className="relative z-[1] hidden md:flex items-center">
              <Ring pct={overallProgress} size={160} stroke={10} />
            </div>
          </div>

          {/* Two-column below hero */}
          <div className="grid gap-8 mt-9" style={{ gridTemplateColumns: "minmax(0,1fr) 320px" }}>
            {/* LEFT — Note + targets */}
            <section className="min-w-0">
              {/* Note card */}
              <div
                className="rounded-[14px] overflow-hidden bg-white"
                style={{ border: "1px solid hsl(var(--ink-900) / 0.08)" }}
              >
                <button
                  onClick={() => setNoteOpen((o) => !o)}
                  className="w-full bg-transparent border-0 px-[18px] py-[14px] flex items-center gap-3.5 cursor-pointer text-left"
                >
                  <BookOpen className="w-[15px] h-[15px] text-[hsl(var(--ink-900)/0.5)] shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div
                      style={{
                        fontSize: 10.5,
                        letterSpacing: "0.16em",
                        textTransform: "uppercase",
                        color: "hsl(var(--ink-900) / 0.5)",
                        fontWeight: 600,
                      }}
                    >
                      Note
                    </div>
                    {!noteOpen && (
                      <div
                        className="truncate"
                        style={{
                          fontFamily: "var(--font-display, 'Playfair Display', serif)",
                          fontStyle: "italic",
                          fontSize: 14.5,
                          color: "hsl(var(--ink-900) / 0.65)",
                          marginTop: 3,
                        }}
                      >
                        {notePreview}
                      </div>
                    )}
                  </div>
                  <span
                    className="shrink-0 text-[11px]"
                    style={{ color: "hsl(var(--ink-900) / 0.5)", fontFamily: "var(--font-mono, ui-monospace)" }}
                  >
                    {noteOpen ? "— Collapse" : "+ Expand"}
                  </span>
                </button>
                {noteOpen && (
                  <div className="px-[18px] pb-4">
                    <AutoResizeTextarea
                      value={descriptionValue}
                      onChange={(e) => setDescriptionValue(e.target.value)}
                      placeholder="Why does this goal matter? What's the story behind it?"
                      minRows={5}
                      maxLength={2000}
                      className="w-full rounded-[10px] px-4 py-3.5 outline-none resize-y"
                      style={{
                        border: "1px solid hsl(var(--ink-900) / 0.08)",
                        background: "hsl(var(--paper-100, 30 30% 97%))",
                        fontFamily: "var(--font-display, 'Playfair Display', serif)",
                        fontSize: 15,
                        lineHeight: 1.55,
                        color: "hsl(var(--ink-900))",
                      }}
                    />
                    <div
                      className="flex justify-between items-center mt-2.5"
                      style={{ fontSize: 11.5, color: "hsl(var(--ink-900) / 0.5)" }}
                    >
                      <span>
                        Last edited ·{" "}
                        {goal.updated_at
                          ? format(parseISO(goal.updated_at), "MMM d")
                          : format(parseISO(goal.created_at), "MMM d")}
                      </span>
                      <Button
                        size="sm"
                        className="h-7 text-xs"
                        onClick={handleSaveDescription}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Targets header */}
              <div className="h-7" />
              <div className="flex justify-between items-center mb-1.5">
                <div
                  style={{
                    fontFamily: "var(--font-display, 'Playfair Display', serif)",
                    fontWeight: 500,
                    fontSize: 22,
                    letterSpacing: "-0.015em",
                    color: "hsl(var(--ink-900))",
                  }}
                >
                  Targets{" "}
                  <span
                    className="ml-1.5"
                    style={{
                      fontFamily: "var(--font-mono, ui-monospace)",
                      fontSize: 13,
                      color: "hsl(var(--ink-900) / 0.5)",
                      fontWeight: 400,
                    }}
                  >
                    {doneTargets}/{totalTargets}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setHideCompleted((v) => !v)}
                    className="rounded-full px-3.5 py-1.5 text-[12px] cursor-pointer transition-colors"
                    style={{
                      background: "white",
                      border: "1px solid hsl(var(--ink-900) / 0.15)",
                      color: "hsl(var(--ink-900) / 0.7)",
                    }}
                  >
                    {hideCompleted ? "Show completed" : "Hide completed"}
                  </button>
                  <button
                    onClick={() => setShowAddTarget(true)}
                    className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium cursor-pointer text-white"
                    style={{ background: "hsl(var(--ink-900))" }}
                  >
                    <Plus className="w-3 h-3" strokeWidth={2} /> Add
                  </button>
                </div>
              </div>

              {/* Empty state */}
              {totalTargets === 0 && (
                <div
                  className="mt-6 rounded-[12px] py-10 text-center"
                  style={{
                    background: "white",
                    border: "1px dashed hsl(var(--ink-900) / 0.15)",
                  }}
                >
                  <p className="text-[14px]" style={{ color: "hsl(var(--ink-900) / 0.55)" }}>
                    No targets yet. Add a measurable target above.
                  </p>
                </div>
              )}

              {/* Single section: all targets (preserves existing data shape — we don't add phase grouping table) */}
              {totalTargets > 0 && (
                <div className="mt-7">
                  <div
                    className="flex items-baseline justify-between gap-3 pb-3"
                    style={{ borderBottom: "1px solid hsl(var(--ink-900))" }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 10.5,
                          letterSpacing: "0.16em",
                          textTransform: "uppercase",
                          color: "hsl(var(--terracotta-500))",
                          fontWeight: 600,
                        }}
                      >
                        All targets
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-display, 'Playfair Display', serif)",
                          fontWeight: 500,
                          fontSize: 20,
                          letterSpacing: "-0.01em",
                          marginTop: 2,
                          color: "hsl(var(--ink-900))",
                        }}
                      >
                        Measure the path
                      </div>
                    </div>
                    <div
                      className="text-right whitespace-nowrap"
                      style={{ fontSize: 12, color: "hsl(var(--ink-900) / 0.5)" }}
                    >
                      {doneTargets} / {totalTargets}
                    </div>
                  </div>

                  {visibleTargets.map((target) => {
                    const isUpNext = upNext?.id === target.id;
                    const isTaskTarget = target.target_type === "tasks";
                    const taskProgress = isTaskTarget ? taskProgressMap[target.id] : null;
                    const Icon = targetIcon(target.target_type);

                    let parsedUnit: { taskIds?: string[]; spaceIds?: string[] } | null = null;
                    if (isTaskTarget && target.unit) {
                      try {
                        parsedUnit = JSON.parse(target.unit);
                      } catch {}
                    }

                    const displayCurrent =
                      isTaskTarget && taskProgress
                        ? taskProgress.done
                        : Number(target.current_value);
                    const displayTotal =
                      isTaskTarget && taskProgress
                        ? taskProgress.total
                        : Number(target.target_value);

                    const isExpanded = expandedTargets.has(target.id);

                    const dueLabel =
                      target.target_type === "true_false"
                        ? null
                        : `${displayCurrent.toLocaleString()}/${displayTotal.toLocaleString()}${
                            target.unit && target.target_type === "number" ? ` ${target.unit}` : ""
                          }`;

                    return (
                      <div key={target.id}>
                        <div
                          className="grid gap-4 items-center py-3.5 px-1 group/row"
                          style={{
                            gridTemplateColumns: "22px 1fr auto auto",
                            borderBottom: "1px solid hsl(var(--ink-900) / 0.06)",
                            opacity: target.is_done ? 0.6 : 1,
                          }}
                        >
                          <Pill done={target.is_done} onClick={() => handleToggleTargetDone(target)} />

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <Icon
                                className="w-3 h-3 shrink-0"
                                style={{ color: targetIconColor(target.target_type) }}
                              />
                              <button
                                onClick={() =>
                                  isTaskTarget
                                    ? toggleExpanded(target.id)
                                    : setUpdatePanelTarget(target)
                                }
                                className="text-left truncate"
                                style={{
                                  fontFamily: "var(--font-display, 'Playfair Display', serif)",
                                  fontWeight: 500,
                                  fontSize: 16.5,
                                  letterSpacing: "-0.005em",
                                  color: "hsl(var(--ink-900))",
                                  textDecoration: target.is_done ? "line-through" : "none",
                                }}
                              >
                                {target.name}
                              </button>
                              {isUpNext && !target.is_done && (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap"
                                  style={{
                                    background: "hsl(var(--clay-200, 25 40% 90%))",
                                    fontSize: 10.5,
                                    fontWeight: 600,
                                    color: "hsl(var(--terracotta-500))",
                                    letterSpacing: "0.04em",
                                  }}
                                >
                                  UP NEXT
                                </span>
                              )}
                              {isTaskTarget && (
                                <ChevronDown
                                  className={cn(
                                    "w-3.5 h-3.5 text-[hsl(var(--ink-900)/0.5)] transition-transform",
                                    isExpanded && "rotate-180"
                                  )}
                                />
                              )}
                            </div>
                          </div>

                          <div
                            className="whitespace-nowrap"
                            style={{ fontSize: 12, color: "hsl(var(--ink-900) / 0.5)" }}
                          >
                            {dueLabel ||
                              (target.is_done
                                ? "Done"
                                : `Created ${format(parseISO(target.created_at), "MMM d")}`)}
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                className="p-1.5 rounded-md hover:bg-[hsl(var(--ink-900)/0.05)] transition-colors text-[hsl(var(--ink-900)/0.5)]"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="w-3.5 h-3.5" />
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {!isTaskTarget && (
                                <DropdownMenuItem onClick={() => setUpdatePanelTarget(target)}>
                                  <TrendingUp className="w-3.5 h-3.5 mr-2" /> Log Progress
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() =>
                                  confirmDelete("Delete this target?", () =>
                                    handleDeleteTarget(target.id)
                                  )
                                }
                                className="text-destructive"
                              >
                                <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Expanded — task target details */}
                        {isExpanded && isTaskTarget && taskProgress && (
                          <div className="bg-[hsl(var(--paper-100,30_30%_97%))]/50 px-2 pb-2">
                            {parsedUnit?.spaceIds &&
                              parsedUnit.spaceIds.length > 0 &&
                              parsedUnit.spaceIds.map((spaceId, idx) => {
                                const spaceName = taskProgress.spaceNames[idx] || "List";
                                const sTasks = taskProgress.spaceTasks[spaceId] || [];
                                const sDone = sTasks.filter((t) => t.column_id === "done").length;
                                return (
                                  <div
                                    key={spaceId}
                                    className="border-b border-[hsl(var(--ink-900)/0.06)] last:border-b-0"
                                  >
                                    <div className="flex items-center gap-3 px-4 py-3">
                                      <ListChecks className="w-4 h-4 text-[hsl(var(--ink-900)/0.55)] shrink-0" />
                                      <button
                                        type="button"
                                        onClick={() => navigate(`/planner?space=${spaceId}`)}
                                        className="font-medium text-sm text-[hsl(var(--ink-900))] hover:text-[hsl(var(--terracotta-500))] transition-colors flex items-center gap-1.5"
                                      >
                                        {spaceName}
                                        <ExternalLink className="w-3 h-3 text-[hsl(var(--ink-900)/0.4)]" />
                                      </button>
                                      <span className="text-xs text-[hsl(var(--ink-900)/0.5)] ml-auto font-mono">
                                        tasks {sDone}/{sTasks.length}
                                      </span>
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveSpaceFromTarget(target, spaceId)}
                                        className="p-1 rounded text-[hsl(var(--ink-900)/0.4)] hover:text-destructive transition-colors"
                                        title="Remove list from target"
                                      >
                                        <X className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                    {sTasks.length > 0 && (
                                      <div className="pl-11 pr-4 pb-2 space-y-0.5">
                                        {sTasks.map((task) => (
                                          <div
                                            key={task.id}
                                            className="flex items-center gap-2 py-1 text-sm"
                                          >
                                            {task.column_id === "done" ? (
                                              <Check className="w-3.5 h-3.5 text-[hsl(var(--moss-500,110_30%_38%))] shrink-0" />
                                            ) : (
                                              <Circle className="w-3.5 h-3.5 text-[hsl(var(--ink-900)/0.3)] shrink-0" />
                                            )}
                                            <span
                                              className={cn(
                                                "text-[hsl(var(--ink-900))]",
                                                task.column_id === "done" &&
                                                  "line-through text-[hsl(var(--ink-900)/0.5)]"
                                              )}
                                            >
                                              {task.title}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}

                            {taskProgress.individualTasks.length > 0 && (
                              <div className="px-4 py-2 space-y-0.5">
                                {taskProgress.individualTasks.map((task) => (
                                  <div
                                    key={task.id}
                                    className="flex items-center gap-2 py-1.5 group/task"
                                  >
                                    {task.column_id === "done" ? (
                                      <Check className="w-3.5 h-3.5 text-[hsl(var(--moss-500,110_30%_38%))] shrink-0" />
                                    ) : (
                                      <Circle className="w-3.5 h-3.5 text-[hsl(var(--ink-900)/0.3)] shrink-0" />
                                    )}
                                    <span
                                      className={cn(
                                        "text-sm flex-1 text-[hsl(var(--ink-900))]",
                                        task.column_id === "done" &&
                                          "line-through text-[hsl(var(--ink-900)/0.5)]"
                                      )}
                                    >
                                      {task.title}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveTaskFromTarget(target, task.id)}
                                      className="p-0.5 rounded text-[hsl(var(--ink-900)/0.4)] hover:text-destructive transition-colors opacity-0 group-hover/task:opacity-100"
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
              )}

              {/* Inline add composer */}
              <form
                onSubmit={handleQuickAddTarget}
                className="mt-5 px-4 py-3.5 rounded-[12px] flex items-center gap-3 bg-white"
                style={{ border: "1px dashed hsl(var(--ink-900) / 0.18)" }}
              >
                <Plus className="w-3.5 h-3.5 text-[hsl(var(--ink-900)/0.5)] shrink-0" />
                <input
                  value={quickTargetName}
                  onChange={(e) => setQuickTargetName(e.target.value)}
                  placeholder="Add another target…"
                  className="flex-1 border-0 outline-none bg-transparent text-[14px] text-[hsl(var(--ink-900))] placeholder:text-[hsl(var(--ink-900)/0.4)]"
                />
                <button
                  type="button"
                  onClick={() => setShowAddTarget(true)}
                  className="inline-flex items-center gap-1 text-[12px] text-[hsl(var(--ink-900)/0.55)] hover:text-[hsl(var(--ink-900))] transition-colors"
                >
                  <CalendarDays className="w-3 h-3" /> Advanced
                </button>
              </form>
            </section>

            {/* RIGHT RAIL */}
            <aside className="hidden lg:flex flex-col gap-[18px]">
              {/* Up next */}
              {upNext && (
                <div
                  className="rounded-[14px] p-[22px]"
                  style={{
                    background:
                      "linear-gradient(160deg, #fff 0%, hsl(var(--clay-200, 25 40% 90%)) 100%)",
                    border: "1px solid hsl(var(--ink-900) / 0.08)",
                  }}
                >
                  <div
                    style={{
                      fontSize: 10.5,
                      letterSpacing: "0.16em",
                      textTransform: "uppercase",
                      color: "hsl(var(--terracotta-500))",
                      fontWeight: 600,
                    }}
                  >
                    Up next
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-display, 'Playfair Display', serif)",
                      fontWeight: 500,
                      fontSize: 20,
                      letterSpacing: "-0.01em",
                      color: "hsl(var(--ink-900))",
                      marginTop: 8,
                      lineHeight: 1.25,
                    }}
                  >
                    {upNext.name}
                  </div>
                  <div className="text-[12.5px] text-[hsl(var(--ink-900)/0.65)] mt-1.5">
                    {Number(upNext.current_value).toLocaleString()}/
                    {Number(upNext.target_value).toLocaleString()}{" "}
                    {upNext.unit && upNext.target_type === "number" ? upNext.unit : ""}
                    {upNext.target_type === "true_false" && "Mark when complete"}
                  </div>
                  <button
                    onClick={() =>
                      upNext.target_type === "true_false"
                        ? handleToggleTargetDone(upNext)
                        : setUpdatePanelTarget(upNext)
                    }
                    className="mt-3.5 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px] font-medium text-white"
                    style={{ background: "hsl(var(--ink-900))" }}
                  >
                    {upNext.target_type === "true_false" ? "Mark done" : "Log progress"}{" "}
                    {upNext.target_type === "true_false" && (
                      <Check className="w-3 h-3" strokeWidth={2.5} />
                    )}
                  </button>
                </div>
              )}

              {/* Details */}
              <div
                className="rounded-[14px] p-[22px] bg-white"
                style={{ border: "1px solid hsl(var(--ink-900) / 0.08)" }}
              >
                <div
                  style={{
                    fontSize: 10.5,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "hsl(var(--ink-900) / 0.5)",
                    fontWeight: 600,
                  }}
                >
                  Details
                </div>
                <div className="mt-3 grid gap-3 text-[12.5px]">
                  {[
                    { l: "Folder", v: folder?.name || "—" },
                    { l: "Created", v: format(parseISO(goal.created_at), "MMM d, yyyy") },
                    {
                      l: "Due",
                      v: goal.target_date
                        ? format(parseISO(goal.target_date), "MMM d, yyyy")
                        : "—",
                    },
                    { l: "Category", v: goal.category || "—" },
                    { l: "Status", v: stateLabel[goalState] },
                  ].map((r) => (
                    <div
                      key={r.l}
                      className="grid gap-2.5 items-baseline"
                      style={{ gridTemplateColumns: "70px 1fr" }}
                    >
                      <span
                        style={{
                          color: "hsl(var(--ink-900) / 0.5)",
                          fontSize: 11,
                          letterSpacing: "0.06em",
                          textTransform: "uppercase",
                          fontWeight: 600,
                        }}
                      >
                        {r.l}
                      </span>
                      <span
                        className="leading-snug"
                        style={{ color: "hsl(var(--ink-900))", fontWeight: 500 }}
                      >
                        {r.v}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reflection */}
              <div
                className="rounded-[14px] p-[22px]"
                style={{
                  background: "hsl(var(--ink-900))",
                  color: "hsl(var(--paper-100))",
                }}
              >
                <div
                  style={{
                    fontSize: 10.5,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "hsl(var(--terracotta-500))",
                    fontWeight: 600,
                  }}
                >
                  Weekly reflection
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-display, 'Playfair Display', serif)",
                    fontStyle: "italic",
                    fontWeight: 300,
                    fontSize: 17,
                    lineHeight: 1.45,
                    marginTop: 10,
                  }}
                >
                  "What small thing could you do this week to stay in motion?"
                </div>
                <button
                  onClick={() => setNoteOpen(true)}
                  className="mt-3.5 inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12px]"
                  style={{
                    background: "transparent",
                    color: "hsl(var(--paper-100))",
                    border: "1px solid rgba(251,247,241,0.25)",
                  }}
                >
                  <Pencil className="w-3 h-3" /> Journal
                </button>
              </div>

              {/* Activity */}
              <div
                className="rounded-[14px] p-[22px] bg-white"
                style={{ border: "1px solid hsl(var(--ink-900) / 0.08)" }}
              >
                <div
                  style={{
                    fontSize: 10.5,
                    letterSpacing: "0.16em",
                    textTransform: "uppercase",
                    color: "hsl(var(--ink-900) / 0.5)",
                    fontWeight: 600,
                  }}
                >
                  Recent activity
                </div>
                {updates.length === 0 ? (
                  <p className="mt-3 text-[12.5px] text-[hsl(var(--ink-900)/0.5)] italic">
                    No updates yet. Log progress on a target to start your trail.
                  </p>
                ) : (
                  <div className="mt-3 grid gap-3.5">
                    {updates.slice(0, 6).map((u, i) => {
                      const target = targets.find((t) => t.id === u.target_id);
                      const diff = Number(u.new_value) - Number(u.previous_value);
                      const isPositive = diff >= 0;
                      const action =
                        diff === 0
                          ? "set"
                          : isPositive
                          ? "increased"
                          : "decreased";
                      return (
                        <div
                          key={u.id}
                          className="flex gap-2.5 text-[12.5px] leading-snug text-[hsl(var(--ink-900)/0.7)]"
                        >
                          <div
                            className="w-1.5 h-1.5 rounded-full mt-[7px] shrink-0"
                            style={{
                              background:
                                i === 0
                                  ? "hsl(var(--moss-500, 110 30% 38%))"
                                  : "hsl(var(--ink-900) / 0.2)",
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-[hsl(var(--ink-900))] font-medium">You</span>{" "}
                            {action}{" "}
                            <span className="text-[hsl(var(--ink-900))] font-medium">
                              {target?.name || "a target"}
                            </span>
                            <div className="text-[11px] text-[hsl(var(--ink-900)/0.45)] mt-0.5">
                              {formatDistanceToNow(parseISO(u.created_at), { addSuffix: true })}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>

        {/* Add target panel */}
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
          onOpenChange={(open) => {
            if (!open) setUpdatePanelTarget(null);
          }}
          target={updatePanelTarget}
          onSave={handleUpdateTargetSave}
        />
      </div>

      <DeleteConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        onConfirm={() => {
          pendingDeleteAction?.();
        }}
        title={deleteConfirmTitle}
      />
    </ProjectLayout>
  );
};

// Stat element used in hero
function Stat({
  value,
  suffix,
  label,
}: {
  value: string;
  suffix?: string;
  label: string;
}) {
  return (
    <div>
      <div
        style={{
          fontFamily: "var(--font-display, 'Playfair Display', serif)",
          fontWeight: 400,
          fontSize: 32,
          color: "#fff",
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}
      >
        {value}
        {suffix && (
          <span style={{ color: "rgba(251,247,241,0.4)", fontSize: 18 }}>{suffix}</span>
        )}
      </div>
      <div
        style={{
          fontSize: 10.5,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(251,247,241,0.5)",
          fontWeight: 600,
          marginTop: 6,
        }}
      >
        {label}
      </div>
    </div>
  );
}

export default GoalDetail;
