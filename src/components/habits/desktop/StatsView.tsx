import { useMemo } from "react";
import { Flame } from "lucide-react";
import type { Habit, HabitCompletion, StreakShield } from "@/hooks/useHabitsData";
import { getStreak, weekCompletionVector } from "@/lib/habits/streak";
import { buildHeatmap } from "@/lib/habits/heatmap";
import { Heatmap, HeatLegend } from "../shared/Heatmap";
import { PageContainer } from "@/components/layout/PageContainer";

interface Props {
  habits: Habit[];
  completions: HabitCompletion[];
  shields: StreakShield[];
}

export function StatsView({ habits, completions, shields }: Props) {
  const heat = useMemo(() => buildHeatmap(completions, habits.length || 1), [completions, habits.length]);
  const bestStreak = useMemo(() => habits.reduce((acc, h) => Math.max(acc, getStreak(h, completions, shields)), 0), [habits, completions, shields]);
  const bestStreakHabit = habits.find(h => getStreak(h, completions, shields) === bestStreak);

  const weekDoneCount = habits.reduce((acc, h) => acc + weekCompletionVector(h, completions).filter(v => v).length, 0);
  const weekTotal = habits.length * 7 || 1;
  const weekPct = Math.round((weekDoneCount / weekTotal) * 100);

  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      <PageContainer paddingTop={24} paddingBottom={32}>
        {/* Title now lives in the page-level header. */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
        {[
          { l: "This week", v: `${weekPct}%`, c: "var(--hb-ink)", sub: `${weekDoneCount} of ${weekTotal} kept` },
          { l: "Best streak", v: String(bestStreak), c: "var(--hb-terracotta)", sub: bestStreakHabit?.name || "—" },
          { l: "Habits", v: String(habits.length), c: "var(--hb-sage)", sub: "active" },
          { l: "Days kept", v: String(heat.daysKept), c: "var(--hb-plum)", sub: "last 26 weeks" },
        ].map((k, i) => (
          <div key={i} style={{ background: "var(--hb-paper)", border: "1px solid var(--hb-line)", borderRadius: 14, padding: 22 }}>
            <div className="hb-eyebrow">{k.l}</div>
            <div className="hb-display" style={{ fontSize: 48, fontWeight: 500, color: k.c, letterSpacing: "-0.025em", marginTop: 6, lineHeight: 1 }}>{k.v}</div>
            <div style={{ fontSize: 12, color: "var(--hb-mute)", marginTop: 8 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ background: "var(--hb-paper)", border: "1px solid var(--hb-line)", borderRadius: 14, padding: 28, marginBottom: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 18 }}>
          <div>
            <div className="hb-eyebrow">Last 26 weeks</div>
            <div className="hb-display" style={{ fontSize: 22, fontWeight: 500, marginTop: 6 }}>{heat.daysKept} days kept</div>
          </div>
          <HeatLegend />
        </div>
        <Heatmap cols={heat.cols} />
      </div>

      <div style={{ background: "var(--hb-paper)", border: "1px solid var(--hb-line)", borderRadius: 14, padding: 24 }}>
        <div className="hb-eyebrow" style={{ marginBottom: 18 }}>By habit · last 7 days</div>
        {habits.length === 0 ? (
          <div style={{ color: "var(--hb-mute)", fontSize: 14 }}>No habits yet.</div>
        ) : habits.map((h, i) => {
          const week = weekCompletionVector(h, completions);
          const streak = getStreak(h, completions, shields);
          return (
            <div key={h.id} style={{
              display: "grid", gridTemplateColumns: "8px 1.6fr 1fr 1fr 80px",
              alignItems: "center", gap: 16, padding: "14px 0",
              borderTop: i > 0 ? "1px solid var(--hb-line-soft)" : "none",
            }}>
              <div style={{ width: 8, height: 28, borderRadius: 4, background: h.color }} />
              <div style={{ fontSize: 14, fontWeight: 500 }}>{h.name}</div>
              <div style={{ display: "flex", gap: 4 }}>
                {week.map((v, wi) => <div key={wi} style={{ width: 22, height: 22, borderRadius: 4, background: v ? h.color : "var(--hb-line-soft)" }} />)}
              </div>
              <div style={{ fontSize: 12, color: "var(--hb-mute)" }}>{week.filter(v => v).length} of 7</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, justifyContent: "flex-end", fontSize: 16, fontFamily: "var(--hb-display)", color: h.color, fontWeight: 500 }}>
                <Flame className="w-3.5 h-3.5" /> {streak}
              </div>
            </div>
          );
        })}
        </div>
      </PageContainer>
    </div>
  );
}
