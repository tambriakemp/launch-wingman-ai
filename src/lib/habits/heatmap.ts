import { format, eachDayOfInterval, startOfWeek, subWeeks, addDays } from "date-fns";

export const HEAT_LEVELS = ["hb-heat-0", "hb-heat-1", "hb-heat-2", "hb-heat-3"];

export interface HeatmapCell {
  date: string;
  level: 0 | 1 | 2 | 3;
}

/**
 * Build a 26-week × 7-day grid (cols=weeks oldest→newest, rows=Mon..Sun).
 * Level is a function of completions per day across all habits.
 */
export function buildHeatmap(
  completions: { habit_id: string; completed_date: string }[],
  totalHabits: number,
  weeks = 26
): { cols: HeatmapCell[][]; daysKept: number } {
  const today = new Date();
  const start = startOfWeek(subWeeks(today, weeks - 1), { weekStartsOn: 1 });
  const cols: HeatmapCell[][] = [];
  const counts = new Map<string, number>();
  for (const c of completions) {
    counts.set(c.completed_date, (counts.get(c.completed_date) || 0) + 1);
  }
  let daysKept = 0;
  for (let w = 0; w < weeks; w++) {
    const colStart = addDays(start, w * 7);
    const col: HeatmapCell[] = [];
    for (let d = 0; d < 7; d++) {
      const day = addDays(colStart, d);
      const date = format(day, "yyyy-MM-dd");
      const n = counts.get(date) || 0;
      const ratio = totalHabits > 0 ? n / totalHabits : 0;
      const level: 0 | 1 | 2 | 3 = day > today
        ? 0
        : ratio === 0 ? 0
        : ratio < 0.34 ? 1
        : ratio < 0.67 ? 2 : 3;
      if (n > 0 && day <= today) daysKept++;
      col.push({ date, level });
    }
    cols.push(col);
  }
  return { cols, daysKept };
}
