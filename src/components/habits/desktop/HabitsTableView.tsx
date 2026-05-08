import { Flame, Edit2 } from "lucide-react";
import type { Habit, HabitCompletion, StreakShield } from "@/hooks/useHabitsData";
import { getStreak, weekCompletionVector } from "@/lib/habits/streak";

interface Props {
  habits: Habit[];
  completions: HabitCompletion[];
  shields: StreakShield[];
  onOpen: (habit: Habit) => void;
  onNew: () => void;
}

export function HabitsTableView({ habits, completions, shields, onOpen, onNew }: Props) {
  const habitMap = new Map(habits.map((h) => [h.id, h]));
  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "32px 56px" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 28, maxWidth: 1180 }}>
        <div>
          <div className="hb-display" style={{ fontWeight: 500, fontSize: 48, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
            Your <em style={{ color: "var(--hb-terracotta)", fontWeight: 400 }}>habits.</em>
          </div>
          <div className="hb-italic" style={{ fontSize: 18, color: "var(--hb-mute)", marginTop: 12 }}>
            Small promises, edited and reordered as life shifts.
          </div>
        </div>
        <button
          onClick={onNew}
          style={{
            fontSize: 13, color: "var(--hb-cream)", background: "var(--hb-ink)",
            padding: "10px 16px", borderRadius: 999, fontWeight: 500, border: "none", cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 8,
          }}
        >+ New habit</button>
      </div>

      <div style={{ background: "var(--hb-paper)", border: "1px solid var(--hb-line)", borderRadius: 14, overflow: "hidden", maxWidth: 1180 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "32px 1.6fr 1fr 0.8fr 0.8fr 1.2fr 32px",
            padding: "14px 20px", gap: 16,
            background: "var(--hb-warm)", borderBottom: "1px solid var(--hb-line)",
          }}
          className="hb-eyebrow"
        >
          <div /><div>Habit</div><div>Time of day</div><div>Cadence</div><div>Streak</div><div>This week</div><div />
        </div>
        {habits.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "var(--hb-mute)" }}>
            No habits yet — start by adding one.
          </div>
        ) : habits.map((h, i) => {
          const week = weekCompletionVector(h, completions);
          const pair = h.pair_with_habit_id ? habitMap.get(h.pair_with_habit_id)?.name : null;
          return (
            <div
              key={h.id}
              onClick={() => onOpen(h)}
              style={{
                display: "grid",
                gridTemplateColumns: "32px 1.6fr 1fr 0.8fr 0.8fr 1.2fr 32px",
                padding: "16px 20px", gap: 16, alignItems: "center",
                borderBottom: i < habits.length - 1 ? "1px solid var(--hb-line-soft)" : "none",
                cursor: "pointer",
              }}
            >
              <div style={{ width: 8, height: 32, borderRadius: 4, background: h.color }} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "var(--hb-ink)" }}>{h.name}</div>
                {pair && (
                  <div className="hb-italic" style={{ fontSize: 11, color: "var(--hb-plum)", marginTop: 2 }}>
                    after {pair}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 13, color: "var(--hb-ink-soft)" }}>
                {(h.time_of_day || []).map(s => s.replace("_", " ")).join(", ") || "All day"}
              </div>
              <div style={{ fontSize: 13, color: "var(--hb-ink-soft)" }}>{cadence(h.frequency)}</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 14, fontFamily: "var(--hb-display)", color: h.color, fontWeight: 500 }}>
                <Flame className="w-3.5 h-3.5" /> {getStreak(h, completions, shields)}
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {week.map((v, wi) => (
                  <div key={wi} style={{ width: 18, height: 18, borderRadius: 4, background: v ? h.color : "var(--hb-line-soft)" }} />
                ))}
              </div>
              <div style={{ color: "var(--hb-mute-soft)" }}><Edit2 className="w-4 h-4" /></div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function cadence(f: string) {
  return f === "daily" ? "Daily" : f === "weekdays" ? "Weekdays" : f === "weekends" ? "Weekends" : "Custom";
}
