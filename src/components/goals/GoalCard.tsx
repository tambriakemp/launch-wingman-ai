import { useNavigate } from "react-router-dom";
import { differenceInDays, parseISO } from "date-fns";
import {
  MoreHorizontal,
  Pencil,
  Trophy,
  Archive,
  CalendarDays,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Goal, GoalTarget } from "@/pages/Goals";

interface GoalCardProps {
  goal: Goal;
  targets: GoalTarget[];
  onEdit: () => void;
  onComplete: () => void;
  onArchive: () => void;
}

export function GoalCard({
  goal,
  targets,
  onEdit,
  onComplete,
  onArchive,
}: GoalCardProps) {
  const navigate = useNavigate();

  const doneTargets = targets.filter((t) => t.is_done).length;
  const totalTargets = targets.length;
  const progress =
    totalTargets > 0 ? Math.round((doneTargets / totalTargets) * 100) : 0;

  const daysLeft = goal.target_date
    ? differenceInDays(parseISO(goal.target_date), new Date())
    : null;
  const isOverdue = daysLeft !== null && daysLeft < 0 && goal.status === "active";
  const isCompleted = goal.status === "completed";

  return (
    <div
      onClick={() => navigate(`/goals/${goal.id}`)}
      className={cn(
        "rounded-xl border bg-card overflow-hidden transition-all cursor-pointer group",
        isCompleted
          ? "border-border/50 opacity-70"
          : "border-border hover:shadow-md hover:border-primary/20"
      )}
    >
      {/* Color bar */}
      <div className="h-1" style={{ backgroundColor: goal.color }} />

      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3
                className={cn(
                  "font-semibold text-foreground",
                  isCompleted && "line-through text-muted-foreground"
                )}
              >
                {goal.title}
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground capitalize">
                {goal.category}
              </span>
              {isCompleted && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                  Completed ✓
                </span>
              )}
            </div>

            {goal.why_statement && (
              <p className="text-xs text-muted-foreground italic mt-1">
                "{goal.why_statement}"
              </p>
            )}

            {/* Progress + date row */}
            <div className="flex items-center gap-4 mt-2">
              {totalTargets > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {doneTargets}/{totalTargets} targets
                  </span>
                </div>
              )}

              {daysLeft !== null && (
                <div
                  className={cn(
                    "flex items-center gap-1 text-[10px]",
                    isOverdue ? "text-destructive" : "text-muted-foreground"
                  )}
                >
                  <CalendarDays className="w-3 h-3" />
                  {isOverdue
                    ? `${Math.abs(daysLeft)}d overdue`
                    : daysLeft === 0
                    ? "Due today"
                    : `${daysLeft}d left`}
                </div>
              )}
            </div>
          </div>

          {/* Actions menu */}
          <div className="flex items-center gap-1">
            <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  onClick={(e) => e.stopPropagation()}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit();
                  }}
                >
                  <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
                </DropdownMenuItem>
                {goal.status === "active" && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onComplete();
                    }}
                  >
                    <Trophy className="w-3.5 h-3.5 mr-2" /> Mark Complete
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onArchive();
                  }}
                >
                  <Archive className="w-3.5 h-3.5 mr-2" /> Archive
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Target previews */}
        {totalTargets > 0 && (
          <div className="space-y-1.5 pl-0">
            {targets.slice(0, 3).map((t) => {
              const range = t.target_value - t.start_value;
              const current = t.current_value - t.start_value;
              const pct = range > 0 ? Math.min(100, Math.round((current / range) * 100)) : (t.is_done ? 100 : 0);
              return (
                <div key={t.id} className="flex items-center gap-2.5">
                  <div className="w-20 h-1 bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all",
                        t.is_done ? "bg-primary" : "bg-primary/60"
                      )}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground truncate flex-1">
                    {t.name}
                  </span>
                  <span className="text-[10px] text-muted-foreground font-mono">
                    {t.target_type === "currency" ? "$" : ""}
                    {Number(t.current_value).toLocaleString()}
                    {t.unit ? ` ${t.unit}` : ""} / {t.target_type === "currency" ? "$" : ""}
                    {Number(t.target_value).toLocaleString()}
                  </span>
                </div>
              );
            })}
            {totalTargets > 3 && (
              <p className="text-[10px] text-muted-foreground pl-[90px]">
                +{totalTargets - 3} more target{totalTargets - 3 > 1 ? "s" : ""}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
