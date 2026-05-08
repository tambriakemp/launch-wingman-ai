import { useState, useMemo, useEffect } from "react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Bell, Link2, X, Settings2 } from "lucide-react";
import type { Habit } from "@/hooks/useHabitsData";
import { toast } from "sonner";
import { useHabitTags } from "@/hooks/useHabitTags";
import { ManageTagsDialog } from "../ManageTagsDialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habits: Habit[];
  habit?: Habit | null;
  onSubmit: (data: Partial<Habit>) => Promise<void>;
}

const TIMES = ["morning", "all_day", "evening", "anytime"];
const TIME_LABELS: Record<string, string> = { morning: "Morning", all_day: "All day", evening: "Evening", anytime: "Anytime" };
const CADENCES = [
  { id: "daily", label: "Daily" },
  { id: "weekdays", label: "Weekdays" },
  { id: "3xweek", label: "3 × per week" },
  { id: "custom", label: "Custom" },
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
        padding: "9px 14px", borderRadius: 999,
        fontSize: 13, fontWeight: 500,
        border: `1px solid ${active ? "var(--hb-ink)" : "var(--hb-line)"}`,
        background: active ? "var(--hb-ink)" : "var(--hb-paper)",
        color: active ? "var(--hb-cream)" : "var(--hb-ink)",
        display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
      }}
    >
      {color && <div style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />}
      {children}
    </button>
  );
}

function Section({ label, children, hint, action }: { label: string; children: React.ReactNode; hint?: string; action?: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <div className="hb-eyebrow">{label}</div>
        {action}
      </div>
      {children}
      {hint && <div className="hb-italic" style={{ fontSize: 12, color: "var(--hb-mute-soft)", marginTop: 6 }}>{hint}</div>}
    </div>
  );
}

export function MobileAddHabitDrawer({ open, onOpenChange, habits, habit, onSubmit }: Props) {
  const isEdit = !!habit;
  const { tags, colorFor } = useHabitTags();
  const [name, setName] = useState("");
  const [time, setTime] = useState("morning");
  const [cadence, setCadence] = useState("daily");
  const [customDays, setCustomDays] = useState<string[]>(["MO", "WE", "FR"]);
  const [pairWith, setPairWith] = useState<string>("");
  const [reminderTime, setReminderTime] = useState("08:00");
  const [tag, setTag] = useState(tags[0]?.name || "Body");
  const [saving, setSaving] = useState(false);
  const [tagsOpen, setTagsOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (habit) {
      setName(habit.name);
      setTime(habit.time_of_day?.[0] || "anytime");
      const isThree = habit.frequency === "custom" && habit.frequency_days?.length === 3
        && ["MO", "WE", "FR"].every(d => habit.frequency_days?.includes(d));
      setCadence(isThree ? "3xweek" : habit.frequency || "daily");
      setCustomDays(habit.frequency === "custom" && !isThree ? (habit.frequency_days || []) : ["MO", "WE", "FR"]);
      setPairWith(habit.pair_with_habit_id || "");
      setReminderTime(habit.reminder_time?.slice(0, 5) || "08:00");
      setTag(habit.tag || tags[0]?.name || "Body");
    } else {
      setName("");
      setTime("morning");
      setCadence("daily");
      setCustomDays(["MO", "WE", "FR"]);
      setPairWith("");
      setReminderTime("08:00");
      setTag(tags[0]?.name || "Body");
    }
  }, [open, habit]);

  const previewColor = colorFor(tag);
  const pairName = useMemo(() => habits.find(h => h.id === pairWith)?.name || null, [habits, pairWith]);
  const otherHabits = habits.filter(h => !habit || h.id !== habit.id);

  const toggleDay = (d: string) => {
    setCustomDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const save = async () => {
    if (!name.trim()) { toast.error("Give the habit a name"); return; }
    if (cadence === "custom" && customDays.length === 0) { toast.error("Pick at least one day"); return; }
    setSaving(true);
    try {
      const freq = cadence === "3xweek" ? "custom" : cadence;
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
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        className="border-0 p-0"
        style={{ background: "var(--hb-cream)", maxHeight: "92vh" }}
      >
        <div className="hb-theme" style={{ display: "flex", flexDirection: "column", height: "100%", maxHeight: "92vh" }}>
          {/* Header */}
          <div style={{ padding: "8px 16px 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div className="hb-eyebrow">{isEdit ? "Edit" : "New"}</div>
              <div className="hb-display" style={{ fontWeight: 500, fontSize: 26, letterSpacing: "-0.02em", lineHeight: 1.1, marginTop: 2 }}>
                {isEdit ? "Edit habit" : <>A <em style={{ color: "var(--hb-terracotta)", fontWeight: 400 }}>new habit.</em></>}
              </div>
            </div>
            <button
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              style={{ width: 36, height: 36, borderRadius: "50%", background: "var(--hb-paper)", border: "1px solid var(--hb-line)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
            >
              <X className="w-4 h-4" style={{ color: "var(--hb-ink)" }} />
            </button>
          </div>

          {/* Live preview */}
          <div style={{ margin: "0 16px 14px", padding: "12px 14px", background: "var(--hb-paper)", border: "1px solid var(--hb-line)", borderRadius: 12, display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 8,
              background: `${previewColor}20`, border: `1.5px solid ${previewColor}55`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: previewColor }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 500, color: "var(--hb-ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {name || "New habit"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                <span style={{ fontSize: 11, color: "var(--hb-mute)" }}>
                  {cadence === "custom" ? `${customDays.length} day${customDays.length === 1 ? "" : "s"}/wk` : CADENCES.find(c => c.id === cadence)?.label}
                </span>
                {pairName && (
                  <span className="hb-italic" style={{ fontSize: 11, color: "var(--hb-plum)", display: "inline-flex", alignItems: "center", gap: 3 }}>
                    <Link2 className="w-3 h-3" /> after {pairName}
                  </span>
                )}
              </div>
            </div>
            <div style={{ width: 24, height: 24, borderRadius: "50%", border: "1.5px solid var(--hb-cream-deep)" }} />
          </div>

          {/* Scrollable form */}
          <div style={{ flex: 1, overflowY: "auto", padding: "4px 16px 24px" }}>
            <Section label="What's the habit?" hint='Action-first. e.g. "Read for 20 minutes."'>
              <input
                type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Walk after dinner"
                style={{
                  width: "100%", padding: "13px 14px", fontSize: 16,
                  fontFamily: "var(--hb-body)", color: "var(--hb-ink)",
                  background: "var(--hb-paper)", border: "1px solid var(--hb-line)",
                  borderRadius: 10, outline: "none",
                }}
              />
            </Section>

            <Section label="Time of day">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {TIMES.map(t => <Pill key={t} active={time === t} onClick={() => setTime(t)}>{TIME_LABELS[t]}</Pill>)}
              </div>
            </Section>

            <Section label="Cadence">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {CADENCES.map(c => <Pill key={c.id} active={cadence === c.id} onClick={() => setCadence(c.id)}>{c.label}</Pill>)}
              </div>
              {cadence === "custom" && (
                <div style={{ marginTop: 12, display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {DAYS.map((d) => {
                    const active = customDays.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        onClick={() => toggleDay(d.id)}
                        aria-label={d.id}
                        style={{
                          width: 38, height: 38, borderRadius: "50%",
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
            </Section>

            {otherHabits.length > 0 && (
              <Section label="Pair with (optional)" hint="Anchor this to a habit you already do.">
                <div style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "11px 14px", background: "var(--hb-paper)",
                  border: "1px solid var(--hb-line)", borderRadius: 10,
                }}>
                  <Link2 className="w-4 h-4" style={{ color: "var(--hb-plum)" }} />
                  <span className="hb-italic" style={{ fontSize: 14, color: "var(--hb-mute)" }}>after</span>
                  <select
                    value={pairWith} onChange={(e) => setPairWith(e.target.value)}
                    style={{
                      flex: 1, fontSize: 14, fontWeight: 500, color: "var(--hb-ink)",
                      background: "transparent", border: "none", outline: "none",
                    }}
                  >
                    <option value="">— Choose —</option>
                    {otherHabits.map(h => <option key={h.id} value={h.id}>{h.name}</option>)}
                  </select>
                </div>
              </Section>
            )}

            <Section label="Reminder">
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <Pill active><Bell className="w-3 h-3" /> Remind me</Pill>
                <span style={{ fontSize: 13, color: "var(--hb-mute)" }}>at</span>
                <input
                  type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)}
                  style={{
                    padding: "9px 12px", fontSize: 14,
                    fontFamily: "var(--hb-body)", color: "var(--hb-ink)",
                    background: "var(--hb-paper)", border: "1px solid var(--hb-line)",
                    borderRadius: 8, outline: "none",
                  }}
                />
              </div>
            </Section>

            <Section
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
                {tags.map(t => (
                  <Pill key={t.name} color={t.color} active={tag === t.name} onClick={() => setTag(t.name)}>{t.name}</Pill>
                ))}
                {tags.length === 0 && (
                  <span className="hb-italic" style={{ fontSize: 13, color: "var(--hb-mute)" }}>No tags — add one via Manage.</span>
                )}
              </div>
            </Section>
          </div>

          {/* Sticky CTA */}
          <div style={{
            padding: "14px 16px calc(18px + env(safe-area-inset-bottom))",
            borderTop: "1px solid var(--hb-line)", background: "var(--hb-cream)",
            display: "flex", gap: 10,
          }}>
            <button
              onClick={() => onOpenChange(false)}
              style={{
                flex: 1, padding: "13px 16px", fontSize: 14, fontWeight: 500,
                color: "var(--hb-ink)", background: "var(--hb-paper)",
                border: "1px solid var(--hb-line)", borderRadius: 999, cursor: "pointer",
              }}
            >Cancel</button>
            <button
              onClick={save} disabled={saving}
              style={{
                flex: 2, padding: "13px 16px", fontSize: 14, fontWeight: 500,
                color: "var(--hb-cream)", background: "var(--hb-ink)",
                border: "none", borderRadius: 999, cursor: "pointer",
                opacity: saving ? 0.6 : 1,
              }}
            >
              {saving ? "Saving…" : isEdit ? "Save habit" : "Add habit"}
            </button>
          </div>
        </div>
      </DrawerContent>

      <ManageTagsDialog open={tagsOpen} onOpenChange={setTagsOpen} />
    </Drawer>
  );
}
