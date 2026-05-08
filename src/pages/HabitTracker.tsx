import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { HabitsThemeShell } from "@/components/habits/HabitsThemeShell";
import { DesktopTabs } from "@/components/habits/desktop/DesktopTabs";
import { TABS, type DesktopTab } from "@/components/habits/desktop/tabs";
import { TodayView } from "@/components/habits/desktop/TodayView";
import { HabitsTableView } from "@/components/habits/desktop/HabitsTableView";
import { StatsView } from "@/components/habits/desktop/StatsView";
import { HabitDetailSheet } from "@/components/habits/HabitDetailSheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useHabitsData, type Habit } from "@/hooks/useHabitsData";
import { supabase } from "@/integrations/supabase/client";
import { format, startOfDay } from "date-fns";
import { toast } from "sonner";
import { Plus, Flame, BarChart3 } from "lucide-react";
import { HabitRowEditorial } from "@/components/habits/shared/HabitRowEditorial";
import { isHabitScheduledOn, getStreak } from "@/lib/habits/streak";
import { lightHaptic, successHaptic, syncHabitReminders } from "@/lib/habits/notifications";

// Re-export for legacy components (HabitDetailSheet imports these from this path).
export type { Habit, HabitCompletion } from "@/hooks/useHabitsData";

const HabitTracker = () => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab") as DesktopTab | null;
  const [activeTab, setActiveTab] = useState<DesktopTab>(
    tabParam && TABS.includes(tabParam) ? tabParam : "Today"
  );
  const { userId, habits, completions, shields, loading, refetch, setCompletions } = useHabitsData();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeHabit, setActiveHabit] = useState<Habit | null>(null);

  useEffect(() => {
    if (activeTab === "Add habit") {
      setActiveHabit(null);
      setSheetOpen(true);
      setActiveTab("Today");
      setSearchParams({}, { replace: true });
    }
  }, [activeTab]);

  // Sync native reminders when habits change
  useEffect(() => {
    if (habits.length) {
      syncHabitReminders(habits.map(h => ({ id: h.id, name: h.name, reminder_time: h.reminder_time })));
    }
  }, [habits]);

  const todayStr = format(startOfDay(new Date()), "yyyy-MM-dd");

  const toggleCompletion = async (habitId: string) => {
    if (!userId) return;
    lightHaptic();
    const existing = completions.find(c => c.habit_id === habitId && c.completed_date === todayStr);
    if (existing) {
      await supabase.from("habit_completions" as any).delete().eq("id", existing.id);
      setCompletions(prev => prev.filter(c => c.id !== existing.id));
    } else {
      const { data } = await supabase.from("habit_completions" as any).insert({
        habit_id: habitId, user_id: userId, completed_date: todayStr,
      }).select().single();
      if (data) {
        setCompletions(prev => [...prev, data as any]);
        successHaptic();
      }
    }
  };

  const openHabit = (habit: Habit | null) => {
    setActiveHabit(habit);
    setSheetOpen(true);
  };

  const handleSaveHabit = async (data: Partial<Habit>) => {
    if (!userId) return;
    const payload: any = {
      name: data.name,
      description: data.description ?? null,
      category: data.category || "personal",
      color: data.color || "#C65A3E",
      icon: data.icon || "circle",
      frequency: data.frequency || "daily",
      frequency_days: data.frequency_days ?? null,
      time_of_day: data.time_of_day ?? [],
      duration_minutes: data.duration_minutes ?? null,
      reminder_times: data.reminder_times ?? [],
      notes: data.notes ?? null,
      pair_with_habit_id: data.pair_with_habit_id ?? null,
      tag: data.tag ?? null,
      reminder_time: data.reminder_time ?? null,
    };
    if (activeHabit) {
      const { error } = await supabase.from("habits" as any).update(payload).eq("id", activeHabit.id);
      if (error) { toast.error("Failed to update habit"); return; }
      toast.success("Habit updated");
    } else {
      const { error } = await supabase.from("habits" as any).insert({ ...payload, user_id: userId });
      if (error) { toast.error("Failed to create habit"); return; }
      toast.success("Habit created");
    }
    refetch();
  };

  const handleArchiveHabit = async (habitId: string) => {
    await supabase.from("habits" as any).update({ is_archived: true }).eq("id", habitId);
    toast.success("Habit deleted");
    setSheetOpen(false);
    setActiveHabit(null);
    refetch();
  };

  const renderDesktop = () => {
    if (loading) {
      return <div style={{ padding: 56, color: "var(--hb-mute)" }}>Loading…</div>;
    }
    if (activeTab === "Today") {
      return <TodayView habits={habits} completions={completions} shields={shields} onToggle={toggleCompletion} onOpen={openHabit} />;
    }
    if (activeTab === "Habits") {
      return <HabitsTableView habits={habits} completions={completions} shields={shields} onOpen={openHabit} onNew={() => openHabit(null)} />;
    }
    if (activeTab === "Statistics") {
      return <StatsView habits={habits} completions={completions} shields={shields} />;
    }
    return null;
  };

  // ===== Mobile =====
  const scheduled = useMemo(() => habits.filter(h => isHabitScheduledOn(h, new Date())), [habits]);
  const groups = useMemo(() => {
    const find = (slot: string) => scheduled.filter(h => {
      const slots = h.time_of_day && h.time_of_day.length ? h.time_of_day : ["all_day"];
      return slots.includes(slot);
    });
    return [
      { time: "Morning", items: find("morning") },
      { time: "All day", items: find("all_day") },
      { time: "Evening", items: find("evening") },
    ];
  }, [scheduled]);
  const habitMap = new Map(habits.map(h => [h.id, h]));
  const doneToday = scheduled.filter(h => completions.some(c => c.habit_id === h.id && c.completed_date === todayStr)).length;

  const renderMobile = () => (
    <div style={{ background: "var(--hb-cream)", minHeight: "100vh", paddingBottom: 110 }}>
      <div style={{ padding: "20px 24px 0" }}>
        <div className="hb-eyebrow">{format(new Date(), "EEEE · MMM d")}</div>
        <div className="hb-display" style={{ fontWeight: 500, fontSize: 36, color: "var(--hb-ink)", letterSpacing: "-0.025em", lineHeight: 1.05, marginTop: 6 }}>
          Good {(() => { const h = new Date().getHours(); return h < 12 ? "morning" : h < 17 ? "afternoon" : "evening"; })()},<br />
          <em style={{ color: "var(--hb-terracotta)", fontWeight: 400 }}>there.</em>
        </div>
        <div className="hb-italic" style={{ fontSize: 16, color: "var(--hb-mute)", marginTop: 8, lineHeight: 1.4 }}>
          {scheduled.length === 0 ? "No habits today — quiet day." : `${scheduled.length - doneToday} small ${scheduled.length - doneToday === 1 ? "thing" : "things"} between you and a day worth keeping.`}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button onClick={() => navigate("/habits?tab=Statistics")} style={{ flex: 1, padding: "10px 12px", background: "var(--hb-paper)", border: "1px solid var(--hb-line)", borderRadius: 12, display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <BarChart3 className="w-4 h-4" style={{ color: "var(--hb-terracotta)" }} />
            <div style={{ flex: 1, minWidth: 0, textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--hb-ink)" }}>Statistics</div>
              <div style={{ fontSize: 10, color: "var(--hb-mute-soft)" }}>26 weeks · streaks</div>
            </div>
          </button>
        </div>
      </div>

      {scheduled.length > 0 && (
        <div style={{ margin: "20px 24px 0", padding: 18, background: "var(--hb-ink)", color: "var(--hb-cream)", borderRadius: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ position: "relative", width: 56, height: 56 }}>
              <svg width="56" height="56" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="22" stroke="rgba(251,247,241,0.15)" strokeWidth="4" fill="none" />
                <circle cx="28" cy="28" r="22" stroke="var(--hb-terracotta)" strokeWidth="4" fill="none"
                  strokeDasharray={`${(doneToday / Math.max(scheduled.length, 1)) * 138} 138`} strokeLinecap="round" transform="rotate(-90 28 28)" />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--hb-display)", fontSize: 18, fontWeight: 500 }}>
                {doneToday}/{scheduled.length}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="hb-eyebrow" style={{ color: "var(--hb-cream-deep)" }}>Today's rhythm</div>
              <div className="hb-italic" style={{ fontSize: 15, marginTop: 4, lineHeight: 1.35 }}>
                {doneToday === scheduled.length ? "All kept. The day is yours." : "A small start is still a start."}
              </div>
            </div>
          </div>
        </div>
      )}

      {groups.map(g => g.items.length > 0 && (
        <div key={g.time} style={{ marginTop: 24, padding: "0 24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <div className="hb-eyebrow">{g.time}</div>
            <div className="hb-italic" style={{ fontSize: 13, color: "var(--hb-mute-soft)" }}>
              {g.items.filter(h => completions.some(c => c.habit_id === h.id && c.completed_date === todayStr)).length} of {g.items.length}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {g.items.map(h => {
              const done = completions.some(c => c.habit_id === h.id && c.completed_date === todayStr);
              const pair = h.pair_with_habit_id ? habitMap.get(h.pair_with_habit_id)?.name ?? null : null;
              return (
                <HabitRowEditorial key={h.id} habit={h} done={done} streak={getStreak(h, completions, shields)} pairName={pair}
                  onToggle={() => toggleCompletion(h.id)} onOpen={() => openHabit(h)} />
              );
            })}
          </div>
        </div>
      ))}

      {scheduled.length === 0 && habits.length === 0 && (
        <div style={{ padding: "60px 24px", textAlign: "center" }}>
          <Flame className="w-8 h-8 mx-auto mb-3" style={{ color: "var(--hb-terracotta)" }} />
          <div className="hb-italic" style={{ fontSize: 16, color: "var(--hb-mute)" }}>No habits yet — tap + to start.</div>
        </div>
      )}

      <button
        onClick={() => openHabit(null)}
        style={{
          position: "fixed", bottom: "calc(28px + env(safe-area-inset-bottom))", right: 24,
          width: 56, height: 56, borderRadius: "50%",
          background: "var(--hb-ink)", color: "var(--hb-cream)", border: "none",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 20px rgba(31,27,23,0.25)", cursor: "pointer", zIndex: 30,
        }}
        aria-label="New habit"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );

  return (
    <ProjectLayout>
      <HabitsThemeShell>
        {!isMobile && <DesktopTabs active={activeTab} onChange={setActiveTab} />}
        {!isMobile ? (
          <div style={{ height: "calc(100vh - 60px)" }}>{renderDesktop()}</div>
        ) : renderMobile()}
      </HabitsThemeShell>

      <HabitDetailSheet
        open={sheetOpen}
        onOpenChange={(o) => { setSheetOpen(o); if (!o) setActiveHabit(null); }}
        habit={activeHabit}
        habits={habits}
        completions={completions}
        onSubmit={handleSaveHabit}
        onArchive={handleArchiveHabit}
      />
    </ProjectLayout>
  );
};

export default HabitTracker;
