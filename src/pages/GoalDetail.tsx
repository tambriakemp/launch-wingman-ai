import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
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

const TYPE_LABELS: Record<string, string> = {
  number: "Number",
  currency: "Currency",
  true_false: "True / False",
  tasks: "Tasks",
};

const GoalDetail = () => {
  const { goalId } = useParams<{ goalId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [goal, setGoal] = useState<Goal | null>(null);
  const [targets, setTargets] = useState<GoalTarget[]>([]);
  const [updates, setUpdates] = useState<GoalTargetUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Update form state per target
  const [expandedTarget, setExpandedTarget] = useState<string | null>(null);
  const [updateValue, setUpdateValue] = useState("");
  const [updateNote, setUpdateNote] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchGoal = useCallback(async () => {
    if (!user || !goalId) return;
    const { data } = await supabase
      .from("goals" as any)
      .select("*")
      .eq("id", goalId)
      .eq("user_id", user.id)
      .single();
    setGoal((data as unknown as Goal) || null);
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
    // Get all target ids for this goal first
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

    // Insert update log
    await supabase.from("goal_target_updates" as any).insert({
      target_id: target.id,
      user_id: user.id,
      previous_value: previousValue,
      new_value: newValue,
      note: updateNote.trim() || null,
    });

    // Update target current_value + is_done
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

  return (
    <ProjectLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Breadcrumb */}
          <button
            onClick={() => navigate("/goals")}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Goals
          </button>

          {/* Goal header */}
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="h-1.5" style={{ backgroundColor: goal.color }} />
            <div className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-semibold text-foreground">
                      {goal.title}
                    </h1>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                      {goal.category}
                    </span>
                    {goal.status === "completed" && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                        Completed ✓
                      </span>
                    )}
                  </div>
                  {goal.why_statement && (
                    <p className="text-sm text-muted-foreground italic">
                      "{goal.why_statement}"
                    </p>
                  )}
                </div>

                {/* Progress ring */}
                <div className="relative w-14 h-14 shrink-0">
                  <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      fill="none"
                      stroke="hsl(var(--muted))"
                      strokeWidth="4"
                    />
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${overallProgress * 1.508} 150.8`}
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-foreground">
                    {overallProgress}%
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>
                  {doneTargets}/{totalTargets} targets complete
                </span>
                {daysLeft !== null && (
                  <span
                    className={cn(
                      "flex items-center gap-1",
                      isOverdue && "text-destructive"
                    )}
                  >
                    <CalendarDays className="w-3 h-3" />
                    {isOverdue
                      ? `${Math.abs(daysLeft)}d overdue`
                      : daysLeft === 0
                      ? "Due today"
                      : `${daysLeft}d left`}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Targets */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Target className="w-4 h-4" />
              Targets
            </h2>

            {targets.length === 0 && (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No targets yet. Edit this goal to add measurable targets.
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
                  className="rounded-xl border border-border bg-card overflow-hidden"
                >
                  <button
                    onClick={() =>
                      setExpandedTarget(isExpanded ? null : target.id)
                    }
                    className="w-full text-left p-4 flex items-center gap-3 hover:bg-muted/30 transition-colors"
                  >
                    {target.is_done ? (
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    ) : (
                      <Circle className="w-5 h-5 text-muted-foreground/40 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            "font-medium text-sm",
                            target.is_done &&
                              "line-through text-muted-foreground"
                          )}
                        >
                          {target.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground flex items-center gap-1">
                          <Icon className="w-2.5 h-2.5" />
                          {TYPE_LABELS[target.target_type]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <div className="w-full max-w-[200px] h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              target.is_done ? "bg-primary" : "bg-primary/60"
                            )}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                          {target.target_type === "true_false" ? (
                            target.is_done ? "Done" : "Not done"
                          ) : (
                            <>
                              {target.target_type === "currency" ? "$" : ""}
                              {Number(target.current_value).toLocaleString()}
                              {target.unit ? ` ${target.unit}` : ""} /{" "}
                              {target.target_type === "currency" ? "$" : ""}
                              {Number(target.target_value).toLocaleString()}
                            </>
                          )}
                        </span>
                      </div>
                    </div>
                    <TrendingUp className="w-4 h-4 text-muted-foreground shrink-0" />
                  </button>

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
