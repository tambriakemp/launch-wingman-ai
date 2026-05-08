import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Habit, HabitCompletion } from "@/hooks/useHabitsData";

interface NudgeResult {
  message: string;
  eyebrow: string;
  loading: boolean;
  error: string | null;
}

const cacheKey = (mode: string) => `habits-nudge:${mode}:${new Date().toISOString().slice(0, 10)}`;

export function useHabitNudge(
  habits: Habit[],
  completions: HabitCompletion[],
  mode: "daily" | "weekly" = "daily",
  enabled = true,
): NudgeResult {
  const [state, setState] = useState<NudgeResult>({
    message: "", eyebrow: mode === "weekly" ? "This week" : "Pattern noticed",
    loading: false, error: null,
  });

  useEffect(() => {
    if (!enabled || habits.length === 0) return;
    const k = cacheKey(mode);
    const cached = localStorage.getItem(k);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        setState(s => ({ ...s, message: parsed.message, eyebrow: parsed.eyebrow ?? s.eyebrow }));
        return;
      } catch {}
    }
    let alive = true;
    setState(s => ({ ...s, loading: true }));
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("generate-habit-nudge", {
          body: {
            mode,
            habits: habits.map(h => ({ name: h.name, frequency: h.frequency, time_of_day: h.time_of_day, tag: h.tag })),
            completions: completions.map(c => ({ habit_id: c.habit_id, completed_date: c.completed_date })),
          },
        });
        if (!alive) return;
        if (error) {
          setState(s => ({ ...s, loading: false, error: error.message }));
          return;
        }
        const message = (data as any)?.message ?? "";
        const eyebrow = (data as any)?.eyebrow ?? state.eyebrow;
        if (message) localStorage.setItem(k, JSON.stringify({ message, eyebrow }));
        setState({ message, eyebrow, loading: false, error: null });
      } catch (e: any) {
        if (alive) setState(s => ({ ...s, loading: false, error: String(e) }));
      }
    })();
    return () => { alive = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, mode, habits.length, completions.length]);

  return state;
}
