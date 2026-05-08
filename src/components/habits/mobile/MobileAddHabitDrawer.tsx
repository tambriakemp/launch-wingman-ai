import { useState, useMemo, useEffect } from "react";
import { Bell, Link2, Clock, Calendar, ChevronRight, Check, Settings2 } from "lucide-react";
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

const TIMES = [
  { id: "morning", label: "Morning" },
  { id: "all_day", label: "All day" },
  { id: "evening", label: "Evening" },
  { id: "anytime", label: "Anytime" },
];
const CADENCES = [
  { id: "daily", label: "Daily" },
  { id: "weekdays", label: "Weekdays" },
  { id: "3xweek", label: "3 × per week" },
  { id: "custom", label: "Custom days" },
];
const DAYS = [
  { id: "MO", label: "M" }, { id: "TU", label: "T" }, { id: "WE", label: "W" },
  { id: "TH", label: "T" }, { id: "FR", label: "F" }, { id: "SA", label: "S" }, { id: "SU", label: "S" },
];

const SF = '-apple-system, "SF Pro Text", "SF Pro Display", system-ui, sans-serif';
const SERIF = '"Fraunces", "New York", Georgia, serif';
const TERRACOTTA = "#C65A3E";
const PAPER = "#FBF7F1";
const INK = "#1F1B17";
const INK_60 = "rgba(31,27,23,0.62)";
const INK_40 = "rgba(31,27,23,0.42)";
const INK_20 = "rgba(31,27,23,0.20)";

type Picker = null | "time" | "cadence" | "reminder" | "pair" | "tag";

function formatTime12(t: string) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "pm" : "am";
  const hh = ((h + 11) % 12) + 1;
  return m === 0 ? `${hh}${period}` : `${hh}:${String(m).padStart(2, "0")}${period}`;
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
  const [picker, setPicker] = useState<Picker>(null);
  const [tagsOpen, setTagsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number>(typeof window !== "undefined" ? window.innerHeight : 800);

  useEffect(() => {
    if (!open) return;
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    const update = () => setViewportHeight(vv ? vv.height : window.innerHeight);
    update();
    vv?.addEventListener("resize", update);
    vv?.addEventListener("scroll", update);
    window.addEventListener("resize", update);
    // Lock body scroll
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      vv?.removeEventListener("resize", update);
      vv?.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      setMounted(false);
      return;
    }
    setPicker(null);
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
      setTime("evening");
      setCadence("daily");
      setCustomDays(["MO", "WE", "FR"]);
      setPairWith("");
      setReminderTime("19:30");
      setTag(tags[0]?.name || "Body");
    }
    requestAnimationFrame(() => setMounted(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, habit]);

  const tagColor = colorFor(tag);
  const otherHabits = habits.filter(h => !habit || h.id !== habit.id);
  const pairName = useMemo(() => habits.find(h => h.id === pairWith)?.name || null, [habits, pairWith]);

  const cadenceLabel = cadence === "custom"
    ? `${customDays.length} day${customDays.length === 1 ? "" : "s"}/wk`
    : CADENCES.find(c => c.id === cadence)?.label || "Daily";
  const timeLabel = TIMES.find(t => t.id === time)?.label || "Anytime";

  const toggleDay = (d: string) => {
    setCustomDays(prev => prev.includes(d) ? prev.filter(x => x !== d) : [...prev, d]);
  };

  const isComposer = name.trim().length === 0;

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
        color: tagColor,
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

  if (!open) return null;

  return (
    <>
      <div
        style={{
          position: "fixed",
          inset: 0,
          height: viewportHeight,
          zIndex: 90,
          display: "flex",
          flexDirection: "column",
          background: mounted ? "rgba(31,27,23,0.40)" : "rgba(31,27,23,0)",
          transition: "background 240ms ease",
        }}
      >
        <div onClick={() => onOpenChange(false)} style={{ flex: 1, touchAction: "none" }} />

        <div
          className="hb-theme"
          style={{
            background: PAPER,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            boxShadow: "0 -10px 40px rgba(31,27,23,0.18)",
            maxHeight: "92%",
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            transform: mounted ? "translateY(0)" : "translateY(100%)",
            transition: "transform 280ms cubic-bezier(0.22, 0.61, 0.36, 1)",
          }}
        >
          {/* drag handle */}
          <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 4px" }}>
            <div style={{ width: 36, height: 5, borderRadius: 999, background: INK_20 }} />
          </div>

          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "8px 18px 12px",
          }}>
            <button
              onClick={() => onOpenChange(false)}
              style={{ background: "transparent", border: 0, padding: 0, fontFamily: SF, fontSize: 15.5, color: INK_60, fontWeight: 500, letterSpacing: -0.2, cursor: "pointer" }}
            >Cancel</button>
            <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: 18, letterSpacing: -0.4, color: INK }}>
              {isEdit ? "Edit habit" : "New habit"}
            </div>
            <button
              onClick={save}
              disabled={isComposer || saving}
              style={{ background: "transparent", border: 0, padding: 0, fontFamily: SF, fontSize: 15.5, color: isComposer ? INK_40 : TERRACOTTA, fontWeight: 700, letterSpacing: -0.2, cursor: isComposer ? "default" : "pointer" }}
            >Save</button>
          </div>

          {/* Scrollable body */}
          <div style={{ overflowY: "auto", WebkitOverflowScrolling: "touch", overscrollBehavior: "contain", flex: 1, minHeight: 0, paddingTop: 4, paddingBottom: "calc(20px + env(safe-area-inset-bottom))" }}>
            {/* Habit name input — focused card */}
            <div style={{ padding: "0 16px 14px" }}>
              <div style={{
                background: "#fff", borderRadius: 18,
                border: "1.5px solid rgba(198,90,62,0.45)",
                padding: "14px 16px",
                boxShadow: "0 0 0 4px rgba(198,90,62,0.10)",
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: TERRACOTTA, marginBottom: 6, fontFamily: SF }}>
                  What's the habit?
                </div>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Walk after dinner"
                  autoFocus={!isEdit}
                  style={{
                    width: "100%", border: "none", background: "transparent",
                    outline: "none", padding: 0,
                    fontFamily: SERIF, fontWeight: 400, fontSize: 19,
                    letterSpacing: -0.4, color: INK, lineHeight: 1.3,
                  }}
                />
                <div style={{ fontSize: 13, color: "rgba(31,27,23,0.5)", marginTop: 6, fontFamily: SERIF, fontStyle: "italic" }}>
                  Keep it small enough that you'll do it on a hard day.
                </div>
              </div>
            </div>

            {/* WHEN */}
            <SectionHeader>When</SectionHeader>
            <SectionCard>
              <Row
                icon={<Clock className="w-4 h-4" style={{ color: "#fff" }} />}
                iconBg="#A86E9C"
                label="Time of day"
                value={timeLabel}
                divider
                onClick={() => setPicker(picker === "time" ? null : "time")}
                expanded={picker === "time"}
              />
              {picker === "time" && (
                <PickerBody>
                  <ChipRow>
                    {TIMES.map(t => (
                      <Chip key={t.id} active={time === t.id} onClick={() => { setTime(t.id); setPicker(null); }}>{t.label}</Chip>
                    ))}
                  </ChipRow>
                </PickerBody>
              )}

              <Row
                icon={<Calendar className="w-4 h-4" style={{ color: "#fff" }} />}
                iconBg="#7E906E"
                label="Cadence"
                value={cadenceLabel}
                divider
                onClick={() => setPicker(picker === "cadence" ? null : "cadence")}
                expanded={picker === "cadence"}
              />
              {picker === "cadence" && (
                <PickerBody>
                  <ChipRow>
                    {CADENCES.map(c => (
                      <Chip key={c.id} active={cadence === c.id} onClick={() => setCadence(c.id)}>{c.label}</Chip>
                    ))}
                  </ChipRow>
                  {cadence === "custom" && (
                    <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                      {DAYS.map(d => {
                        const active = customDays.includes(d.id);
                        return (
                          <button
                            key={d.id}
                            onClick={() => toggleDay(d.id)}
                            aria-label={d.id}
                            style={{
                              width: 38, height: 38, borderRadius: "50%",
                              border: `1px solid ${active ? INK : "rgba(31,27,23,0.15)"}`,
                              background: active ? INK : "#fff",
                              color: active ? PAPER : INK,
                              fontSize: 13, fontWeight: 500, cursor: "pointer",
                            }}
                          >{d.label}</button>
                        );
                      })}
                    </div>
                  )}
                </PickerBody>
              )}

              <Row
                icon={<Bell className="w-4 h-4" style={{ color: "#fff" }} />}
                iconBg="#615248"
                label="Reminder"
                value={formatTime12(reminderTime)}
                onClick={() => setPicker(picker === "reminder" ? null : "reminder")}
                expanded={picker === "reminder"}
              />
              {picker === "reminder" && (
                <PickerBody>
                  <input
                    type="time"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    style={{
                      padding: "10px 14px", fontSize: 15,
                      fontFamily: SF, color: INK,
                      background: "#fff", border: "1px solid rgba(31,27,23,0.15)",
                      borderRadius: 10, outline: "none",
                    }}
                  />
                </PickerBody>
              )}
            </SectionCard>

            {/* PAIR WITH */}
            {otherHabits.length > 0 && (
              <>
                <SectionHeader>Pair with</SectionHeader>
                <SectionCard>
                  <Row
                    icon={<Link2 className="w-4 h-4" style={{ color: "#fff" }} />}
                    iconBg="#6B3A5C"
                    label="After"
                    value={pairName || "Choose"}
                    placeholder={!pairName}
                    onClick={() => setPicker(picker === "pair" ? null : "pair")}
                    expanded={picker === "pair"}
                  />
                  {picker === "pair" && (
                    <PickerBody>
                      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                        <PairOption
                          active={!pairWith}
                          label="None"
                          onClick={() => { setPairWith(""); setPicker(null); }}
                        />
                        {otherHabits.map(h => (
                          <PairOption
                            key={h.id}
                            active={pairWith === h.id}
                            label={h.name}
                            color={h.color}
                            onClick={() => { setPairWith(h.id); setPicker(null); }}
                          />
                        ))}
                      </div>
                    </PickerBody>
                  )}
                </SectionCard>
              </>
            )}

            {/* TAG */}
            <SectionHeader
              right={
                <button
                  onClick={() => setTagsOpen(true)}
                  style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 600, color: INK_60, background: "transparent", border: "none", cursor: "pointer", letterSpacing: 0.6, textTransform: "uppercase", fontFamily: SF }}
                >
                  <Settings2 className="w-3 h-3" /> Manage
                </button>
              }
            >Tag</SectionHeader>
            <SectionCard>
              <Row
                icon={<div style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />}
                iconBg={tagColor}
                label={tag || "No tag"}
                value="Change"
                onClick={() => setPicker(picker === "tag" ? null : "tag")}
                expanded={picker === "tag"}
              />
              {picker === "tag" && (
                <PickerBody>
                  <ChipRow>
                    {tags.map(t => (
                      <Chip key={t.name} active={tag === t.name} color={t.color} onClick={() => { setTag(t.name); setPicker(null); }}>
                        {t.name}
                      </Chip>
                    ))}
                  </ChipRow>
                  {tags.length === 0 && (
                    <div style={{ fontSize: 13, color: INK_60, fontFamily: SERIF, fontStyle: "italic" }}>No tags — tap Manage to add one.</div>
                  )}
                </PickerBody>
              )}
            </SectionCard>

            {/* AI nudge */}
            {pairName && (
              <div style={{
                margin: "14px 16px 0", padding: "14px 16px",
                background: INK, color: PAPER, borderRadius: 16,
                position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: -20, right: -20, width: 100, height: 100,
                  borderRadius: "50%",
                  background: "radial-gradient(circle, rgba(198,90,62,0.30), transparent 70%)",
                }} />
                <div style={{ display: "inline-flex", alignItems: "center", gap: 6, position: "relative" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: TERRACOTTA }} />
                  <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "#E68A6E", fontFamily: SF }}>
                    I noticed
                  </span>
                </div>
                <div style={{ fontSize: 15, lineHeight: 1.4, marginTop: 8, position: "relative", fontFamily: SERIF, fontStyle: "italic" }}>
                  Pairing this with "{pairName}" is smart — you almost always do {pairName}, so this gets a built-in cue.
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <ManageTagsDialog open={tagsOpen} onOpenChange={setTagsOpen} />
    </>
  );
}

/* ---------- helpers ---------- */

function SectionHeader({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={{
      padding: "12px 22px 6px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: INK_60, fontFamily: SF }}>
        {children}
      </div>
      {right}
    </div>
  );
}

function SectionCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      background: "#fff", borderRadius: 16, margin: "0 16px 12px",
      boxShadow: "0 1px 2px rgba(31,27,23,0.04)", overflow: "hidden",
    }}>{children}</div>
  );
}

function Row({
  icon, iconBg, label, value, divider, onClick, expanded, placeholder,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  divider?: boolean;
  onClick?: () => void;
  expanded?: boolean;
  placeholder?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", padding: "12px 14px", display: "flex", alignItems: "center", gap: 12,
        borderBottom: divider ? "0.5px solid rgba(31,27,23,0.08)" : "none",
        background: expanded ? "rgba(198,90,62,0.06)" : "transparent",
        border: "none", cursor: "pointer", textAlign: "left",
      }}
    >
      <div style={{
        width: 30, height: 30, borderRadius: 8, background: iconBg, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {icon}
      </div>
      <div style={{ flex: 1, fontSize: 14, fontWeight: 500, color: INK, letterSpacing: -0.2, fontFamily: SF }}>
        {label}
      </div>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: 14, color: placeholder ? INK_40 : INK, fontFamily: SF,
      }}>
        {value}
        <ChevronRight className="w-[13px] h-[13px]" style={{ color: "#B3AAA0", transform: expanded ? "rotate(90deg)" : "none", transition: "transform 150ms ease" }} />
      </div>
    </button>
  );
}

function PickerBody({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      padding: "10px 14px 14px",
      borderTop: "0.5px solid rgba(31,27,23,0.08)",
      background: "rgba(198,90,62,0.04)",
    }}>
      {children}
    </div>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{children}</div>;
}

function Chip({ children, active, color, onClick }: { children: React.ReactNode; active?: boolean; color?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 14px", borderRadius: 999, fontSize: 13, fontWeight: 500,
        border: `1px solid ${active ? INK : "rgba(31,27,23,0.15)"}`,
        background: active ? INK : "#fff",
        color: active ? PAPER : INK,
        display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
        fontFamily: SF,
      }}
    >
      {color && <span style={{ width: 8, height: 8, borderRadius: "50%", background: color }} />}
      {children}
    </button>
  );
}

function PairOption({ active, label, color, onClick }: { active?: boolean; label: string; color?: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%", padding: "10px 12px", borderRadius: 10,
        background: active ? "#fff" : "transparent",
        border: active ? "1px solid rgba(31,27,23,0.10)" : "1px solid transparent",
        display: "flex", alignItems: "center", gap: 10, cursor: "pointer", textAlign: "left",
      }}
    >
      {color
        ? <span style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
        : <span style={{ width: 10 }} />}
      <span style={{ flex: 1, fontSize: 14, color: INK, fontFamily: SF }}>{label}</span>
      {active && <Check className="w-4 h-4" style={{ color: TERRACOTTA }} />}
    </button>
  );
}
