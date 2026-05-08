import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  pair_with_habit_id: string | null;
  tag: string | null;
  reminder_time: string | null;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  completed_date: string;
  note: string | null;
}

export interface StreakShield {
  id: string;
  habit_id: string;
  used_date: string;
  month_key: string;
}

export function useHabitsData() {
  const { user } = useAuth();
  const userId = user?.id;
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<HabitCompletion[]>([]);
  const [shields, setShields] = useState<StreakShield[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    const [h, c, s] = await Promise.all([
      supabase.from("habits" as any).select("*").eq("user_id", userId).eq("is_archived", false).order("created_at", { ascending: true }),
      supabase.from("habit_completions" as any).select("*").eq("user_id", userId),
      supabase.from("habit_streak_shields" as any).select("*").eq("user_id", userId),
    ]);
    setHabits((h.data as unknown as Habit[]) || []);
    setCompletions((c.data as unknown as HabitCompletion[]) || []);
    setShields((s.data as unknown as StreakShield[]) || []);
    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  return { userId, habits, completions, shields, loading, refetch: fetchAll, setCompletions, setHabits };
}
