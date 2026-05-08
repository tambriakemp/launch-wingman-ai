import { useState, useMemo } from "react";
import { Bell, Link2 } from "lucide-react";
import type { Habit } from "@/hooks/useHabitsData";
import { toast } from "sonner";

interface Props {
  habits: Habit[];
  onSubmit: (data: Partial<Habit>) => Promise<void>;
  onCancel: () => void;
}

const TIMES = ["morning", "all_day", "evening", "anytime"];
const TIME_LABELS: Record<string, string> = { morning: "Morning", all_day: "All day", evening: "Evening", anytime: "Anytime" };
const CADENCES = [
  { id: "daily", label: "Daily" },
  { id: "weekdays", label: "Weekdays" },
  { id: "3xweek", label: "3 × per week" },
  { id: "custom", label: "Custom days…" },
];
const TAG_COLORS: Record<string, string> = {
  Care: "#C65A3E",
  Body: "#4F6B52",
  Mind: "#4F6B52",
  Rhythm: "#6B3A5C",
  Launch: "#C48B2E",
};

function Pill({ children, active, color, onClick }: { children: React.ReactNode; active?: boolean; color?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 14px", borderRadius: 999,
        fontSize: 13, fontWeight: 500,
        border: `1px solid ${active ? "var(--hb-ink)" : "var(--hb-line)"}`,
        background: active ? "var(--hb-ink)" : "var(--hb-paper)",
        color: active ? "var(--hb-cream)" : "var(--hb-ink)",
        display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer",
      }}
    >
      {color && <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />}
      {children}
    </button>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div className="hb-eyebrow" style={{ marginBottom: 8 }}>{label}</div>
      {children}
      {hint && <div className="hb-italic" style={{ fontSize: 13, color: "var(--hb-mute-soft)", marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

export function AddHabitView({ habits, onSubmit, onCancel }: Props) {
  const [name, setName] = useState("Walk after dinner");
  const [time, setTime] = useState("evening");
  const [cadence, setCadence] = useState("daily");
  const [pairWith, setPairWith] = useState<string>("");
  const [reminderTime, setReminderTime] = useState("19:30");
  const [tag, setTag] = useState("Body");
  const [saving, setSaving] = useState(false);

  const previewColor = TAG_COLORS[tag] || "#4F6B52";
  const pairName = useMemo(
    () => habits.find((h) => h.id === pairWith)?.name || null,
    [habits, pairWith]
  );

  const save = async () => {
    if (!name.trim()) { toast.error("Give the habit a name"); return; }
    setSaving(true);
    try {
      const freq = cadence === "3xweek" ? "custom" : cadence === "custom" ? "custom" : cadence;
      await onSubmit({
        name: name.trim(),
        category: "personal",
        color: previewColor,
        icon: "circle",
        frequency: freq,
        frequency_days: cadence === "3xweek" ? ["MO", "WE", "FR"] : null,
        time_of_day: time === "anytime" ? [] : [time],
        reminder_times: [],
        pair_with_habit_id: pairWith || null,
        tag: tag || null,
        reminder_time: reminderTime ? `${reminderTime}:00` : null,
      });
      onCancel();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        height: "100%", overflowY: "auto", padding: "32px 56px",
        display: "grid", gridTemplateColumns: "1fr 380px", gap: 36,
      }}
    >
      <div style={{ maxWidth: 720 }}>
        <div className="hb-display" style={{ fontWeight: 500, fontSize: 48, letterSpacing: "-0.025em", lineHeight: 1.1 }}>
          Add a <em style={{ color: "var(--hb-terracotta)", fontWeight: 400 }}>new habit.</em>
        </div>
        <div className="hb-italic" style={{ fontSize: 18, color: "var(--hb-mute)", marginTop: 12, marginBottom: 32 }}>
          Keep it small enough that you'll do it on a hard day.
        </div>

        <Field label="What's the habit?" hint='Sentence case, action-first. e.g. "Read for 20 minutes," not "Reading."'>
          <input
            type="text" value={name} onChange={(e) => setName(e.target.value)}
            style={{
              width: "100%", padding: "14px 16px", fontSize: 18,
              fontFamily: "var(--hb-body)", color: "var(--hb-ink)",
              background: "var(--hb-paper)", border: "1px solid var(--hb-line)",
              borderRadius: 10, outline: "none",
            }}
          />
        </Field>

        <Field label="Time of day">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {TIMES.map((t) => (
              <Pill key={t} active={time === t} onClick={() => setTime(t)}>{TIME_LABELS[t]}</Pill>
            ))}
          </div>
        </Field>

        <Field label="Cadence" hint="How often you want to keep this. Skipping a non-scheduled day doesn't break your streak.">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CADENCES.map((c) => (
              <Pill key={c.id} active={cadence === c.id} onClick={() => setCadence(c.id)}>{c.label}</Pill>
            ))}
          </div>
        </Field>

        <Field label="Pair with (optional)" hint="Anchor this habit to one you already do.">
          <div style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "12px 16px", background: "var(--hb-paper)",
            border: "1px solid var(--hb-line)", borderRadius: 10,
          }}>
            <Link2 className="w-4 h-4" style={{ color: "var(--hb-plum)" }} />
            <span className="hb-italic" style={{ fontSize: 15, color: "var(--hb-mute)" }}>after</span>
            <select
              value={pairWith} onChange={(e) => setPairWith(e.target.value)}
              style={{
                flex: 1, fontSize: 14, fontWeight: 500, color: "var(--hb-ink)",
                background: "transparent", border: "none", outline: "none", cursor: "pointer",
              }}
            >
              <option value="">— Choose a habit —</option>
              {habits.map((h) => <option key={h.id} value={h.id}>{h.name}</option>)}
            </select>
          </div>
        </Field>

        <Field label="Reminder">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Pill active><Bell className="w-3 h-3" /> Remind me</Pill>
            <span style={{ fontSize: 13, color: "var(--hb-mute)" }}>at</span>
            <input
              type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)}
              style={{
                width: 120, padding: "8px 12px", fontSize: 14,
                fontFamily: "var(--hb-body)", color: "var(--hb-ink)",
                background: "var(--hb-paper)", border: "1px solid var(--hb-line)",
                borderRadius: 8, outline: "none",
              }}
            />
          </div>
        </Field>

        <Field label="Tag">
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {Object.keys(TAG_COLORS).map((t) => (
              <Pill key={t} color={TAG_COLORS[t]} active={tag === t} onClick={() => setTag(t)}>{t}</Pill>
            ))}
          </div>
        </Field>

        <div style={{ display: "flex", gap: 12, marginTop: 36, paddingTop: 24, borderTop: "1px solid var(--hb-line)" }}>
          <button
            onClick={save} disabled={saving}
            style={{
              fontSize: 14, fontWeight: 500, color: "var(--hb-cream)",
              background: "var(--hb-ink)", padding: "12px 24px",
              borderRadius: 999, border: "none", cursor: "pointer",
            }}
          >
            {saving ? "Saving…" : "Add habit"}
          </button>
          <button
            onClick={onCancel}
            style={{
              fontSize: 14, fontWeight: 500, color: "var(--hb-mute)",
              padding: "12px 16px", background: "transparent", border: "none", cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Live preview */}
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div className="hb-eyebrow">Preview</div>
        <div style={{
          background: "var(--hb-paper)", border: "1px solid var(--hb-line)", borderRadius: 12,
          padding: "14px 16px", display: "flex", alignItems: "center", gap: 12,
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: `${previewColor}20`, border: `1.5px solid ${previewColor}55`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: previewColor }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--hb-ink)" }}>{name || "New habit"}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
              <span style={{ fontSize: 11, color: "var(--hb-mute)" }}>{CADENCES.find(c => c.id === cadence)?.label || "Daily"}</span>
              {pairName && (
                <>
                  <span style={{ width: 2, height: 2, borderRadius: "50%", background: "var(--hb-cream-deep)" }} />
                  <span className="hb-italic" style={{ fontSize: 11, color: "var(--hb-plum)", display: "inline-flex", alignItems: "center", gap: 3 }}>
                    <Link2 className="w-3 h-3" /> after {pairName}
                  </span>
                </>
              )}
            </div>
          </div>
          <div style={{ width: 26, height: 26, borderRadius: "50%", border: "1.5px solid var(--hb-cream-deep)" }} />
        </div>

        {pairName && (
          <div style={{
            background: "var(--hb-terracotta-bg)", border: "1px solid var(--hb-terracotta-border)",
            borderRadius: 14, padding: 18, display: "flex", gap: 12, alignItems: "flex-start",
          }}>
            <div style={{
              width: 28, height: 28, borderRadius: "50%", background: "var(--hb-terracotta)",
              color: "var(--hb-cream)", display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: "var(--hb-display)", fontStyle: "italic", fontWeight: 500, fontSize: 14, flexShrink: 0,
            }}>L</div>
            <div className="hb-italic" style={{ fontSize: 14, color: "var(--hb-terracotta-deep)", lineHeight: 1.45 }}>
              Pairing with "{pairName}" gives this a built-in cue. I'll start tracking tonight.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
