import { useMemo } from "react";
import { format, eachDayOfInterval, startOfMonth, endOfMonth } from "date-fns";
import { MoreHorizontal, Pencil, Archive, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import type { Habit, HabitCompletion } from "@/pages/HabitTracker";

interface HabitGridProps {
  habits: Habit[];
  completions: HabitCompletion[];
  currentMonth: Date;
  onToggle: (habitId: string, date: string) => void;
  onEdit: (habit: Habit) => void;
  onArchive: (habitId: string) => void;
  isLoading: boolean;
}

function getStreak(habit: Habit, completions: HabitCompletion[]): number {
  const habitDates = new Set(
    completions.filter(c => c.habit_id === habit.id).map(c => c.completed_date)
  );
  let streak = 0;
  let checkDate = new Date();
  while (true) {
    const d = format(checkDate, "yyyy-MM-dd");
    if (habitDates.has(d)) {
      streak++;
      checkDate = new Date(checkDate.getTime() - 86400000);
    } else {
      if (streak === 0 && d === format(new Date(), "yyyy-MM-dd")) {
        checkDate = new Date(checkDate.getTime() - 86400000);
        continue;
      }
      break;
    }
  }
  return streak;
}

function getMonthCompletionRate(habit: Habit, completions: HabitCompletion[], monthDays: Date[]): number {
  const today = format(new Date(), "yyyy-MM-dd");
  const pastDays = monthDays.filter(d => format(d, "yyyy-MM-dd") <= today);
  if (pastDays.length === 0) return 0;
  const done = pastDays.filter(d =>
    completions.some(c => c.habit_id === habit.id && c.completed_date === format(d, "yyyy-MM-dd"))
  ).length;
  return Math.round((done / pastDays.length) * 100);
}

export function HabitGrid({ habits, completions, currentMonth, onToggle, onEdit, onArchive, isLoading }: HabitGridProps) {
  const monthDays = useMemo(() =>
    eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) }),
    [currentMonth]
  );
  const today = format(new Date(), "yyyy-MM-dd");

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full rounded-xl" />)}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="min-w-full w-max rounded-xl border border-border bg-card">
      {/* Day header row */}
      <div className="flex items-center border-b border-border bg-muted/30">
        <div className="w-[260px] shrink-0" />
        {monthDays.map(day => {
          const dateStr = format(day, "yyyy-MM-dd");
          const isTodayDay = dateStr === today;
          return (
            <div key={dateStr} className="w-8 flex items-center justify-center py-2 shrink-0">
              <span className={cn(
                "text-[10px] font-medium",
                isTodayDay ? "text-primary font-bold" : "text-muted-foreground"
              )}>
                {format(day, "d")}
              </span>
            </div>
          );
        })}
      </div>

      {/* Habit rows */}
      <div className="divide-y divide-border">
        {habits.map(habit => {
          const streak = getStreak(habit, completions);
          const rate = getMonthCompletionRate(habit, completions, monthDays);

          return (
            <div key={habit.id} className="flex items-center hover:bg-accent/30 transition-colors">
              {/* Habit name + streak + rate + actions */}
              <div className="w-[260px] shrink-0 flex items-center gap-2 px-4 py-3">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: habit.color }} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{habit.name}</p>
                  <p className="text-[10px] text-muted-foreground">{habit.category}</p>
                </div>
                {streak > 0 && (
                  <div className="flex items-center gap-0.5 text-[10px] font-semibold text-primary shrink-0">
                    <Flame className="w-3 h-3" />
                    {streak}
                  </div>
                )}
                <span className="text-[10px] font-medium text-muted-foreground shrink-0 tabular-nums">{rate}%</span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 rounded hover:bg-accent transition-colors shrink-0">
                      <MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(habit)} className="gap-2 text-xs">
                      <Pencil className="w-3 h-3" /> Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onArchive(habit.id)} className="gap-2 text-xs text-muted-foreground">
                      <Archive className="w-3 h-3" /> Archive
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Day cells */}
              {monthDays.map(day => {
                const dateStr = format(day, "yyyy-MM-dd");
                const isDone = completions.some(c => c.habit_id === habit.id && c.completed_date === dateStr);
                const isFuture = dateStr > today;
                const isTodayDay = dateStr === today;

                return (
                  <div key={dateStr} className="w-8 flex items-center justify-center py-2 shrink-0">
                    <button
                      onClick={() => !isFuture && onToggle(habit.id, dateStr)}
                      className={cn(
                        "w-6 h-6 rounded-md transition-all flex items-center justify-center",
                        isFuture && "opacity-10 cursor-default",
                        !isFuture && !isDone && "border border-border hover:border-primary/50 hover:bg-primary/10",
                        isDone && "shadow-sm",
                        isTodayDay && !isDone && "ring-2 ring-offset-1 ring-primary/40"
                      )}
                      style={isDone ? { background: habit.color } : undefined}
                      title={dateStr}
                    >
                      {isDone && (
                        <svg className="w-3 h-3 text-white" viewBox="0 0 12 12" fill="none">
                          <path d="M2.5 6L5 8.5L9.5 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
      </div>
    </div>
  );
}
