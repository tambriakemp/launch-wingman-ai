import { useMemo } from "react";
import { ChevronLeft, Flame } from "lucide-react";
import type { Habit, HabitCompletion, StreakShield } from "@/hooks/useHabitsData";
import { getStreak, weekCompletionVector } from "@/lib/habits/streak";
import { buildHeatmap } from "@/lib/habits/heatmap";
import { Heatmap, HeatLegend } from "../shared/Heatmap";

interface Props {
  habits: Habit[];
  completions: HabitCompletion[];
  shields: StreakShield[];
  onBack: () => void;
}

export function MobileStatsScreen({ habits, completions, shields, onBack }: Props) {
  const heat = useMemo(() => buildHeatmap(completions, habits.length || 1), [completions, habits.length]);
  const bestStreak = useMemo(
    () => habits.reduce((acc, h) => Math.max(acc, getStreak(h, completions, shields)), 0),
    [habits, completions, shields]
  );
  const bestStreakHabit = habits.find(h => getStreak(h, completions, shields) === bestStreak);
  const weekDoneCount = habits.reduce((acc, h) => acc + weekCompletionVector(h, completions).filter(v => v).length, 0);
  const weekTotal = habits.length * 7 || 1;
  const weekPct = Math.round((weekDoneCount / weekTotal) * 100);

  return (
    <div style={{ background: "var(--hb-cream)", minHeight: "100vh", paddingBottom: 110 }}>
      {/* Header */}
      <div style={{ padding: "16px 20px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onBack} aria-label="Back"
          style={{
            width: 38, height: 38, borderRadius: "50%",
            background: "var(--hb-paper)", border: "1px solid var(--hb-line)",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
          }}
        >
          <ChevronLeft className="w-4 h-4" style={{ color: "var(--hb-ink)" }} />
        </button>
        <div className="hb-eyebrow">Statistics</div>
      </div>

      <div style={{ padding: "14px 20px 0" }}>
        <div className="hb-display" style={{ fontWeight: 500, fontSize: 30, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
          A quiet kind of <em style={{ color: "var(--hb-terracotta)", fontWeight: 400 }}>consistency.</em>
        </div>
        <div className="hb-italic" style={{ fontSize: 14, color: "var(--hb-mute)", marginTop: 8 }}>
          {habits.length} habit{habits.length === 1 ? "" : "s"} you're building right now.
        </div>
      </div>

      {/* KPI grid 2x2 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "20px 20px 0" }}>
        {[
          { l: "This week", v: `${weekPct}%`, c: "var(--hb-ink)", sub: `${weekDoneCount} of ${weekTotal}` },
          { l: "Best streak", v: String(bestStreak), c: "var(--hb-terracotta)", sub: bestStreakHabit?.name || "—" },
          { l: "Habits", v: String(habits.length), c: "var(--hb-sage)", sub: "active" },
          { l: "Days kept", v: String(heat.daysKept), c: "var(--hb-plum)", sub: "26 weeks" },
        ].map((k, i) => (
          <div key={i} style={{ background: "var(--hb-paper)", border: "1px solid var(--hb-line)", borderRadius: 14, padding: 16 }}>
            <div className="hb-eyebrow" style={{ fontSize: 10 }}>{k.l}</div>
            <div className="hb-display" style={{ fontSize: 32, fontWeight: 500, color: k.c, letterSpacing: "-0.025em", marginTop: 4, lineHeight: 1 }}>{k.v}</div>
            <div style={{ fontSize: 11, color: "var(--hb-mute)", marginTop: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <div style={{ margin: "16px 20px 0", padding: 18, background: "var(--hb-paper)", border: "1px solid var(--hb-line)", borderRadius: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
          <div>
            <div className="hb-eyebrow" style={{ fontSize: 10 }}>Last 26 weeks</div>
            <div className="hb-display" style={{ fontSize: 18, fontWeight: 500, marginTop: 4 }}>{heat.daysKept} days kept</div>
          </div>
        </div>
        <div style={{ overflowX: "auto", marginBottom: 10 }}>
          <Heatmap cols={heat.cols} cellSize={10} gap={3} />
        </div>
        <HeatLegend />
      </div>

      {/* By habit */}
      <div style={{ margin: "16px 20px 0", padding: 18, background: "var(--hb-paper)", border: "1px solid var(--hb-line)", borderRadius: 14 }}>
        <div className="hb-eyebrow" style={{ marginBottom: 14, fontSize: 10 }}>By habit · last 7 days</div>
        {habits.length === 0 ? (
          <div style={{ color: "var(--hb-mute)", fontSize: 13 }}>No habits yet.</div>
        ) : habits.map((h, i) => {
          const week = weekCompletionVector(h, completions);
          const streak = getStreak(h, completions, shields);
          return (
            <div key={h.id} style={{
              padding: "12px 0",
              borderTop: i > 0 ? "1px solid var(--hb-line-soft)" : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <div style={{ width: 6, height: 22, borderRadius: 3, background: h.color }} />
                <div style={{ flex: 1, fontSize: 13, fontWeight: 500, color: "var(--hb-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.name}</div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 14, fontFamily: "var(--hb-display)", color: h.color, fontWeight: 500 }}>
                  <Flame className="w-3 h-3" /> {streak}
                </div>
              </div>
              <div style={{ display: "flex", gap: 4, paddingLeft: 16 }}>
                {week.map((v, wi) => (
                  <div key={wi} style={{ flex: 1, aspectRatio: "1", maxWidth: 24, borderRadius: 4, background: v ? h.color : "var(--hb-line-soft)" }} />
                ))}
              </div>
              <div style={{ fontSize: 11, color: "var(--hb-mute)", marginTop: 6, paddingLeft: 16 }}>{week.filter(v => v).length} of 7 days</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
