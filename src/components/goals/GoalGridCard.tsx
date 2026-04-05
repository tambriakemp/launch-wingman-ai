import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import type { Goal, GoalTarget } from "@/pages/Goals";

interface GoalGridCardProps {
  goal: Goal;
  targets: GoalTarget[];
}

export function GoalGridCard({ goal, targets }: GoalGridCardProps) {
  const navigate = useNavigate();

  const doneTargets = targets.filter((t) => t.is_done).length;
  const totalTargets = targets.length;
  const progress =
    totalTargets > 0 ? Math.round((doneTargets / totalTargets) * 100) : 0;
  const isCompleted = goal.status === "completed";

  const circumference = 2 * Math.PI * 40;
  const strokeDash = (progress / 100) * circumference;

  return (
    <div
      onClick={() => navigate(`/goals/${goal.id}`)}
      className={cn(
        "rounded-xl border bg-card overflow-hidden cursor-pointer group transition-all",
        isCompleted
          ? "border-border/50 opacity-70"
          : "border-border hover:shadow-md hover:border-primary/20"
      )}
    >
      {/* Color bar */}
      <div className="h-1.5" style={{ backgroundColor: goal.color }} />

      <div className="p-5 flex flex-col items-center gap-4">
        {/* Progress ring */}
        <div className="relative w-24 h-24">
          <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96">
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="6"
            />
            <circle
              cx="48"
              cy="48"
              r="40"
              fill="none"
              stroke={goal.color}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${strokeDash} ${circumference}`}
              className="transition-all duration-500"
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-foreground">
            {progress}%
          </span>
        </div>

        {/* Title */}
        <h3
          className={cn(
            "text-sm font-semibold text-foreground text-center line-clamp-2",
            isCompleted && "line-through text-muted-foreground"
          )}
        >
          {goal.title}
        </h3>

        {/* Targets link */}
        {totalTargets > 0 && (
          <p className="text-xs text-primary font-medium">
            {totalTargets} target{totalTargets !== 1 ? "s" : ""}
          </p>
        )}

        {/* Footer */}
        <div className="w-full flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border">
          <span>{format(parseISO(goal.created_at), "MMM d, yyyy")}</span>
          {isCompleted && (
            <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium">
              ✓
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
