import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import {
  format, startOfWeek, endOfWeek, addDays, isToday, isSameDay, parseISO,
} from "date-fns";
import {
  CalendarCheck, BookOpen, Flame, Target, BarChart2,
  ChevronRight, CheckCircle2, TrendingUp,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/* ─── Hub Card ─── */
interface HubCardProps {
  title: string;
  href: string;
  icon: React.ElementType;
  iconColor: string;
  children: ReactNode;
}

const HubCard = ({ title, href, icon: Icon, iconColor, children }: HubCardProps) => {
  const navigate = useNavigate();
  return (
    <button
      onClick={() => navigate(href)}
      className="group w-full text-left rounded-xl border border-border bg-card p-5 transition-all hover:shadow-md hover:border-primary/20"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", iconColor)}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-sm font-semibold text-foreground">{title}</span>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
      {children}
    </button>
  );
};

/* ─── Page ─── */
const PlannerHub = () => {
  const { user } = useAuth();
  const uid = user?.id;
  const now = new Date();
  const todayStr = format(now, "yyyy-MM-dd");
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  /* 1 — Week events */
  const { data: weekEvents = [] } = useQuery({
    queryKey: ["hub-week-events", uid],
    queryFn: async () => {
      const { data } = await supabase
        .from("tasks")
        .select("id, title, start_at, end_at, category")
        .eq("user_id", uid!)
        .eq("task_scope", "planner")
        .not("start_at", "is", null)
        .gte("start_at", weekStart.toISOString())
        .lte("start_at", weekEnd.toISOString())
        .limit(10);
      return (data || []) as any[];
    },
    enabled: !!uid,
  });

  /* 2 — Daily page */
  const { data: dailyPage } = useQuery({
    queryKey: ["hub-daily-page", uid, todayStr],
    queryFn: async () => {
      const { data } = await supabase
        .from("daily_pages" as any)
        .select("intention, priority_1, priority_1_done, priority_2, priority_2_done, priority_3, priority_3_done, mood")
        .eq("user_id", uid!)
        .eq("page_date", todayStr)
        .maybeSingle();
      return data as any;
    },
    enabled: !!uid,
  });

  /* 3 — Habits */
  const { data: habits = [] } = useQuery({
    queryKey: ["hub-habits", uid],
    queryFn: async () => {
      const { data } = await supabase
        .from("habits" as any)
        .select("id, name, color")
        .eq("user_id", uid!)
        .eq("is_archived", false);
      return (data || []) as any[];
    },
    enabled: !!uid,
  });

  /* 4 — Today completions */
  const { data: todayCompletions = [] } = useQuery({
    queryKey: ["hub-habit-completions", uid, todayStr],
    queryFn: async () => {
      const { data } = await supabase
        .from("habit_completions" as any)
        .select("habit_id")
        .eq("user_id", uid!)
        .eq("completed_date", todayStr);
      return (data || []) as any[];
    },
    enabled: !!uid,
  });

  /* 5 — Goals */
  const { data: goals = [] } = useQuery({
    queryKey: ["hub-goals", uid],
    queryFn: async () => {
      const { data } = await supabase
        .from("goals" as any)
        .select("id, title, color, target_date")
        .eq("user_id", uid!)
        .eq("status", "active")
        .order("target_date", { ascending: true })
        .limit(3);
      return (data || []) as any[];
    },
    enabled: !!uid,
  });

  /* derived */
  const completedIds = new Set(todayCompletions.map((c: any) => c.habit_id));
  const habitsDone = habits.filter((h: any) => completedIds.has(h.id)).length;
  const habitsTotal = habits.length;

  const priorities = dailyPage
    ? [dailyPage.priority_1, dailyPage.priority_2, dailyPage.priority_3].filter(Boolean)
    : [];
  const prioritiesDone = dailyPage
    ? [dailyPage.priority_1_done, dailyPage.priority_2_done, dailyPage.priority_3_done].filter(Boolean).length
    : 0;

  const moodEmoji: Record<string, string> = { great: "🔥", good: "😊", okay: "😐", rough: "😔" };
  const firstName = (user?.user_metadata?.first_name as string) || "Your";

  return (
    <ProjectLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">{firstName}'s Planner</h1>
          <p className="text-sm text-muted-foreground">{format(now, "EEEE, MMMM d")}</p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 1 — Calendar */}
          <HubCard title="Calendar" href="/planner" icon={CalendarCheck} iconColor="bg-blue-500/10 text-blue-500">
            <div className="flex justify-between mb-2">
              {weekDays.map((d) => {
                const hasEvent = weekEvents.some((e: any) => isSameDay(parseISO(e.start_at), d));
                const today = isToday(d);
                return (
                  <div key={d.toISOString()} className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px] text-muted-foreground">{format(d, "EEEEE")}</span>
                    <span
                      className={cn(
                        "w-7 h-7 flex items-center justify-center rounded-full text-xs font-medium",
                        today ? "bg-primary text-primary-foreground" : "text-foreground"
                      )}
                    >
                      {format(d, "d")}
                    </span>
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        hasEvent ? "bg-blue-400" : "bg-transparent"
                      )}
                    />
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">{weekEvents.length} events this week</p>
          </HubCard>

          {/* 2 — Daily Page */}
          <HubCard title="Daily Page" href="/daily" icon={BookOpen} iconColor="bg-amber-500/10 text-amber-500">
            {dailyPage?.intention ? (
              <p className="text-xs italic text-muted-foreground mb-2 line-clamp-2">"{dailyPage.intention}"</p>
            ) : (
              <p className="text-xs text-muted-foreground mb-2">No intention set for today</p>
            )}
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {prioritiesDone}/{priorities.length} priorities
              </span>
              {dailyPage?.mood && (
                <span>{moodEmoji[dailyPage.mood] || dailyPage.mood}</span>
              )}
            </div>
          </HubCard>

          {/* 3 — Habits */}
          <HubCard title="Habits" href="/habits" icon={Flame} iconColor="bg-orange-500/10 text-orange-500">
            {habitsTotal > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <Progress
                    value={habitsTotal ? (habitsDone / habitsTotal) * 100 : 0}
                    className="h-2 flex-1"
                    indicatorClassName="bg-orange-400"
                  />
                  <span className="text-xs font-medium text-muted-foreground">{habitsDone}/{habitsTotal}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {habits.slice(0, 4).map((h: any) => {
                    const done = completedIds.has(h.id);
                    return (
                      <span
                        key={h.id}
                        className={cn(
                          "text-[11px] px-2 py-0.5 rounded-full border",
                          done ? "border-orange-300 text-foreground" : "border-border text-muted-foreground opacity-60"
                        )}
                      >
                        {done && "✓ "}{h.name}
                      </span>
                    );
                  })}
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">No habits set up yet</p>
            )}
          </HubCard>

          {/* 4 — Goals */}
          <HubCard title="Goals" href="/goals" icon={Target} iconColor="bg-teal-500/10 text-teal-500">
            {goals.length > 0 ? (
              <div className="space-y-1.5">
                {goals.map((g: any) => (
                  <div key={g.id} className="flex items-center gap-2 text-xs">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: g.color }} />
                    <span className="flex-1 truncate text-foreground">{g.title}</span>
                    {g.target_date && (
                      <span className="text-muted-foreground shrink-0">{format(parseISO(g.target_date), "MMM d")}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No active goals yet</p>
            )}
          </HubCard>

          {/* 5 — Brain Dump */}
          <HubCard title="Brain Dump" href="/brain-dump" icon={Brain} iconColor="bg-purple-500/10 text-purple-500">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-foreground">{inboxCount}</span>
              <span className="text-xs text-muted-foreground">
                {inboxCount === 0 ? "Inbox clear" : `item${inboxCount === 1 ? "" : "s"} to process`}
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-1">
              {inboxCount > 0 ? "Tap to process your thoughts" : "Nothing waiting"}
            </p>
          </HubCard>

          {/* 6 — Weekly Review */}
          <HubCard title="Weekly Review" href="/weekly" icon={BarChart2} iconColor="bg-indigo-500/10 text-indigo-500">
            <p className="text-xs text-muted-foreground mb-1.5">
              Week of {format(weekStart, "MMM d")} – {format(weekEnd, "MMM d")}
            </p>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <TrendingUp className="w-3.5 h-3.5" />
              Review your week's progress
            </div>
          </HubCard>
        </div>
      </div>
    </ProjectLayout>
  );
};

export default PlannerHub;
