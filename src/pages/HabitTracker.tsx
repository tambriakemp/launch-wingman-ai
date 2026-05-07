import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { HabitDayStrip } from "@/components/habits/HabitDayStrip";
import { HabitSlotTabs, type HabitSlot } from "@/components/habits/HabitSlotTabs";
import { HabitRow } from "@/components/habits/HabitRow";
import { HabitDetailSheet } from "@/components/habits/HabitDetailSheet";
import { format, startOfDay, isFuture } from "date-fns";
import { Plus, Flame, BarChart3 } from "lucide-react";
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
  time_of_day: string[];
  duration_minutes: number | null;
  reminder_times: string[];
  notes: string | null;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  completed_date: string;
  note: string | null;
}

const WEEKDAY_MAP = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

function isHabitScheduledOn(habit: Habit, date: Date): boolean {
  const dow = WEEKDAY_MAP[date.getDay()];
  if (habit.frequency === "daily") return true;
  if (habit.frequency === "weekdays") return !["SA", "SU"].includes(dow);
  if (habit.frequency === "weekends") return ["SA", "SU"].includes(dow);
  if (habit.frequency === "custom") return (habit.frequency_days || []).includes(dow);
  return true;
}

const HabitTracker = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id;
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [activeHabit, setActiveHabit] = useState<Habit | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => startOfDay(new Date()));
  const getCurrentSlot = (): HabitSlot => {
    const h = new Date().getHours();
    if (h >= 5 && h < 12) return "morning";
    if (h >= 12 && h < 17) return "afternoon";
    if (h >= 17) return "evening";
    return "morning";
  };
  const [activeSlot, setActiveSlot] = useState<HabitSlot>(() => getCurrentSlot());

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
    const { data } = await supabase
      .from("habit_completions" as any)
      .select("*")
      .eq("user_id", userId);
    setCompletions((data as unknown as HabitCompletion[]) || []);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => { fetchHabits(); }, [fetchHabits]);
  useEffect(() => { fetchCompletions(); }, [fetchCompletions]);

  const selectedDateStr = format(selectedDate, "yyyy-MM-dd");
  const isFutureDate = isFuture(selectedDate) && format(selectedDate, "yyyy-MM-dd") !== format(new Date(), "yyyy-MM-dd");

  const toggleCompletion = async (habitId: string) => {
    if (!userId || isFutureDate) return;
    const existing = completions.find(c => c.habit_id === habitId && c.completed_date === selectedDateStr);
    if (existing) {
      await supabase.from("habit_completions" as any).delete().eq("id", existing.id);
      setCompletions(prev => prev.filter(c => c.id !== existing.id));
    } else {
      const { data } = await supabase.from("habit_completions" as any).insert({
        habit_id: habitId,
        user_id: userId,
        completed_date: selectedDateStr,
      }).select().single();
      if (data) setCompletions(prev => [...prev, data as unknown as HabitCompletion]);
    }
  };

  const handleSaveHabit = async (data: Partial<Habit>) => {
    if (!userId) return;
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
        user_id: userId,
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
    fetchHabits();
  };

  const handleArchiveHabit = async (habitId: string) => {
    await supabase.from("habits" as any).update({ is_archived: true }).eq("id", habitId);
    toast.success("Habit deleted");
    setSheetOpen(false);
    setActiveHabit(null);
    fetchHabits();
  };

  // Filter habits scheduled for selected date
  const scheduledHabits = useMemo(
    () => habits.filter(h => isHabitScheduledOn(h, selectedDate)),
    [habits, selectedDate]
  );

  const slotCounts = useMemo(() => {
    const c: Record<HabitSlot, number> = { all_day: 0, morning: 0, afternoon: 0, evening: 0 };
    scheduledHabits.forEach(h => {
      const slots = h.time_of_day && h.time_of_day.length ? h.time_of_day : ["all_day"];
      slots.forEach(s => {
        if (s in c) c[s as HabitSlot]++;
      });
    });
    return c;
  }, [scheduledHabits]);

  const slotHabits = useMemo(() => {
    if (activeSlot === "all_day") {
      return scheduledHabits.filter(h => {
        const slots = h.time_of_day && h.time_of_day.length ? h.time_of_day : ["all_day"];
        return slots.includes("all_day");
      });
    }
    return scheduledHabits.filter(h => (h.time_of_day || []).includes(activeSlot));
  }, [scheduledHabits, activeSlot]);

  const allDayExtras = useMemo(() => {
    if (activeSlot === "all_day") return [];
    return scheduledHabits.filter(h => {
      const slots = h.time_of_day && h.time_of_day.length ? h.time_of_day : ["all_day"];
      return slots.includes("all_day");
    });
  }, [scheduledHabits, activeSlot]);

  const todayDoneCount = scheduledHabits.filter(h =>
    completions.some(c => c.habit_id === h.id && c.completed_date === selectedDateStr)
  ).length;

  return (
    <ProjectLayout>
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-32 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 rounded-xl">
              <Flame className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground leading-tight">Habits</h1>
              <p className="text-xs text-muted-foreground">
                {todayDoneCount} of {scheduledHabits.length} done
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <Button variant="ghost" size="icon" onClick={() => navigate("/habits/stats")} aria-label="Statistics">
              <BarChart3 className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Day strip */}
        <div className="rounded-2xl border border-border bg-card p-2">
          <HabitDayStrip selectedDate={selectedDate} onSelect={setSelectedDate} />
        </div>

        {/* Slot tabs */}
        <HabitSlotTabs value={activeSlot} onChange={setActiveSlot} counts={slotCounts} />

        {/* Habit list */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[68px] rounded-2xl bg-muted animate-pulse" />
              ))}
            </div>
          ) : habits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Flame className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-1">No habits yet</h3>
              <p className="text-sm text-muted-foreground max-w-xs mb-4">
                Create your first habit to start tracking your daily consistency.
              </p>
              <Button onClick={() => { setActiveHabit(null); setSheetOpen(true); }} className="gap-2">
                <Plus className="w-4 h-4" /> Create First Habit
              </Button>
            </div>
          ) : slotHabits.length === 0 && allDayExtras.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              No habits in this slot.
            </div>
          ) : (
            <>
              {activeSlot !== "all_day" && (
                <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 pt-1">
                  {activeSlot}
                </h3>
              )}
              {slotHabits.length === 0 ? (
                <p className="text-xs text-muted-foreground px-1 py-2">Nothing scheduled for {activeSlot}.</p>
              ) : (
                slotHabits.map(h => {
                  const isDone = completions.some(c => c.habit_id === h.id && c.completed_date === selectedDateStr);
                  return (
                    <HabitRow
                      key={h.id}
                      habit={h}
                      isDone={isDone}
                      onToggle={() => toggleCompletion(h.id)}
                      onOpen={() => { setActiveHabit(h); setSheetOpen(true); }}
                    />
                  );
                })
              )}
              {allDayExtras.length > 0 && (
                <>
                  <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1 pt-4">
                    All day
                  </h3>
                  {allDayExtras.map(h => {
                    const isDone = completions.some(c => c.habit_id === h.id && c.completed_date === selectedDateStr);
                    return (
                      <HabitRow
                        key={h.id}
                        habit={h}
                        isDone={isDone}
                        onToggle={() => toggleCompletion(h.id)}
                        onOpen={() => { setActiveHabit(h); setSheetOpen(true); }}
                      />
                    );
                  })}
                </>
              )}
            </>
          )}
        </div>

        {/* Floating add button — sticky inside content column, centered */}
        <div className="sticky bottom-[50px] z-30 flex justify-center pointer-events-none mt-[300px]">
          <button
            onClick={() => { setActiveHabit(null); setSheetOpen(true); }}
            className="pointer-events-auto w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
            aria-label="New habit"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </div>

      <HabitDetailSheet
        open={sheetOpen}
        onOpenChange={(o) => { setSheetOpen(o); if (!o) setActiveHabit(null); }}
        habit={activeHabit}
        completions={completions}
        onSubmit={handleSaveHabit}
        onArchive={handleArchiveHabit}
      />
    </ProjectLayout>
  );
};

export default HabitTracker;
