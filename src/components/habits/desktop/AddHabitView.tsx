import { useState, useMemo } from "react";
import { Bell, Link2, Settings2 } from "lucide-react";
import type { Habit } from "@/hooks/useHabitsData";
import { toast } from "sonner";
import { useHabitTags } from "@/hooks/useHabitTags";
import { ManageTagsDialog } from "../ManageTagsDialog";

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
const DAYS = [
  { id: "MO", label: "M" }, { id: "TU", label: "T" }, { id: "WE", label: "W" },
  { id: "TH", label: "T" }, { id: "FR", label: "F" }, { id: "SA", label: "S" }, { id: "SU", label: "S" },
];

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

function Field({ label, children, hint, action }: { label: string; children: React.ReactNode; hint?: string; action?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <div className="hb-eyebrow">{label}</div>
        {action}
      </div>
      {children}
      {hint && <div className="hb-italic" style={{ fontSize: 13, color: "var(--hb-mute-soft)", marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

export function AddHabitView({ habits, onSubmit, onCancel }: Props) {
  const { tags, colorFor } = useHabitTags();
  const [name, setName] = useState("Walk after dinner");
  const [time, setTime] = useState("evening");
  const [cadence, setCadence] = useState("daily");
  const [customDays, setCustomDays] = useState<string[]>(["MO", "WE", "FR"]);
  const [pairWith, setPairWith] = useState<string>("");
  const [reminderTime, setReminderTime] = useState("19:30");
  const [tag, setTag] = useState(tags[0]?.name || "Body");
  const [saving, setSaving] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);

  const previewColor = colorFor(tag);
  const pairName = useMemo(
    () => habits.find((h) => h.id === pairWith)?.name || null,
    [habits, pairWith]
  );

  const toggleDay = (d: string) => {
    setCustomDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  };

  const save = async () => {
    if (!name.trim()) { toast.error("Give the habit a name"); return; }
    if (cadence === "custom" && customDays.length === 0) { toast.error("Pick at least one day"); return; }
    setSaving(true);
    try {
      const freq = cadence === "3xweek" ? "custom" : cadence === "custom" ? "custom" : cadence;
      const days = cadence === "3xweek" ? ["MO", "WE", "FR"] : cadence === "custom" ? customDays : null;
      await onSubmit({
        name: name.trim(),
        category: "personal",
        color: previewColor,
        icon: "circle",
        frequency: freq,
        frequency_days: days,
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
          {cadence === "custom" && (
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
              {DAYS.map((d) => {
                const active = customDays.includes(d.id);
                return (
                  <button
                    key={d.id}
                    onClick={() => toggleDay(d.id)}
                    aria-label={d.id}
                    style={{
                      width: 40, height: 40, borderRadius: "50%",
                      border: `1px solid ${active ? "var(--hb-ink)" : "var(--hb-line)"}`,
                      background: active ? "var(--hb-ink)" : "var(--hb-paper)",
                      color: active ? "var(--hb-cream)" : "var(--hb-ink)",
                      fontSize: 13, fontWeight: 500, cursor: "pointer",
                    }}
                  >{d.label}</button>
                );
              })}
            </div>
          )}
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

        <Field
          label="Tag"
          action={
            <button
              onClick={() => setTagsOpen(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 12, fontWeight: 500, color: "var(--hb-mute)", background: "transparent", border: "none", cursor: "pointer" }}
            >
              <Settings2 className="w-3.5 h-3.5" /> Manage
            </button>
          }
        >
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {tags.map((t) => (
              <Pill key={t.name} color={t.color} active={tag === t.name} onClick={() => setTag(t.name)}>{t.name}</Pill>
            ))}
            {tags.length === 0 && (
              <span className="hb-italic" style={{ fontSize: 13, color: "var(--hb-mute)" }}>No tags — add one via Manage.</span>
            )}
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
              <span style={{ fontSize: 11, color: "var(--hb-mute)" }}>
                {cadence === "custom" ? `${customDays.length} day${customDays.length === 1 ? "" : "s"}/wk` : (CADENCES.find(c => c.id === cadence)?.label || "Daily")}
              </span>
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
      </div>

      <ManageTagsDialog open={tagsOpen} onOpenChange={setTagsOpen} />
    </div>
  );
}
