import { Check, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Habit } from "@/pages/HabitTracker";

interface HabitRowProps {
  habit: Habit;
  isDone: boolean;
  onToggle: () => void;
  onOpen: () => void;
}

export function HabitRow({ habit, isDone, onToggle, onOpen }: HabitRowProps) {
  return (
    <div className="group flex items-center gap-3 rounded-2xl border border-border bg-card hover:bg-accent/40 transition-colors p-3">
      <button
        onClick={onOpen}
        className="flex items-center gap-3 flex-1 min-w-0 text-left"
      >
        <div
          className="w-11 h-11 rounded-xl shrink-0 flex items-center justify-center"
          style={{ background: `${habit.color}20` }}
        >
          <div className="w-5 h-5 rounded-full" style={{ background: habit.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <p className={cn(
            "text-sm font-semibold truncate",
            isDone ? "text-muted-foreground line-through" : "text-foreground",
          )}>
            {habit.name}
          </p>
          {habit.description && (
            <p className="text-xs text-muted-foreground truncate">{habit.description}</p>
          )}
        </div>
      </button>

      {habit.duration_minutes ? (
        <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-1 rounded-lg shrink-0">
          <Clock className="w-3 h-3" />
          {habit.duration_minutes}m
        </div>
      ) : null}

      <button
        onClick={onToggle}
        className={cn(
          "w-9 h-9 rounded-full border-2 transition-all flex items-center justify-center shrink-0",
          isDone
            ? "border-transparent text-white"
            : "border-border hover:border-primary/50",
        )}
        style={isDone ? { background: habit.color } : undefined}
        aria-label={isDone ? "Mark incomplete" : "Mark complete"}
      >
        {isDone && <Check className="w-4 h-4" strokeWidth={3} />}
      </button>
    </div>
  );
}
