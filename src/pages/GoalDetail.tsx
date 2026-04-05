import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AddTargetPanel } from "@/components/goals/AddTargetPanel";
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
  Folder,
  MoreHorizontal,
  Pencil,
  Trash2,
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

const GoalDetail = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [goal, setGoal] = useState<Goal | null>(null);
  const [targets, setTargets] = useState<GoalTarget[]>([]);
  const [updates, setUpdates] = useState<GoalTargetUpdate[]>([]);
  const [folder, setFolder] = useState<GoalFolder | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [expandedTarget, setExpandedTarget] = useState<string | null>(null);
  const [updateValue, setUpdateValue] = useState("");
  const [updateNote, setUpdateNote] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

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

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchGoal(), fetchTargets(), fetchUpdates()]);
      setIsLoading(false);
    };
    load();
  }, [fetchGoal, fetchTargets, fetchUpdates]);

  const handleSaveDescription = async () => {
    if (!goal || !user) return;
    await supabase
      .from("goals" as any)
      .update({ description: descriptionValue.trim() || null, updated_at: new Date().toISOString() })
      .eq("id", goal.id);
    setIsEditingDescription(false);
    fetchGoal();
  };

  const handleLogUpdate = async (target: GoalTarget) => {
    if (!user) return;
    setIsUpdating(true);
    let newValue: number;
    if (target.target_type === "true_false") {
      newValue = target.current_value >= 1 ? 0 : 1;
    } else {
      newValue = Number(updateValue);
      if (isNaN(newValue)) {
        toast.error("Please enter a valid number");
        setIsUpdating(false);
        return;
      }
    }
    const previousValue = Number(target.current_value);
    await supabase.from("goal_target_updates" as any).insert({
      target_id: target.id,
      user_id: user.id,
      previous_value: previousValue,
      new_value: newValue,
      note: updateNote.trim() || null,
    });
    const isDone = newValue >= Number(target.target_value);
    await supabase
      .from("goal_targets" as any)
      .update({ current_value: newValue, is_done: isDone })
      .eq("id", target.id);
    toast.success("Progress updated");
    setUpdateValue("");
    setUpdateNote("");
    setExpandedTarget(null);
    setIsUpdating(false);
    fetchTargets();
    fetchUpdates();
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
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h1 className="text-xl font-semibold text-foreground">{goal.title}</h1>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                          {goal.category}
                        </span>
                        {goal.status === "completed" && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                            Completed ✓
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {doneTargets}/{totalTargets} targets
                        </span>
                      </div>
                    </div>
                  </div>

                  {goal.why_statement && (
                    <p className="text-sm text-muted-foreground italic">
                      "{goal.why_statement}"
                    </p>
                  )}

                  {/* Description area */}
                  <div className="pt-2">
                    {isEditingDescription ? (
                      <div className="space-y-2">
                        <Textarea
                          autoFocus
                          value={descriptionValue}
                          onChange={(e) => setDescriptionValue(e.target.value)}
                          placeholder="Add notes or description..."
                          rows={4}
                          className="resize-none text-sm"
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
                        className="w-full text-left text-sm text-muted-foreground hover:text-foreground transition-colors p-2 rounded-lg hover:bg-muted/50 min-h-[40px]"
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

            {targets.length === 0 && !showAddTarget && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No targets yet. Add a measurable target above.
              </p>
            )}

            {targets.map((target) => {
              const Icon = TYPE_ICONS[target.target_type] || Hash;
              const range = Number(target.target_value) - Number(target.start_value);
              const current = Number(target.current_value) - Number(target.start_value);
              const pct =
                range > 0
                  ? Math.min(100, Math.round((current / range) * 100))
                  : target.is_done
                  ? 100
                  : 0;
              const isExpanded = expandedTarget === target.id;

              return (
                <div
                  key={target.id}
                  className="rounded-xl border border-border bg-card overflow-hidden group"
                >
                  <div className="flex items-center gap-3 p-4">
                    <button
                      onClick={() => setExpandedTarget(isExpanded ? null : target.id)}
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
                        </div>
                      </div>
                    </button>

                    {/* Progress fraction */}
                    <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                      {target.target_type === "true_false" ? (
                        target.is_done ? "1/1" : "0/1"
                      ) : (
                        <>
                          {target.target_type === "currency" && target.unit ? getCurrencySymbol(target.unit) : ""}
                          {Number(target.current_value).toLocaleString()}
                          /{target.target_type === "currency" && target.unit ? getCurrencySymbol(target.unit) : ""}
                          {Number(target.target_value).toLocaleString()}
                        </>
                      )}
                    </span>

                    {/* Progress bar */}
                    <div className="w-20 h-1.5 bg-muted rounded-full overflow-hidden shrink-0">
                      <div
                        className={cn(
                          "h-full rounded-full transition-all",
                          target.is_done ? "bg-primary" : "bg-primary/60"
                        )}
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
                        <DropdownMenuItem onClick={() => setExpandedTarget(isExpanded ? null : target.id)}>
                          <TrendingUp className="w-3.5 h-3.5 mr-2" /> Log Progress
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteTarget(target.id)} className="text-destructive">
                          <Trash2 className="w-3.5 h-3.5 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Expanded update form */}
                  {isExpanded && (
                    <div className="border-t border-border p-4 space-y-3 bg-muted/10">
                      <p className="text-xs font-medium text-muted-foreground">
                        Log Progress
                      </p>
                      {target.target_type === "true_false" ? (
                        <Button
                          size="sm"
                          variant={target.is_done ? "outline" : "default"}
                          onClick={() => handleLogUpdate(target)}
                          disabled={isUpdating}
                          className="gap-2"
                        >
                          {target.is_done ? "Mark Incomplete" : "Mark Complete"}
                        </Button>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            type="number"
                            value={updateValue}
                            onChange={(e) => setUpdateValue(e.target.value)}
                            placeholder={`New value (current: ${Number(target.current_value).toLocaleString()})`}
                            className="h-9 text-sm flex-1"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleLogUpdate(target)}
                            disabled={isUpdating || !updateValue}
                            className="h-9"
                          >
                            Update
                          </Button>
                        </div>
                      )}
                      <Textarea
                        value={updateNote}
                        onChange={(e) => setUpdateNote(e.target.value)}
                        placeholder="Add a note (optional)..."
                        rows={2}
                        className="resize-none text-sm"
                        maxLength={500}
                      />
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
                          updated to{" "}
                          <span className="font-mono font-medium">
                            {target?.target_type === "currency" ? "$" : ""}
                            {Number(update.new_value).toLocaleString()}
                          </span>
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
