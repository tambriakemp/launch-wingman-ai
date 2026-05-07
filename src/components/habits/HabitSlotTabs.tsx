import { cn } from "@/lib/utils";

export type HabitSlot = "all_day" | "morning" | "afternoon" | "evening";

const SLOTS: { id: HabitSlot; label: string }[] = [
  { id: "all_day", label: "All Day" },
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
];

interface HabitSlotTabsProps {
  value: HabitSlot;
  onChange: (slot: HabitSlot) => void;
  counts?: Partial<Record<HabitSlot, number>>;
}

export function HabitSlotTabs({ value, onChange, counts }: HabitSlotTabsProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto -mx-1 px-1">
      {SLOTS.map((s) => {
        const isActive = value === s.id;
        const count = counts?.[s.id];
        return (
          <button
            key={s.id}
            onClick={() => onChange(s.id)}
            className={cn(
              "shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-colors flex items-center gap-1.5",
              isActive
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            {s.label}
            {count !== undefined && count > 0 && (
              <span className={cn(
                "text-[10px] px-1.5 rounded-full",
                isActive ? "bg-background/20 text-background" : "bg-background text-foreground/70",
              )}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
