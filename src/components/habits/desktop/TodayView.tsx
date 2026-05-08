import { useMemo } from "react";
import { format } from "date-fns";
import { Flame, Shield, Check } from "lucide-react";
import type { Habit, HabitCompletion, StreakShield } from "@/hooks/useHabitsData";
import { getStreak, isHabitScheduledOn } from "@/lib/habits/streak";
import { HabitRowEditorial } from "../shared/HabitRowEditorial";
import { AINudgeCard } from "../shared/AINudgeCard";
import { useHabitNudge } from "@/hooks/useHabitNudge";

interface Props {
  habits: Habit[];
  completions: HabitCompletion[];
  shields: StreakShield[];
  onToggle: (habitId: string) => void;
  onOpen: (habit: Habit) => void;
}

const WEEK = [
  { d: "Mon" }, { d: "Tue" }, { d: "Wed" },
  { d: "Thu" }, { d: "Fri" }, { d: "Sat" }, { d: "Sun" },
];

export function TodayView({ habits, completions, shields, onToggle, onOpen }: Props) {
  const nudge = useHabitNudge(habits, completions, "daily");
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");
  const todayDow = today.getDay() === 0 ? 6 : today.getDay() - 1;
  const monthStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - todayDow);

  const scheduled = useMemo(
    () => habits.filter((h) => isHabitScheduledOn(h, today)),
    [habits, todayStr]
  );

  const groups = useMemo(() => {
    const find = (slot: string) => scheduled.filter((h) => {
      const slots = h.time_of_day && h.time_of_day.length ? h.time_of_day : ["all_day"];
      return slots.includes(slot);
    });
    return [
      { time: "Morning", items: find("morning") },
      { time: "All day", items: find("all_day") },
      { time: "Evening", items: find("evening") },
    ];
  }, [scheduled]);

  const doneCount = scheduled.filter((h) =>
    completions.some((c) => c.habit_id === h.id && c.completed_date === todayStr)
  ).length;
  const ratio = scheduled.length ? doneCount / scheduled.length : 0;

  const bestStreakHabit = useMemo(() => {
    let best: { habit: Habit | null; streak: number } = { habit: null, streak: 0 };
    for (const h of habits) {
      const s = getStreak(h, completions, shields);
      if (s > best.streak) best = { habit: h, streak: s };
    }
    return best;
  }, [habits, completions, shields]);

  const habitMap = new Map(habits.map((h) => [h.id, h]));

  return (
    <div
      style={{
        height: "100%", overflowY: "auto", padding: "32px 56px",
        display: "grid", gridTemplateColumns: "1fr 360px", gap: 36,
      }}
    >
      <div>
        <div style={{ marginBottom: 24 }}>
          <div className="hb-display" style={{ fontWeight: 500, fontSize: 56, letterSpacing: "-0.025em", lineHeight: 1.12 }}>
            Good {greeting()}, <em style={{ color: "var(--hb-terracotta)", fontWeight: 400 }}>there.</em>
          </div>
          <div className="hb-italic" style={{ fontSize: 22, color: "var(--hb-mute)", marginTop: 20, lineHeight: 1.35, maxWidth: 560 }}>
            {scheduled.length === 0
              ? "No habits scheduled for today — a quiet day."
              : `${scheduled.length - doneCount} small ${scheduled.length - doneCount === 1 ? "thing" : "things"} between you and a day worth keeping.`}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, marginBottom: 28 }}>
          {WEEK.map((day, i) => {
            const isToday = i === todayDow;
            const dayDate = new Date(monthStart.getTime() + i * 86400000);
            return (
              <div
                key={i}
                style={{
                  flex: 1, padding: "14px 0", borderRadius: 12,
                  background: isToday ? "var(--hb-ink)" : "var(--hb-paper)",
                  border: isToday ? "none" : "1px solid var(--hb-line)",
                  color: isToday ? "var(--hb-cream)" : "var(--hb-ink)",
                  textAlign: "center",
                }}
              >
                <div className="hb-eyebrow" style={{ color: isToday ? "var(--hb-cream-deep)" : "var(--hb-mute-soft)", marginBottom: 6 }}>
                  {day.d}
                </div>
                <div className="hb-display" style={{ fontSize: 24, fontWeight: 500 }}>{dayDate.getDate()}</div>
                {isToday && <div style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--hb-terracotta)", margin: "6px auto 0" }} />}
              </div>
            );
          })}
        </div>

        {scheduled.length > 0 && (
          <div style={{ marginBottom: 28 }}>
            <AINudgeCard
              eyebrow={nudge.eyebrow}
              body={nudge.loading
                ? "Reading your week…"
                : (nudge.message || "A small promise, kept again, is what makes it a habit.")}
              primaryLabel="Pair them"
              secondaryLabel="Maybe later"
            />
          </div>
        )}

        {groups.map((g) => g.items.length > 0 && (
          <div key={g.time} style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 12 }}>
              <div className="hb-eyebrow">{g.time}</div>
              <div className="hb-italic" style={{ fontSize: 14, color: "var(--hb-mute-soft)" }}>
                {g.items.filter(h => completions.some(c => c.habit_id === h.id && c.completed_date === todayStr)).length} of {g.items.length}
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {g.items.map((h) => {
                const done = completions.some((c) => c.habit_id === h.id && c.completed_date === todayStr);
                const pair = h.pair_with_habit_id ? habitMap.get(h.pair_with_habit_id)?.name ?? null : null;
                return (
                  <HabitRowEditorial
                    key={h.id}
                    habit={h}
                    done={done}
                    streak={getStreak(h, completions, shields)}
                    pairName={pair}
                    onToggle={() => onToggle(h.id)}
                    onOpen={() => onOpen(h)}
                  />
                );
              })}
            </div>
          </div>
        ))}

        {scheduled.length === 0 && (
          <div className="hb-italic" style={{ color: "var(--hb-mute)", fontSize: 16 }}>
            Open the <strong>Add habit</strong> tab to start your first quiet promise.
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        <div style={{ background: "var(--hb-ink)", color: "var(--hb-cream)", borderRadius: 14, padding: 24 }}>
          <div className="hb-eyebrow" style={{ color: "var(--hb-cream-deep)", marginBottom: 16 }}>Today's rhythm</div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ position: "relative", width: 76, height: 76 }}>
              <svg width="76" height="76" viewBox="0 0 76 76">
                <circle cx="38" cy="38" r="32" stroke="rgba(251,247,241,0.15)" strokeWidth="5" fill="none" />
                <circle cx="38" cy="38" r="32" stroke="var(--hb-terracotta)" strokeWidth="5" fill="none"
                  strokeDasharray={`${ratio * 201} 201`} strokeLinecap="round" transform="rotate(-90 38 38)" />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "var(--hb-display)", fontSize: 22, fontWeight: 500 }}>
                {doneCount}/{scheduled.length}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div className="hb-italic" style={{ fontSize: 16, color: "var(--hb-cream)", lineHeight: 1.4 }}>
                {ratio === 1 ? "All kept. The day is yours." : ratio >= 0.5 ? "Halfway there — the evening's all that's left." : "A small start is still a start."}
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: "var(--hb-paper)", border: "1px solid var(--hb-line)", borderRadius: 14, padding: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div className="hb-eyebrow">Best streak</div>
            <Flame className="w-[18px] h-[18px]" style={{ color: "var(--hb-terracotta)" }} />
          </div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
            <span className="hb-display" style={{ fontSize: 48, fontWeight: 500, color: "var(--hb-ink)", letterSpacing: "-0.025em", lineHeight: 1 }}>
              {bestStreakHabit.streak}
            </span>
            <span className="hb-italic" style={{ fontSize: 18, color: "var(--hb-mute)" }}>days kept</span>
          </div>
          <div style={{ fontSize: 13, color: "var(--hb-ink-soft)", marginTop: 10 }}>
            {bestStreakHabit.habit?.name ?? "Build your first streak"}
          </div>
          <div style={{ marginTop: 14, padding: "10px 12px", background: "var(--hb-stone)", borderRadius: 8, display: "flex", alignItems: "center", gap: 10 }}>
            <Shield className="w-4 h-4" style={{ color: "var(--hb-sage)" }} />
            <div style={{ fontSize: 12, color: "var(--hb-ink-soft)", flex: 1 }}>1 streak shield available</div>
            <div style={{ fontSize: 11, color: "var(--hb-mute)" }}>resets monthly</div>
          </div>
        </div>

        {/* Today's chain */}
        <div style={{ background: "var(--hb-warm)", borderRadius: 14, padding: 20 }}>
          <div className="hb-eyebrow" style={{ marginBottom: 12 }}>Today's chain</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {scheduled.length === 0 && (
              <div style={{ fontSize: 13, color: "var(--hb-mute)" }}>Add habits to see today's chain.</div>
            )}
            {scheduled.map((h) => {
              const done = completions.some((c) => c.habit_id === h.id && c.completed_date === todayStr);
              return (
                <div key={h.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "6px 0" }}>
                  <div style={{
                    width: 14, height: 14, borderRadius: "50%",
                    background: done ? "var(--hb-sage)" : "transparent",
                    border: done ? "none" : "1.5px solid var(--hb-cream-deep)",
                    flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {done && <Check className="w-2.5 h-2.5" style={{ color: "var(--hb-cream)" }} />}
                  </div>
                  <span style={{
                    fontSize: 13, color: done ? "var(--hb-mute-soft)" : "var(--hb-ink)",
                    textDecoration: done ? "line-through" : "none",
                    opacity: done ? 0.6 : 1,
                  }}>{h.name}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}
