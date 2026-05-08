import { format, addDays, startOfWeek } from "date-fns";
import type { Habit, HabitCompletion, StreakShield } from "@/hooks/useHabitsData";

export const WEEKDAY_MAP = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

export function isHabitScheduledOn(habit: Habit, date: Date): boolean {
  const dow = WEEKDAY_MAP[date.getDay()];
  if (habit.frequency === "daily") return true;
  if (habit.frequency === "weekdays") return !["SA", "SU"].includes(dow);
  if (habit.frequency === "weekends") return ["SA", "SU"].includes(dow);
  if (habit.frequency === "custom") return (habit.frequency_days || []).includes(dow);
  return true;
}

export function getStreak(
  habit: Habit,
  completions: HabitCompletion[],
  shields: StreakShield[] = []
): number {
  const habitDates = new Set(
    completions.filter((c) => c.habit_id === habit.id).map((c) => c.completed_date)
  );
  const shieldDates = new Set(
    shields.filter((s) => s.habit_id === habit.id).map((s) => s.used_date)
  );
  const today = format(new Date(), "yyyy-MM-dd");
  let streak = 0;
  let cursor = new Date();
  // Allow today to be uncompleted without breaking streak
  let firstCheck = true;
  while (true) {
    const d = format(cursor, "yyyy-MM-dd");
    const scheduled = isHabitScheduledOn(habit, cursor);
    if (!scheduled) {
      cursor = addDays(cursor, -1);
      continue;
    }
    if (habitDates.has(d) || shieldDates.has(d)) {
      streak++;
    } else if (firstCheck && d === today) {
      // don't break for today not yet done
    } else {
      break;
    }
    firstCheck = false;
    cursor = addDays(cursor, -1);
    if (streak > 365) break;
  }
  return streak;
}

export function thisWeekDays(): Date[] {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

export function weekCompletionVector(habit: Habit, completions: HabitCompletion[]): number[] {
  const days = thisWeekDays();
  const set = new Set(completions.filter((c) => c.habit_id === habit.id).map((c) => c.completed_date));
  return days.map((d) => (set.has(format(d, "yyyy-MM-dd")) ? 1 : 0));
}
