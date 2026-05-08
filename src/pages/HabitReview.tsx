import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { HabitsThemeShell } from "@/components/habits/HabitsThemeShell";
import { useHabitsData } from "@/hooks/useHabitsData";
import { useHabitNudge } from "@/hooks/useHabitNudge";
import { getStreak, isHabitScheduledOn } from "@/lib/habits/streak";
import { format, subDays } from "date-fns";
import { ArrowLeft, Flame } from "lucide-react";

export default function HabitReview() {
  const navigate = useNavigate();
  const { habits, completions, shields, loading } = useHabitsData();
  const { message: weekly, loading: nudgeLoading } = useHabitNudge(habits, completions, "weekly");

  const last7 = useMemo(() => Array.from({ length: 7 }, (_, i) => subDays(new Date(), 6 - i)), []);
  const stats = useMemo(() => {
    let scheduledTotal = 0;
    let doneTotal = 0;
    const dateSet = new Set(last7.map(d => format(d, "yyyy-MM-dd")));
    for (const h of habits) {
      for (const d of last7) {
        if (isHabitScheduledOn(h, d)) scheduledTotal++;
      }
    }
    for (const c of completions) {
      if (dateSet.has(c.completed_date)) doneTotal++;
    }
    const ratio = scheduledTotal ? Math.round((doneTotal / scheduledTotal) * 100) : 0;
    return { scheduledTotal, doneTotal, ratio };
  }, [habits, completions, last7]);

  const topStreaks = useMemo(() => {
    return habits
      .map(h => ({ habit: h, streak: getStreak(h, completions, shields) }))
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 3);
  }, [habits, completions, shields]);

  return (
    <ProjectLayout>
      <HabitsThemeShell>
        <div style={{ background: "var(--hb-cream)", minHeight: "100vh", padding: "32px 24px 80px" }}>
          <div style={{ maxWidth: 720, margin: "0 auto" }}>
            <button
              onClick={() => navigate("/habits")}
              style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, color: "var(--hb-mute)", background: "transparent", border: "none", cursor: "pointer", marginBottom: 24 }}
            >
              <ArrowLeft className="w-4 h-4" /> Back to habits
            </button>

            <div className="hb-eyebrow">Sunday review</div>
            <div className="hb-display" style={{ fontSize: 44, fontWeight: 500, letterSpacing: "-0.025em", lineHeight: 1.1, marginTop: 6 }}>
              The week, <em style={{ color: "var(--hb-terracotta)", fontWeight: 400 }}>quietly noted.</em>
            </div>

            {loading ? (
              <div style={{ marginTop: 32, color: "var(--hb-mute)" }}>Loading…</div>
            ) : (
              <>
                <div style={{ marginTop: 28, padding: 24, background: "var(--hb-ink)", color: "var(--hb-cream)", borderRadius: 14 }}>
                  <div className="hb-eyebrow" style={{ color: "var(--hb-cream-deep)" }}>This week</div>
                  <div className="hb-italic" style={{ fontSize: 18, marginTop: 10, lineHeight: 1.45 }}>
                    {nudgeLoading ? "Reflecting…" : (weekly || "A week kept, however imperfectly, is still a week kept.")}
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginTop: 20 }}>
                  <Tile label="Kept" value={String(stats.doneTotal)} />
                  <Tile label="Scheduled" value={String(stats.scheduledTotal)} />
                  <Tile label="Rhythm" value={`${stats.ratio}%`} />
                </div>

                <div style={{ marginTop: 28 }}>
                  <div className="hb-eyebrow" style={{ marginBottom: 12 }}>Longest streaks</div>
                  <div style={{ background: "var(--hb-paper)", border: "1px solid var(--hb-line)", borderRadius: 14, overflow: "hidden" }}>
                    {topStreaks.length === 0 && (
                      <div style={{ padding: 24, color: "var(--hb-mute)" }}>No streaks yet.</div>
                    )}
                    {topStreaks.map((s, i) => (
                      <div key={s.habit.id} style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: 12, borderTop: i === 0 ? "none" : "1px solid var(--hb-line-soft)" }}>
                        <div style={{ width: 8, height: 28, borderRadius: 4, background: s.habit.color }} />
                        <div style={{ flex: 1, fontSize: 14, color: "var(--hb-ink)", fontWeight: 500 }}>{s.habit.name}</div>
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, color: s.habit.color, fontFamily: "var(--hb-display)", fontWeight: 500 }}>
                          <Flame className="w-4 h-4" /> {s.streak}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </HabitsThemeShell>
    </ProjectLayout>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: "var(--hb-paper)", border: "1px solid var(--hb-line)", borderRadius: 12, padding: 16, textAlign: "center" }}>
      <div className="hb-eyebrow">{label}</div>
      <div className="hb-display" style={{ fontSize: 32, fontWeight: 500, color: "var(--hb-ink)", marginTop: 6 }}>{value}</div>
    </div>
  );
}
