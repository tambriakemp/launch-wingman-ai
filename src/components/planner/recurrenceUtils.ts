import { addDays, addWeeks, addMonths, addYears, parseISO, isBefore, isAfter, isSameDay } from "date-fns";
import type { PlannerTask } from "./PlannerTaskDialog";

const DAY_MAP: Record<string, number> = { SU: 0, MO: 1, TU: 2, WE: 3, TH: 4, FR: 5, SA: 6 };

/** Generate virtual recurring instances for a parent task within a date window */
export function expandRecurringTask(
  parent: PlannerTask,
  windowStart: Date,
  windowEnd: Date
): PlannerTask[] {
  if (!parent.recurrence_rule || !parent.start_at) return [];

  const rule = parent.recurrence_rule as {
    freq: string;
    interval: number;
    days: string[];
    end_type: string;
    end_date: string | null;
    count: number;
  };

  const exceptions = new Set(
    (parent.recurrence_exception_dates || []).map(d => d.split("T")[0])
  );

  const instances: PlannerTask[] = [];
  const baseStart = parseISO(parent.start_at);
  const baseEnd = parent.end_at ? parseISO(parent.end_at) : null;
  const duration = baseEnd ? baseEnd.getTime() - baseStart.getTime() : 0;

  let cursor = new Date(baseStart);
  let count = 0;
  const maxOccurrences = rule.end_type === "after_n" ? rule.count : 500;
  const hardEndDate = rule.end_type === "on_date" && rule.end_date
    ? new Date(rule.end_date)
    : null;

  const interval = Math.max(1, rule.interval || 1);

  while (count < maxOccurrences) {
    if (hardEndDate && isAfter(cursor, hardEndDate)) break;
    if (isAfter(cursor, windowEnd)) break;

    const dateKey = cursor.toISOString().split("T")[0];
    const inWindow = !isBefore(cursor, windowStart) && !isAfter(cursor, windowEnd);

    if (inWindow && !exceptions.has(dateKey)) {
      const instanceEnd = baseEnd ? new Date(cursor.getTime() + duration) : null;
      instances.push({
        ...parent,
        id: `${parent.id}::${dateKey}`,
        start_at: cursor.toISOString(),
        end_at: instanceEnd ? instanceEnd.toISOString() : null,
        due_at: cursor.toISOString(),
        _isVirtualRecurrence: true,
        _parentId: parent.id,
        _occurrenceDate: dateKey,
      } as any);
    }

    count++;

    switch (rule.freq) {
      case "daily":
        cursor = addDays(cursor, interval);
        break;
      case "weekly":
        cursor = addWeeks(cursor, interval);
        break;
      case "monthly":
        cursor = addMonths(cursor, interval);
        break;
      case "yearly":
        cursor = addYears(cursor, interval);
        break;
      default:
        return instances;
    }
  }

  return instances;
}

/** Special weekly expansion — generate one instance per matching weekday per week */
export function expandWeeklyTask(
  parent: PlannerTask,
  windowStart: Date,
  windowEnd: Date
): PlannerTask[] {
  if (!parent.recurrence_rule || !parent.start_at) return [];

  const rule = parent.recurrence_rule as any;
  if (rule.freq !== "weekly" || !rule.days || rule.days.length === 0) {
    return expandRecurringTask(parent, windowStart, windowEnd);
  }

  const exceptions = new Set(
    (parent.recurrence_exception_dates || []).map(d => d.split("T")[0])
  );

  const baseStart = parseISO(parent.start_at);
  const baseEnd = parent.end_at ? parseISO(parent.end_at) : null;
  const duration = baseEnd ? baseEnd.getTime() - baseStart.getTime() : 0;

  const interval = Math.max(1, rule.interval || 1);
  const hardEndDate = rule.end_type === "on_date" && rule.end_date ? new Date(rule.end_date) : null;

  const instances: PlannerTask[] = [];
  let weekCursor = new Date(baseStart);
  let weekCount = 0;
  const maxWeeks = rule.end_type === "after_n" ? rule.count * 2 : 260;

  while (weekCount < maxWeeks) {
    if (isAfter(weekCursor, windowEnd)) break;
    if (hardEndDate && isAfter(weekCursor, hardEndDate)) break;

    for (const day of rule.days) {
      const dayNum = DAY_MAP[day];
      if (dayNum === undefined) continue;

      const weekday = new Date(weekCursor);
      const diff = dayNum - weekday.getDay();
      weekday.setDate(weekday.getDate() + diff);
      weekday.setHours(baseStart.getHours(), baseStart.getMinutes(), 0, 0);

      if (isBefore(weekday, baseStart) && !isSameDay(weekday, baseStart)) continue;
      if (isAfter(weekday, windowEnd)) continue;
      if (hardEndDate && isAfter(weekday, hardEndDate)) continue;
      if (isBefore(weekday, windowStart)) continue;

      const dateKey = weekday.toISOString().split("T")[0];
      if (exceptions.has(dateKey)) continue;

      const instanceEnd = baseEnd ? new Date(weekday.getTime() + duration) : null;

      instances.push({
        ...parent,
        id: `${parent.id}::${dateKey}`,
        start_at: weekday.toISOString(),
        end_at: instanceEnd ? instanceEnd.toISOString() : null,
        due_at: weekday.toISOString(),
        _isVirtualRecurrence: true,
        _parentId: parent.id,
        _occurrenceDate: dateKey,
      } as any);
    }

    weekCursor = addWeeks(weekCursor, interval);
    weekCount++;
  }

  return instances;
}

/** Main function: takes all tasks, expands recurring ones into instances within the window */
export function expandAllRecurring(
  tasks: PlannerTask[],
  windowStart: Date,
  windowEnd: Date
): PlannerTask[] {
  const result: PlannerTask[] = [];

  for (const task of tasks) {
    if (!task.recurrence_rule) {
      result.push(task);
      continue;
    }

    const rule = task.recurrence_rule as any;
    if (rule.freq === "weekly" && rule.days?.length > 0) {
      result.push(...expandWeeklyTask(task, windowStart, windowEnd));
    } else {
      result.push(...expandRecurringTask(task, windowStart, windowEnd));
    }
  }

  return result;
}
