import { cn } from "@/lib/utils";

export interface SubtaskCounts {
  total: number;
  done: number;
}

interface SubtaskProgressProps {
  total: number;
  done: number;
  /** Smaller variant for tight contexts like calendar event pills. */
  compact?: boolean;
  className?: string;
}

/**
 * Compact "60%" badge that surfaces a task's subtask completion at the
 * task-row level — so users can see progress in the list view, week
 * board, and calendar event pills without opening the task. Renders
 * nothing if the task has no subtasks (total === 0).
 *
 * Color logic:
 *   - 0 → 99%  → muted ink chip (neutral progress)
 *   - 100%     → moss-green chip (visual reward for completion)
 */
export function SubtaskProgress({ total, done, compact, className }: SubtaskProgressProps) {
  if (total <= 0) return null;
  const pct = Math.min(100, Math.round((done / total) * 100));
  const complete = pct === 100;
  return (
    <span
      title={`${done} of ${total} subtasks done`}
      className={cn(
        "inline-flex shrink-0 items-center rounded font-mono tabular-nums tracking-tight",
        compact ? "text-[9.5px] px-1 py-px" : "text-[10px] px-1.5 py-0.5",
        complete
          ? "bg-[hsl(var(--moss-500)/0.15)] text-[hsl(var(--moss-700))]"
          : "bg-[hsl(var(--ink-900)/0.06)] text-[hsl(var(--ink-700))]",
        className,
      )}
    >
      {pct}%
    </span>
  );
}
