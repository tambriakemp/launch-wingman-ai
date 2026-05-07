import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ProductivityGauge } from "@/components/habits/ProductivityGauge";
import { ChevronLeft, Flame, TrendingUp } from "lucide-react";
import { format, eachDayOfInterval, subDays, startOfDay } from "date-fns";
import { cn } from "@/lib/utils";
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

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: h }, { data: c }] = await Promise.all([
        supabase.from("habits" as any).select("*").eq("user_id", user.id).eq("is_archived", false),
        supabase.from("habit_completions" as any).select("*").eq("user_id", user.id),
      ]);
      setHabits((h as unknown as Habit[]) || []);
      setCompletions((c as unknown as HabitCompletion[]) || []);
    })();
  }, [user]);

  const today = startOfDay(new Date());
  const todayStr = format(today, "yyyy-MM-dd");

  const todaysHabits = useMemo(() => habits.filter(h => isHabitScheduledOn(h, today)), [habits]);
  const todayDone = todaysHabits.filter(h =>
    completions.some(c => c.habit_id === h.id && c.completed_date === todayStr)
  ).length;
  const productivity = todaysHabits.length > 0 ? (todayDone / todaysHabits.length) * 100 : 0;

  // Best current streak across all habits
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
            {/* Productivity */}
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
                      <div
                        className="w-full bg-primary transition-all"
                        style={{ height: `${Math.max(rate, 3)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground uppercase">{format(date, "EEEEE")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Streaks */}
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
                // 30-day rate
                const days30 = eachDayOfInterval({ start: subDays(today, 29), end: today });
                const scheduled = days30.filter(d => isHabitScheduledOn(habit, d));
                const done = scheduled.filter(d =>
                  completions.some(c => c.habit_id === habit.id && c.completed_date === format(d, "yyyy-MM-dd"))
                ).length;
                const rate = scheduled.length ? Math.round((done / scheduled.length) * 100) : 0;
                return (
                  <div key={habit.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                    <div
                      className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center"
                      style={{ background: `${habit.color}20` }}
                    >
                      <div className="w-4 h-4 rounded-full" style={{ background: habit.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{habit.name}</p>
                      <p className="text-xs text-muted-foreground">{habit.category}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="flex items-center gap-1 text-xs font-semibold text-primary">
                        <Flame className="w-3.5 h-3.5" />
                        {streak}
                      </div>
                      <span className={cn("text-xs font-semibold tabular-nums", rate >= 70 ? "text-primary" : "text-muted-foreground")}>
                        {rate}%
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </TabsContent>
        </Tabs>
      </div>
    </ProjectLayout>
  );
};

export default HabitStats;
