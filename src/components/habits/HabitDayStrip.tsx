import { format, addDays, startOfDay, isSameDay } from "date-fns";
import { cn } from "@/lib/utils";

interface HabitDayStripProps {
  selectedDate: Date;
  onSelect: (date: Date) => void;
  daysBefore?: number;
  daysAfter?: number;
}

export function HabitDayStrip({ selectedDate, onSelect, daysBefore = 3, daysAfter = 3 }: HabitDayStripProps) {
  const today = startOfDay(new Date());
  const start = addDays(today, -daysBefore);
  const days = Array.from({ length: daysBefore + daysAfter + 1 }, (_, i) => addDays(start, i));

  return (
    <div className="flex items-center justify-between gap-1 overflow-x-auto -mx-1 px-1">
      {days.map((day) => {
        const isSelected = isSameDay(day, selectedDate);
        const isToday = isSameDay(day, today);
        return (
          <button
            key={day.toISOString()}
            onClick={() => onSelect(day)}
            className={cn(
              "flex-1 min-w-[42px] flex flex-col items-center justify-center py-2 rounded-2xl transition-colors",
              isSelected ? "bg-primary/10" : "hover:bg-accent",
            )}
          >
            <span className={cn(
              "text-[10px] font-medium uppercase tracking-wide",
              isSelected ? "text-primary" : "text-muted-foreground",
            )}>
              {format(day, "EEE")}
            </span>
            <span className={cn(
              "text-base font-semibold mt-0.5 tabular-nums",
              isSelected ? "text-primary" : isToday ? "text-foreground" : "text-foreground/80",
            )}>
              {format(day, "d")}
            </span>
          </button>
        );
      })}
    </div>
  );
}
