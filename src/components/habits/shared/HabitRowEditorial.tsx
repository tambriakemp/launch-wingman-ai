import { Flame, Link2, Check } from "lucide-react";
import { lightHaptic } from "@/lib/habits/notifications";
import type { Habit } from "@/pages/HabitTracker";

interface Props {
  habit: Habit;
  done: boolean;
  streak: number;
  pairName?: string | null;
  onToggle: () => void;
  onOpen?: () => void;
  /** When true, clicking the row body does nothing (only the check toggles). */
  readOnly?: boolean;
}

/**
 * Editorial habit row — used by Today (desktop + mobile).
 */
export function HabitRowEditorial({ habit, done, streak, pairName, onToggle, onOpen, readOnly }: Props) {
  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    lightHaptic();
    onToggle();
  };
  const clickable = !readOnly && !!onOpen;
  return (
    <div
      onClick={clickable ? onOpen : undefined}
      style={{
        background: done ? "var(--hb-stone)" : "var(--hb-paper)",
        border: "1px solid var(--hb-line)",
        borderRadius: 12,
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        cursor: clickable ? "pointer" : "default",
        transition: "all 200ms ease",
      }}
    >
      <div
        style={{
          width: 38, height: 38, borderRadius: 9,
          background: `${habit.color}33`,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <div style={{ width: 8, height: 8, borderRadius: "50%", background: habit.color }} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontWeight: 500, fontSize: 15, color: "var(--hb-ink)",
            textDecoration: done ? "line-through" : "none",
            opacity: done ? 0.55 : 1,
          }}
        >
          {habit.name}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
          {streak > 0 && (
            <span style={{ fontSize: 11, color: habit.color, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 3 }}>
              <Flame className="w-3 h-3" /> {streak}
            </span>
          )}
          <span style={{ fontSize: 12, color: "var(--hb-mute)" }}>{cadenceLabel(habit.frequency)}</span>
          {pairName && (
            <span className="hb-italic" style={{ fontSize: 12, color: "var(--hb-plum)", display: "inline-flex", alignItems: "center", gap: 3 }}>
              <Link2 className="w-3 h-3" /> after {pairName}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={handleToggle}
        aria-label={done ? "Mark not done" : "Mark done"}
        style={{
          width: 28, height: 28, borderRadius: "50%",
          background: done ? "var(--hb-sage)" : "transparent",
          border: done ? "none" : "1.5px solid var(--hb-cream-deep)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, cursor: "pointer",
        }}
      >
        {done && <Check className="w-3.5 h-3.5" style={{ color: "var(--hb-cream)" }} />}
      </button>
    </div>
  );
}

function cadenceLabel(f: string) {
  if (f === "daily") return "Daily";
  if (f === "weekdays") return "Weekdays";
  if (f === "weekends") return "Weekends";
  return "Custom";
}
