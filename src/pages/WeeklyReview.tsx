import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import {
  format, startOfWeek, endOfWeek, subWeeks, addWeeks,
  parseISO, eachDayOfInterval, isSameWeek
} from "date-fns";
import {
  ChevronLeft, ChevronRight, CheckCircle2, Trophy,
  Flame, Target, TrendingUp, Star, BarChart2,
  Lightbulb, ArrowRight, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea";

interface WeeklyReviewData {
  wins: string;
  lessons: string;
  didnt_finish: string;
  next_week_focus: string;
  next_week_priorities: string;
  energy_level: number | null;
  overall_rating: number | null;
}

interface CompletedTask { id: string; title: string; category: string | null; }
interface OverdueTask { id: string; title: string; due_at: string | null; }
interface HabitStat { id: string; name: string; color: string; daysCompleted: number; totalDays: number; }
interface GoalStat { id: string; title: string; color: string; category: string; milestonesTotal: number; milestonesDone: number; }

const EMPTY_REVIEW: WeeklyReviewData = {
  wins: "", lessons: "", didnt_finish: "",
  next_week_focus: "", next_week_priorities: "",
  energy_level: null, overall_rating: null,
};

const ENERGY_LABELS = ["", "Drained", "Low", "Okay", "Good", "Energized"];
const RATING_LABELS = ["", "Rough", "Below avg", "Average", "Good", "Great week"];

const WeeklyReview = () => {
  const { user } = useAuth();
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [review, setReview] = useState<WeeklyReviewData>(EMPTY_REVIEW);
  const [completedTasks, setCompletedTasks] = useState<CompletedTask[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<OverdueTask[]>([]);
  const [habitStats, setHabitStats] = useState<HabitStat[]>([]);
  const [goalStats, setGoalStats] = useState<GoalStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const weekStartStr = format(currentWeekStart, "yyyy-MM-dd");
  const weekEndStr = format(weekEnd, "yyyy-MM-dd");
  const isCurrentWeek = isSameWeek(currentWeekStart, new Date(), { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: currentWeekStart, end: weekEnd });

  const loadData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);

    const { data: reviewData } = await supabase
      .from("weekly_reviews" as any)
      .select("*")
      .eq("user_id", user.id)
      .eq("week_start", weekStartStr)
      .maybeSingle();

    if (reviewData) {
      const r = reviewData as any;
      setReview({
        wins: r.wins || "",
        lessons: r.lessons || "",
        didnt_finish: r.didnt_finish || "",
        next_week_focus: r.next_week_focus || "",
        next_week_priorities: r.next_week_priorities || "",
        energy_level: r.energy_level ?? null,
        overall_rating: r.overall_rating ?? null,
      });
    } else {
      setReview(EMPTY_REVIEW);
    }

    const { data: doneTasks } = await supabase
      .from("tasks")
      .select("id, title, category")
      .eq("user_id", user.id)
      .eq("task_scope", "planner")
      .eq("column_id", "done")
      .gte("updated_at", currentWeekStart.toISOString())
      .lte("updated_at", weekEnd.toISOString());
    setCompletedTasks((doneTasks || []) as CompletedTask[]);

    const { data: overdue } = await supabase
      .from("tasks")
      .select("id, title, due_at")
      .eq("user_id", user.id)
      .eq("task_scope", "planner")
      .neq("column_id", "done")
      .lt("due_at", weekStartStr)
      .not("due_at", "is", null)
      .order("due_at", { ascending: true })
      .limit(10);
    setOverdueTasks((overdue || []) as OverdueTask[]);

    const { data: habits } = await supabase
      .from("habits" as any)
      .select("id, name, color")
      .eq("user_id", user.id)
      .eq("is_archived", false);

    const { data: completions } = await supabase
      .from("habit_completions" as any)
      .select("habit_id, completed_date")
      .eq("user_id", user.id)
      .gte("completed_date", weekStartStr)
      .lte("completed_date", weekEndStr);

    const today = format(new Date(), "yyyy-MM-dd");
    const pastWeekDays = weekDays.filter(d => format(d, "yyyy-MM-dd") <= today);
    const totalDays = pastWeekDays.length;

    const stats: HabitStat[] = ((habits || []) as any[]).map(h => ({
      id: h.id,
      name: h.name,
      color: h.color,
      daysCompleted: (completions || []).filter((c: any) => c.habit_id === h.id).length,
      totalDays,
    }));
    setHabitStats(stats);

    const { data: goals } = await supabase
      .from("goals" as any)
      .select("id, title, color, category")
      .eq("user_id", user.id)
      .eq("status", "active");

    const { data: milestones } = await supabase
      .from("goal_milestones" as any)
      .select("goal_id, is_done")
      .eq("user_id", user.id);

    const goalStatsList: GoalStat[] = ((goals || []) as any[]).map(g => {
      const gMilestones = (milestones || []).filter((m: any) => m.goal_id === g.id);
      return {
        id: g.id,
        title: g.title,
        color: g.color,
        category: g.category,
        milestonesTotal: gMilestones.length,
        milestonesDone: gMilestones.filter((m: any) => m.is_done).length,
      };
    });
    setGoalStats(goalStatsList);

    setIsLoading(false);
  }, [user, weekStartStr]);

  useEffect(() => { loadData(); }, [loadData]);

  const saveReviewDebounced = useCallback((updated: WeeklyReviewData) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      if (!user) return;
      setIsSaving(true);
      await supabase.from("weekly_reviews" as any).upsert({
        user_id: user.id,
        week_start: weekStartStr,
        wins: updated.wins || null,
        lessons: updated.lessons || null,
        didnt_finish: updated.didnt_finish || null,
        next_week_focus: updated.next_week_focus || null,
        next_week_priorities: updated.next_week_priorities || null,
        energy_level: updated.energy_level,
        overall_rating: updated.overall_rating,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,week_start" });
      setIsSaving(false);
    }, 800);
  }, [user, weekStartStr]);

  const updateReview = (updates: Partial<WeeklyReviewData>) => {
    const updated = { ...review, ...updates };
    setReview(updated);
    saveReviewDebounced(updated);
  };

  const topHabits = useMemo(() =>
    [...habitStats].sort((a, b) =>
      (b.daysCompleted / Math.max(b.totalDays, 1)) - (a.daysCompleted / Math.max(a.totalDays, 1))
    ).slice(0, 5),
    [habitStats]
  );

  const overallHabitRate = useMemo(() => {
    if (habitStats.length === 0) return 0;
    const total = habitStats.reduce((sum, h) => sum + h.totalDays, 0);
    const done = habitStats.reduce((sum, h) => sum + h.daysCompleted, 0);
    return total > 0 ? Math.round((done / total) * 100) : 0;
  }, [habitStats]);

  if (isLoading) {
    return (
      <ProjectLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </ProjectLayout>
    );
  }

  return (
    <ProjectLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-6 sm:py-8 pb-16">
        {/* Page header */}
        <div className="flex items-start gap-4 mb-6">
          <div className="p-3 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-xl shrink-0">
            <RefreshCw className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Weekly Review</h1>
            <p className="text-sm text-muted-foreground hidden sm:block">Reflect on your week, celebrate wins, and plan ahead.</p>
          </div>
        </div>

        <div className="space-y-8">

          {/* Date nav */}
          <div className="flex items-center justify-between">
            <button onClick={() => setCurrentWeekStart(w => subWeeks(w, 1))}
              className="p-2 rounded-lg hover:bg-accent transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
            <div className="text-center">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {isCurrentWeek ? "This Week" : "Week of"}
              </p>
              <p className="text-lg font-bold text-foreground">
                {format(currentWeekStart, "MMM d")} – {format(weekEnd, "MMM d, yyyy")}
              </p>
              {!isCurrentWeek && (
                <button onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                  className="text-xs text-primary hover:underline mt-1">
                  Back to this week
                </button>
              )}
            </div>
            <button onClick={() => setCurrentWeekStart(w => addWeeks(w, 1))}
              disabled={isCurrentWeek}
              className={cn("p-2 rounded-lg hover:bg-accent transition-colors", isCurrentWeek && "opacity-20 pointer-events-none")}>
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {isSaving && <p className="text-xs text-muted-foreground text-center animate-pulse">Saving...</p>}

          {/* ── AUTO-POPULATED SECTION ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">This Week at a Glance</h2>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-2 mb-6">
            <div className="rounded-xl border border-border bg-card px-3 py-2.5 text-center">
              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-primary" />
              <p className="text-xl sm:text-2xl font-bold text-foreground">{completedTasks.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Tasks done</p>
            </div>
            <div className="rounded-xl border border-border bg-card px-3 py-2.5 text-center">
              <Flame className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-orange-500" />
              <p className="text-xl sm:text-2xl font-bold text-foreground">{overallHabitRate}%</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Habit rate</p>
            </div>
            <div className="rounded-xl border border-border bg-card px-3 py-2.5 text-center">
              <Target className="w-4 h-4 sm:w-5 sm:h-5 mx-auto mb-1 text-primary" />
              <p className="text-xl sm:text-2xl font-bold text-foreground">{goalStats.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Active goals</p>
            </div>
          </div>

          {/* Completed tasks */}
          {completedTasks.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5" />
                Completed ({completedTasks.length})
              </p>
              <div className="space-y-1.5">
                {completedTasks.map(task => (
                  <div key={task.id} className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="text-foreground">{task.title}</span>
                    {task.category && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{task.category}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Habit performance */}
          {topHabits.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" />
                Habit Performance
              </p>
              <div className="space-y-2.5">
                {topHabits.map(h => {
                  const rate = h.totalDays > 0 ? Math.round((h.daysCompleted / h.totalDays) * 100) : 0;
                  return (
                    <div key={h.id} className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: h.color }} />
                      <span className="text-sm text-foreground flex-1">{h.name}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${rate}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground w-8 text-right">
                          {h.daysCompleted}/{h.totalDays}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Goal progress */}
          {goalStats.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                Goal Progress
              </p>
              <div className="space-y-2.5">
                {goalStats.map(g => {
                  const rate = g.milestonesTotal > 0 ? Math.round((g.milestonesDone / g.milestonesTotal) * 100) : 0;
                  return (
                    <div key={g.id} className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: g.color }} />
                      <span className="text-sm text-foreground flex-1">{g.title}</span>
                      {g.milestonesTotal > 0 ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${rate}%` }} />
                          </div>
                          <span className="text-[10px] text-muted-foreground w-8 text-right">
                            {g.milestonesDone}/{g.milestonesTotal}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">No milestones</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Carry-forward: didn't finish */}
          {overdueTasks.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                Rolled Over ({overdueTasks.length})
              </p>
              <div className="space-y-1.5">
                {overdueTasks.slice(0, 5).map(task => (
                  <div key={task.id} className="flex items-center gap-2 text-sm">
                    <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-foreground">{task.title}</span>
                    {task.due_at && (
                      <span className="text-[10px] text-destructive ml-auto shrink-0">
                        Due {format(parseISO(task.due_at), "MMM d")}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <hr className="border-border" />

          {/* ── RATINGS ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Rate Your Week</h2>
            </div>
            <div className="space-y-5">
              {/* Energy level */}
              <div>
                <p className="text-sm font-semibold mb-1">Energy Level</p>
                <p className="text-xs text-muted-foreground italic mb-2">How did you feel overall?</p>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => updateReview({ energy_level: review.energy_level === n ? null : n })}
                      className={cn("flex-1 py-2 rounded-lg border text-xs font-semibold transition-all",
                        review.energy_level === n
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      )}>
                      {n}
                    </button>
                  ))}
                </div>
                {review.energy_level && (
                  <p className="text-xs text-muted-foreground mt-1 text-center">{ENERGY_LABELS[review.energy_level]}</p>
                )}
              </div>
              {/* Overall rating */}
              <div>
                <p className="text-sm font-semibold mb-1">Overall Rating</p>
                <p className="text-xs text-muted-foreground italic mb-2">How was the week as a whole?</p>
                <div className="flex gap-2">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} onClick={() => updateReview({ overall_rating: review.overall_rating === n ? null : n })}
                      className={cn("flex-1 py-2 rounded-lg border text-xs font-semibold transition-all",
                        review.overall_rating === n
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-muted-foreground hover:border-primary/40"
                      )}>
                      {n}
                    </button>
                  ))}
                </div>
                {review.overall_rating && (
                  <p className="text-xs text-muted-foreground mt-1 text-center">{RATING_LABELS[review.overall_rating]}</p>
                )}
              </div>
            </div>
          </div>

          {/* ── REFLECTION ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Reflect</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Wins 🏆</label>
                <p className="text-xs text-muted-foreground italic mb-2">What went well this week? Big or small.</p>
                <Textarea value={review.wins} onChange={e => updateReview({ wins: e.target.value })}
                  placeholder="This week I'm proud of..." rows={3}
                  className="resize-none text-sm bg-muted/30 border-muted focus:bg-background transition-colors" maxLength={1000} />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Lessons Learned 💡</label>
                <p className="text-xs text-muted-foreground italic mb-2">What would you do differently?</p>
                <Textarea value={review.lessons} onChange={e => updateReview({ lessons: e.target.value })}
                  placeholder="Next time I would..." rows={3}
                  className="resize-none text-sm bg-muted/30 border-muted focus:bg-background transition-colors" maxLength={1000} />
              </div>
            </div>
          </div>

          {/* ── NEXT WEEK ── */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ArrowRight className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Next Week</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Focus Word or Theme</label>
                <p className="text-xs text-muted-foreground italic mb-2">One word or phrase that will guide next week.</p>
                <input
                  type="text"
                  value={review.next_week_focus}
                  onChange={e => updateReview({ next_week_focus: e.target.value })}
                  placeholder="e.g. Execution, Rest, Momentum, Visibility..."
                  maxLength={100}
                  className="w-full h-10 px-3 rounded-lg border border-muted bg-muted/30 focus:bg-background focus:border-primary focus:outline-none text-sm transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Top 3 Priorities</label>
                <p className="text-xs text-muted-foreground italic mb-2">What must happen next week for it to be a win?</p>
                <Textarea value={review.next_week_priorities} onChange={e => updateReview({ next_week_priorities: e.target.value })}
                  placeholder={"1. \n2. \n3. "} rows={4}
                  className="resize-none text-sm bg-muted/30 border-muted focus:bg-background transition-colors font-mono" maxLength={500} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </ProjectLayout>
  );
};

export default WeeklyReview;
