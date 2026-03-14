import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { GoalCard } from "@/components/goals/GoalCard";
import { GoalDialog } from "@/components/goals/GoalDialog";
import { Plus, Target, Trophy, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  color: string;
  why_statement: string | null;
  target_date: string | null;
  status: string;
  quarter: string | null;
  created_at: string;
}

export interface GoalMilestone {
  id: string;
  goal_id: string;
  title: string;
  is_done: boolean;
  due_date: string | null;
  position: number;
}

const CATEGORY_COLORS: Record<string, string> = {
  business: "#f5c842",
  personal: "#0ea572",
  health: "#f43f5e",
  finance: "#8b5cf6",
  relationships: "#3b82f6",
  mindset: "#f97316",
};

const Goals = () => {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [milestones, setMilestones] = useState<GoalMilestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("active");

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("goals" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setGoals((data as unknown as Goal[]) || []);
    setIsLoading(false);
  }, [user]);

  const fetchMilestones = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("goal_milestones" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("position", { ascending: true });
    setMilestones((data as unknown as GoalMilestone[]) || []);
  }, [user]);

  useEffect(() => {
    fetchGoals();
    fetchMilestones();
  }, [fetchGoals, fetchMilestones]);

  const handleCreateGoal = async (data: Partial<Goal>, newMilestones: Partial<GoalMilestone>[]) => {
    if (!user) return;
    const { data: created, error } = await supabase
      .from("goals" as any)
      .insert({
        user_id: user.id,
        title: data.title!,
        description: data.description || null,
        category: data.category || "business",
        color: CATEGORY_COLORS[data.category || "business"] || "#f5c842",
        why_statement: data.why_statement || null,
        target_date: data.target_date || null,
        status: "active",
        quarter: data.quarter || null,
      })
      .select()
      .single();
    if (error) {
      toast.error("Failed to create goal");
      return;
    }
    if (newMilestones.length > 0 && created) {
      await supabase.from("goal_milestones" as any).insert(
        newMilestones.map((m, i) => ({
          goal_id: (created as any).id,
          user_id: user.id,
          title: m.title!,
          position: i,
        }))
      );
    }
    toast.success("Goal created");
    fetchGoals();
    fetchMilestones();
  };

  const handleUpdateGoal = async (data: Partial<Goal>, updatedMilestones: Partial<GoalMilestone>[]) => {
    if (!editingGoal || !user) return;
    await supabase
      .from("goals" as any)
      .update({
        title: data.title,
        description: data.description || null,
        category: data.category,
        color: CATEGORY_COLORS[data.category || "business"] || editingGoal.color,
        why_statement: data.why_statement || null,
        target_date: data.target_date || null,
        quarter: data.quarter || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", editingGoal.id);
    await supabase.from("goal_milestones" as any).delete().eq("goal_id", editingGoal.id);
    if (updatedMilestones.length > 0) {
      await supabase.from("goal_milestones" as any).insert(
        updatedMilestones.map((m, i) => ({
          goal_id: editingGoal.id,
          user_id: user.id,
          title: m.title!,
          is_done: m.is_done || false,
          position: i,
        }))
      );
    }
    toast.success("Goal updated");
    setEditingGoal(null);
    fetchGoals();
    fetchMilestones();
  };

  const handleToggleMilestone = async (milestoneId: string, isDone: boolean) => {
    await supabase.from("goal_milestones" as any).update({ is_done: !isDone }).eq("id", milestoneId);
    setMilestones((prev) =>
      prev.map((m) => (m.id === milestoneId ? { ...m, is_done: !isDone } : m))
    );
  };

  const handleCompleteGoal = async (goalId: string) => {
    await supabase
      .from("goals" as any)
      .update({ status: "completed", updated_at: new Date().toISOString() })
      .eq("id", goalId);
    toast.success("🎉 Goal completed!");
    fetchGoals();
  };

  const handleArchiveGoal = async (goalId: string) => {
    await supabase.from("goals" as any).update({ status: "archived" }).eq("id", goalId);
    fetchGoals();
  };

  const filteredGoals = useMemo(() => {
    return goals.filter((g) => {
      if (filterStatus !== "all" && g.status !== filterStatus) return false;
      if (filterCategory !== "all" && g.category !== filterCategory) return false;
      return true;
    });
  }, [goals, filterCategory, filterStatus]);

  const activeGoals = goals.filter((g) => g.status === "active").length;
  const completedGoals = goals.filter((g) => g.status === "completed").length;
  const currentQuarter = `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`;

  return (
    <ProjectLayout>
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Goals</h1>
              <p className="text-sm text-muted-foreground mt-1">
                90-day sprints. Big picture. Stay on track.
              </p>
            </div>
            <Button
              onClick={() => {
                setEditingGoal(null);
                setDialogOpen(true);
              }}
              className="gap-2"
            >
              <Plus className="w-4 h-4" /> New Goal
            </Button>
          </div>

          {/* Stats */}
          {goals.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Active</p>
                  <p className="text-lg font-semibold text-foreground">
                    {activeGoals} goal{activeGoals !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-lg font-semibold text-foreground">
                    {completedGoals} goal{completedGoals !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-card p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Current Sprint</p>
                  <p className="text-lg font-semibold text-foreground">{currentQuarter}</p>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          {goals.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5">
              {["active", "completed", "all"].map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={cn(
                    "text-xs px-2.5 py-1 rounded-full border transition-colors capitalize",
                    filterStatus === s
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {s === "all" ? "All" : s}
                </button>
              ))}
              <div className="w-px h-4 bg-border mx-1" />
              {["all", "business", "personal", "health", "finance", "mindset"].map((c) => (
                <button
                  key={c}
                  onClick={() => setFilterCategory(c)}
                  className={cn(
                    "text-xs px-3 py-1.5 rounded-full border transition-colors capitalize",
                    filterCategory === c
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {c === "all" ? "All Categories" : c}
                </button>
              ))}
            </div>
          )}

          {/* Empty state */}
          {goals.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Target className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground">No goals yet</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                Set your first goal and break it into milestones. Your 90-day sprint starts here.
              </p>
              <Button onClick={() => setDialogOpen(true)} className="gap-2 mt-4">
                <Plus className="w-4 h-4" /> Create First Goal
              </Button>
            </div>
          )}

          {/* Goal cards */}
          <div className="space-y-4">
            {filteredGoals.map((goal) => (
              <GoalCard
                key={goal.id}
                goal={goal}
                milestones={milestones.filter((m) => m.goal_id === goal.id)}
                onEdit={() => {
                  setEditingGoal(goal);
                  setDialogOpen(true);
                }}
                onToggleMilestone={handleToggleMilestone}
                onComplete={() => handleCompleteGoal(goal.id)}
                onArchive={() => handleArchiveGoal(goal.id)}
              />
            ))}
          </div>
        </div>
      </div>

      <GoalDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingGoal(null);
        }}
        onSubmit={editingGoal ? handleUpdateGoal : handleCreateGoal}
        editGoal={editingGoal}
        existingMilestones={
          editingGoal ? milestones.filter((m) => m.goal_id === editingGoal.id) : []
        }
      />
    </ProjectLayout>
  );
};

export default Goals;
