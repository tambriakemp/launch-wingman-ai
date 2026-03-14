import { useState } from "react";
import { format, differenceInDays, parseISO } from "date-fns";
import {
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Pencil,
  Trophy,
  Archive,
  ChevronDown,
  ChevronRight,
  CalendarDays,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Goal, GoalMilestone } from "@/pages/Goals";

interface GoalCardProps {
  goal: Goal;
  milestones: GoalMilestone[];
  onEdit: () => void;
  onToggleMilestone: (id: string, isDone: boolean) => void;
  onComplete: () => void;
  onArchive: () => void;
}

export function GoalCard({
  goal,
  milestones,
  onEdit,
  onToggleMilestone,
  onComplete,
  onArchive,
}: GoalCardProps) {
  const [expanded, setExpanded] = useState(true);

  const doneMilestones = milestones.filter((m) => m.is_done).length;
  const totalMilestones = milestones.length;
  const progress =
    totalMilestones > 0 ? Math.round((doneMilestones / totalMilestones) * 100) : 0;

  const daysLeft = goal.target_date
    ? differenceInDays(parseISO(goal.target_date), new Date())
    : null;
  const isOverdue = daysLeft !== null && daysLeft < 0 && goal.status === "active";
  const isCompleted = goal.status === "completed";

  return (
    <div
      className={cn(
        "rounded-xl border bg-card overflow-hidden transition-all",
        isCompleted ? "border-border/50 opacity-70" : "border-border hover:shadow-sm"
      )}
    >
      {/* Color bar */}
      <div className="h-1" style={{ backgroundColor: goal.color }} />

      <div className="p-4 space-y-3">
        {/* Header row */}
        <div className="flex items-start gap-3">
          <button
            onClick={() => setExpanded((e) => !e)}
            className="mt-0.5 shrink-0 text-muted-foreground hover:text-foreground transition-colors"
          >
            {expanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>

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
              {goal.quarter && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                  {goal.quarter}
                </span>
              )}
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
              {totalMilestones > 0 && (
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">
                    {doneMilestones}/{totalMilestones}
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="w-3.5 h-3.5 mr-2" /> Edit
              </DropdownMenuItem>
              {goal.status === "active" && (
                <DropdownMenuItem onClick={onComplete}>
                  <Trophy className="w-3.5 h-3.5 mr-2" /> Mark Complete
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={onArchive}>
                <Archive className="w-3.5 h-3.5 mr-2" /> Archive
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Milestones */}
        {expanded && totalMilestones > 0 && (
          <div className="pl-7 space-y-0.5">
            {milestones.map((m) => (
              <button
                key={m.id}
                onClick={() => onToggleMilestone(m.id, m.is_done)}
                className="flex items-center gap-2.5 w-full text-left group hover:bg-muted/30 rounded-lg px-2 py-1.5 transition-colors"
              >
                {m.is_done ? (
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground shrink-0" />
                )}
                <span
                  className={cn(
                    "text-sm flex-1",
                    m.is_done && "line-through text-muted-foreground"
                  )}
                >
                  {m.title}
                </span>
                {m.due_date && (
                  <span className="text-[10px] text-muted-foreground">
                    {format(parseISO(m.due_date), "MMM d")}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
