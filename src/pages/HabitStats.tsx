import { useEffect, useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ProductivityGauge } from "@/components/habits/ProductivityGauge";
import { HabitDetailSheet } from "@/components/habits/HabitDetailSheet";
import { HabitStatsRow } from "@/components/habits/HabitStatsRow";
import { DeleteConfirmDialog } from "@/components/ui/delete-confirm-dialog";
import { ChevronLeft, Flame, TrendingUp, Plus } from "lucide-react";
import { format, eachDayOfInterval, subDays, startOfDay } from "date-fns";
import { toast } from "sonner";
import type { Habit, HabitCompletion } from "@/pages/HabitTracker";

const WEEKDAY_MAP = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];
function isHabitScheduledOn(habit: Habit, date: Date): boolean {
  const dow = WEEKDAY_MAP[date.getDay()];
  if (habit.frequency === "daily") return true;
  if (habit.frequency === "weekdays") return !["SA", "SU"].includes(dow);
  if (habit.frequency === "weekends") return ["SA", "SU"].includes(dow);
  if (habit.frequency === "custom") return (habit.frequency_days || []).includes(dow);
  return true;
}

const HabitStats = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeHabit, setActiveHabit] = useState<Habit | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    const [{ data: h }, { data: c }] = await Promise.all([
      supabase.from("habits" as any).select("*").eq("user_id", user.id).eq("is_archived", false),
      supabase.from("habit_completions" as any).select("*").eq("user_id", user.id),
    ]);
    setHabits((h as unknown as Habit[]) || []);
    setCompletions((c as unknown as HabitCompletion[]) || []);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const handleSaveHabit = async (data: Partial<Habit>) => {
    if (!user) return;
    if (activeHabit) {
      const { error } = await supabase.from("habits" as any).update({
        name: data.name,
        description: data.description ?? null,
        category: data.category,
        color: data.color,
        icon: data.icon ?? "circle",
        frequency: data.frequency,
        frequency_days: data.frequency_days ?? null,
        time_of_day: data.time_of_day ?? [],
        duration_minutes: data.duration_minutes ?? null,
        reminder_times: data.reminder_times ?? [],
        notes: data.notes ?? null,
      }).eq("id", activeHabit.id);
      if (error) { toast.error("Failed to update habit"); return; }
      toast.success("Habit updated");
    } else {
      const { error } = await supabase.from("habits" as any).insert({
        user_id: user.id,
        name: data.name!,
        description: data.description ?? null,
        category: data.category || "personal",
        color: data.color || "#0ea572",
        icon: data.icon || "circle",
        frequency: data.frequency || "daily",
        frequency_days: data.frequency_days ?? null,
        time_of_day: data.time_of_day ?? [],
        duration_minutes: data.duration_minutes ?? null,
        reminder_times: data.reminder_times ?? [],
        notes: data.notes ?? null,
      });
      if (error) { toast.error("Failed to create habit"); return; }
      toast.success("Habit created");
    }
    fetchAll();
  };

  const handleArchiveHabit = async (habitId: string) => {
    await supabase.from("habits" as any).update({ is_archived: true }).eq("id", habitId);
    toast.success("Habit deleted");
    setSheetOpen(false);
    setActiveHabit(null);
    fetchAll();
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    await handleArchiveHabit(deleteId);
    setDeleteId(null);
  };

  const today = startOfDay(new Date());
  const todayStr = format(today, "yyyy-MM-dd");

  const todaysHabits = useMemo(() => habits.filter(h => isHabitScheduledOn(h, today)), [habits]);
  const todayDone = todaysHabits.filter(h =>
    completions.some(c => c.habit_id === h.id && c.completed_date === todayStr)
  ).length;
  const productivity = todaysHabits.length > 0 ? (todayDone / todaysHabits.length) * 100 : 0;

  const streaks = habits.map(h => {
    const dates = new Set(completions.filter(c => c.habit_id === h.id).map(c => c.completed_date));
    let streak = 0;
    let checkDate = new Date();
    while (true) {
      const d = format(checkDate, "yyyy-MM-dd");
      if (dates.has(d)) {
        streak++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      } else {
        if (streak === 0 && d === todayStr) {
          checkDate = new Date(checkDate.getTime() - 86400000);
          continue;
        }
        break;
      }
    }
    return { habit: h, streak };
  });
  const bestStreak = streaks.reduce((m, s) => Math.max(m, s.streak), 0);

  const last7 = eachDayOfInterval({ start: subDays(today, 6), end: today });
  const last7Rates = last7.map(d => {
    const ds = format(d, "yyyy-MM-dd");
    const scheduled = habits.filter(h => isHabitScheduledOn(h, d));
    const done = scheduled.filter(h => completions.some(c => c.habit_id === h.id && c.completed_date === ds)).length;
    return { date: d, rate: scheduled.length ? (done / scheduled.length) * 100 : 0, done, total: scheduled.length };
  });

  const motivationCopy = productivity >= 80
    ? "Crushing it. Keep that momentum going!"
    : productivity >= 50
      ? "Halfway there — finish strong today."
      : productivity > 0
        ? "Nice start. A couple more and you're golden."
        : "Tap a habit to mark it done and start your day.";

  return (
    <ProjectLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-32 space-y-5">
        {/* Header */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigate("/habits")} aria-label="Back">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-xl font-semibold">Statistics</h1>
        </div>

        <Tabs defaultValue="summary">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="habits">Habits</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="space-y-4 pt-4">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-foreground">Today's productivity</h2>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex flex-col items-center pt-2">
                <ProductivityGauge value={productivity} label="completed" />
                <p className="text-sm text-muted-foreground mt-3 text-center max-w-xs">{motivationCopy}</p>
              </div>
              <div className="grid grid-cols-7 gap-1.5 mt-6">
                {last7Rates.map(({ date, rate }) => (
                  <div key={date.toISOString()} className="flex flex-col items-center gap-1">
                    <div className="h-16 w-full bg-muted rounded-md overflow-hidden flex items-end">
                      <div className="w-full bg-primary transition-all" style={{ height: `${Math.max(rate, 3)}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase">{format(date, "EEEEE")}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h2 className="text-sm font-semibold text-foreground mb-3">Streaks</h2>
              <div className="flex flex-col items-center text-center py-4">
                <Flame className="w-6 h-6 text-primary mb-1" />
                <p className="text-4xl font-bold tabular-nums">{bestStreak}</p>
                <p className="text-xs text-muted-foreground">{bestStreak === 1 ? "Day" : "Days"} best current streak</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="habits" className="space-y-2 pt-4">
            {streaks.length === 0 ? (
              <div className="text-center py-12 text-sm text-muted-foreground">No habits to show.</div>
            ) : (
              streaks.map(({ habit, streak }) => {
                const days30 = eachDayOfInterval({ start: subDays(today, 29), end: today });
                const scheduled = days30.filter(d => isHabitScheduledOn(habit, d));
                const done = scheduled.filter(d =>
                  completions.some(c => c.habit_id === habit.id && c.completed_date === format(d, "yyyy-MM-dd"))
                ).length;
                const rate = scheduled.length ? Math.round((done / scheduled.length) * 100) : 0;
                return (
                  <HabitStatsRow
                    key={habit.id}
                    habit={habit}
                    streak={streak}
                    rate={rate}
                    onEdit={() => { setActiveHabit(habit); setSheetOpen(true); }}
                    onDelete={() => setDeleteId(habit.id)}
                  />
                );
              })
            )}

            {/* Floating add button — sticky inside content column, centered */}
            <div className="sticky bottom-[50px] z-30 flex justify-center pointer-events-none -mt-14">
              <button
                onClick={() => { setActiveHabit(null); setSheetOpen(true); }}
                className="pointer-events-auto w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
                aria-label="New habit"
              >
                <Plus className="w-6 h-6" />
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <HabitDetailSheet
        open={sheetOpen}
        onOpenChange={(o) => { setSheetOpen(o); if (!o) setActiveHabit(null); }}
        habit={activeHabit}
        completions={completions}
        onSubmit={handleSaveHabit}
        onArchive={handleArchiveHabit}
      />

      <DeleteConfirmDialog
        open={!!deleteId}
        onOpenChange={(o) => { if (!o) setDeleteId(null); }}
        onConfirm={confirmDelete}
        title="Delete habit?"
        description="This will remove the habit from your tracker. Type DELETE to confirm."
      />
    </ProjectLayout>
  );
};

export default HabitStats;
