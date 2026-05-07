import { useRef, useState } from "react";
import { Flame, Pencil, Trash2 } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import type { Habit } from "@/pages/HabitTracker";

interface HabitStatsRowProps {
  habit: Habit;
  streak: number;
  rate: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function HabitStatsRow({ habit, streak, rate, onEdit, onDelete }: HabitStatsRowProps) {
  const isMobile = useIsMobile();
  const [swiped, setSwiped] = useState(false);
  const startX = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (startX.current == null) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (dx < -40) setSwiped(true);
    else if (dx > 40) setSwiped(false);
    startX.current = null;
  };

  return (
    <div className="relative overflow-hidden rounded-2xl">
      {/* Reveal actions (mobile swipe) */}
      <div className="absolute inset-0 flex justify-end">
        <button
          onClick={() => { onEdit(); setSwiped(false); }}
          className="w-[72px] flex items-center justify-center bg-primary text-primary-foreground"
          aria-label="Edit"
        >
          <Pencil className="w-5 h-5" />
        </button>
        <button
          onClick={() => { onDelete(); setSwiped(false); }}
          className="w-[72px] flex items-center justify-center bg-destructive text-destructive-foreground"
          aria-label="Delete"
        >
          <Trash2 className="w-5 h-5" />
        </button>
      </div>

      {/* Foreground */}
      <div
        onTouchStart={isMobile ? handleTouchStart : undefined}
        onTouchEnd={isMobile ? handleTouchEnd : undefined}
        onClick={() => {
          if (swiped) { setSwiped(false); return; }
          if (!isMobile) return;
          onEdit();
        }}
        style={{
          transform: swiped ? "translateX(-144px)" : "translateX(0)",
          transition: "transform 240ms cubic-bezier(0.22,0.61,0.36,1)",
        }}
        className="relative flex items-center gap-3 rounded-2xl border border-border bg-card p-3"
      >
        <div
          className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center"
          style={{ background: `${habit.color}20` }}
        >
          <div className="w-4 h-4 rounded-full" style={{ background: habit.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">{habit.name}</p>
          <p className="text-xs text-muted-foreground">{habit.category}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1 text-xs font-semibold text-primary">
            <Flame className="w-3.5 h-3.5" />
            {streak}
          </div>
          <span className={cn("text-xs font-semibold tabular-nums", rate >= 70 ? "text-primary" : "text-muted-foreground")}>
            {rate}%
          </span>
          {/* Desktop CRUD buttons */}
          {!isMobile && (
            <div className="flex items-center gap-1 ml-1">
              <button
                onClick={(e) => { e.stopPropagation(); onEdit(); }}
                className="p-1.5 rounded-lg hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Edit habit"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(); }}
                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Delete habit"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
