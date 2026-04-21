import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { HabitGrid } from "@/components/habits/HabitGrid";
import { HabitDialog } from "@/components/habits/HabitDialog";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, subMonths, addMonths } from "date-fns";
import { Plus, ChevronLeft, ChevronRight, Flame, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  category: string;
  color: string;
  icon: string;
  frequency: string;
  frequency_days: string[] | null;
  target_per_week: number | null;
  is_archived: boolean;
  created_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  completed_date: string;
  note: string | null;
}

const HabitTracker = () => {
  const { user } = useAuth();
  const userId = user?.id;
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const fetchHabits = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from("habits" as any)
      .select("*")
      .eq("user_id", userId)
      .eq("is_archived", false)
      .order("created_at", { ascending: true });
    setHabits((data as unknown as Habit[]) || []);
  }, [userId]);

  const fetchCompletions = useCallback(async () => {
    if (!userId) return;
    const monthStart = format(startOfMonth(currentMonth), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(currentMonth), "yyyy-MM-dd");
    const { data } = await supabase
      .from("habit_completions" as any)
      .select("*")
      .eq("user_id", userId)
      .gte("completed_date", monthStart)
      .lte("completed_date", monthEnd);
    setCompletions((data as unknown as HabitCompletion[]) || []);
    setIsLoading(false);
  }, [userId, currentMonth]);

  useEffect(() => { fetchHabits(); }, [fetchHabits]);
  useEffect(() => { fetchCompletions(); }, [fetchCompletions]);

  const toggleCompletion = async (habitId: string, date: string) => {
    if (!userId) return;
    const existing = completions.find(c => c.habit_id === habitId && c.completed_date === date);
    if (existing) {
      await supabase.from("habit_completions" as any).delete().eq("id", existing.id);
      setCompletions(prev => prev.filter(c => c.id !== existing.id));
    } else {
      const { data } = await supabase.from("habit_completions" as any).insert({
        habit_id: habitId,
        user_id: userId,
        completed_date: date,
      }).select().single();
      if (data) setCompletions(prev => [...prev, data as unknown as HabitCompletion]);
    }
  };

  const handleCreateHabit = async (habitData: Partial<Habit>) => {
    if (!userId) return;
    const { error } = await supabase.from("habits" as any).insert({
      user_id: userId,
      name: habitData.name!,
      description: habitData.description || null,
      category: habitData.category || "personal",
      color: habitData.color || "#0ea572",
      icon: habitData.icon || "circle",
      frequency: habitData.frequency || "daily",
      frequency_days: habitData.frequency_days || null,
      target_per_week: habitData.target_per_week || null,
    });
    if (error) { toast.error("Failed to create habit"); return; }
    toast.success("Habit created");
    fetchHabits();
  };

  const handleUpdateHabit = async (habitData: Partial<Habit>) => {
    if (!editingHabit) return;
    const { error } = await supabase.from("habits" as any).update({
      name: habitData.name,
      description: habitData.description || null,
      category: habitData.category,
      color: habitData.color,
      icon: habitData.icon,
      frequency: habitData.frequency,
      frequency_days: habitData.frequency_days || null,
      target_per_week: habitData.target_per_week || null,
    }).eq("id", editingHabit.id);
    if (error) { toast.error("Failed to update habit"); return; }
    toast.success("Habit updated");
    setEditingHabit(null);
    fetchHabits();
  };

  const handleArchiveHabit = async (habitId: string) => {
    await supabase.from("habits" as any).update({ is_archived: true }).eq("id", habitId);
    toast.success("Habit archived");
    fetchHabits();
  };

  const monthDays = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
  const today = format(new Date(), "yyyy-MM-dd");
  const isCurrentMonth = format(currentMonth, "yyyy-MM") === format(new Date(), "yyyy-MM");

  const stats = useMemo(() => {
    if (habits.length === 0) return { todayDone: 0, todayTotal: 0, bestStreak: 0, monthRate: 0 };

    const todayDone = habits.filter(h =>
      completions.some(c => c.habit_id === h.id && c.completed_date === today)
    ).length;

    let bestStreak = 0;
    for (const habit of habits) {
      const habitDates = new Set(
        completions.filter(c => c.habit_id === habit.id).map(c => c.completed_date)
      );
      let streak = 0;
      let checkDate = new Date();
      while (true) {
        const d = format(checkDate, "yyyy-MM-dd");
        if (habitDates.has(d)) {
          streak++;
          checkDate = new Date(checkDate.getTime() - 86400000);
        } else break;
      }
      if (streak > bestStreak) bestStreak = streak;
    }

    const pastDays = monthDays.filter(d => format(d, "yyyy-MM-dd") <= today);
    const possible = pastDays.length * habits.length;
    const done = completions.length;
    const monthRate = possible > 0 ? Math.round((done / possible) * 100) : 0;

    return { todayDone, todayTotal: habits.length, bestStreak, monthRate };
  }, [habits, completions, today, monthDays]);

  return (
    <ProjectLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="p-3 bg-orange-100/50 dark:bg-orange-900/20 rounded-xl shrink-0">
            <Flame className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-semibold text-foreground">Habit Tracker</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">Build consistency, one day at a time.</p>
              </div>
              <Button onClick={() => { setEditingHabit(null); setDialogOpen(true); }} className="gap-2 shrink-0">
                <Plus className="w-4 h-4" />
                New Habit
              </Button>
            </div>
          </div>
        </div>

        {/* Stats row */}
        {habits.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Target className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Today</p>
                <p className="text-sm font-semibold text-foreground">{stats.todayDone} / {stats.todayTotal} done</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Flame className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Best Streak</p>
                <p className="text-sm font-semibold text-foreground">{stats.bestStreak} day{stats.bestStreak !== 1 ? "s" : ""}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-4">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">This Month</p>
                <p className="text-sm font-semibold text-foreground">{stats.monthRate}% complete</p>
              </div>
            </div>
          </div>
        )}

        {/* Month nav + grid */}
        <div className="space-y-4">
          {/* Month navigation */}
          <div className="flex items-center gap-3">
            <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-foreground min-w-[140px] text-center">{format(currentMonth, "MMMM yyyy")}</span>
            <button
              onClick={() => setCurrentMonth(m => addMonths(m, 1))}
              disabled={isCurrentMonth}
              className={cn("p-1.5 rounded-lg hover:bg-accent transition-colors", isCurrentMonth && "opacity-30 pointer-events-none")}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {habits.length === 0 && !isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Flame className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">No habits yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs mb-4">
                Create your first habit to start tracking your daily consistency.
              </p>
              <Button onClick={() => setDialogOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" /> Create First Habit
              </Button>
            </div>
          ) : (
            <HabitGrid
              habits={habits}
              completions={completions}
              currentMonth={currentMonth}
              onToggle={toggleCompletion}
              onEdit={(habit) => { setEditingHabit(habit); setDialogOpen(true); }}
              onArchive={handleArchiveHabit}
              isLoading={isLoading}
            />
          )}
        </div>
      </div>

      <HabitDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditingHabit(null); }}
        onSubmit={editingHabit ? handleUpdateHabit : handleCreateHabit}
        editHabit={editingHabit}
      />
    </ProjectLayout>
  );
};

export default HabitTracker;
