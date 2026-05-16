import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetBody,
  SheetFooter,
  SheetSectionHead,
  SheetTokenCell,
  SheetTitleInput,
  SheetKbd,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Trash2, Clock, CalendarRange, Sun, Link2, Hash, Palette } from "lucide-react";
import { cn } from "@/lib/utils";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import type { Habit, HabitCompletion } from "@/pages/HabitTracker";

const PRESET_COLORS = [
  "#0ea572", "#f5c842", "#f43f5e", "#8b5cf6",
  "#3b82f6", "#f97316", "#06b6d4", "#ec4899",
  "#84cc16", "#6366f1", "#14b8a6", "#ef4444",
];

const CATEGORIES = [
  { id: "health", label: "Health & Fitness" },
  { id: "business", label: "Business & Work" },
  { id: "personal", label: "Personal Growth" },
  { id: "finance", label: "Finance" },
  { id: "mindset", label: "Mindset" },
  { id: "relationships", label: "Relationships" },
];

const FREQUENCIES = [
  { id: "daily",    label: "Every day" },
  { id: "weekdays", label: "Weekdays only" },
  { id: "weekends", label: "Weekends only" },
  { id: "custom",   label: "Custom days" },
];

const DAY_TOGGLES: Array<[string, string]> = [
  ["SU", "S"], ["MO", "M"], ["TU", "T"], ["WE", "W"],
  ["TH", "T"], ["FR", "F"], ["SA", "S"],
];

const SLOTS = [
  { id: "morning",   label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening",   label: "Evening" },
  { id: "all_day",   label: "All day" },
];

const TAGS = ["Care", "Body", "Mind", "Rhythm", "Launch"];

interface HabitDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit: Habit | null;
  /**
   * Past habit completions. Reserved for future use (e.g. inline
   * streak preview); the live Statistics page already renders this
   * data so the panel itself no longer needs it.
   */
  completions?: HabitCompletion[];
  onSubmit: (data: Partial<Habit>) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
  habits?: Habit[];
}

export function HabitDetailSheet({
  open, onOpenChange, habit, onSubmit, onArchive, habits = [],
}: HabitDetailSheetProps) {
  const isEdit = !!habit;

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [notes, setNotes] = useState("");
  const [category, setCategory] = useState("personal");
  const [color, setColor] = useState("#0ea572");
  const [frequency, setFrequency] = useState("daily");
  const [frequencyDays, setFrequencyDays] = useState<string[]>([]);
  const [timeOfDay, setTimeOfDay] = useState<string[]>([]);
  const [duration, setDuration] = useState<string>("");
  const [pairWith, setPairWith] = useState<string>("");
  const [tag, setTag] = useState<string>("");
  const [reminderTime, setReminderTime] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useEffect(() => {
    if (habit) {
      setName(habit.name);
      setDescription(habit.description || "");
      setNotes(habit.notes || "");
      setCategory(habit.category);
      setColor(habit.color);
      setFrequency(habit.frequency);
      setFrequencyDays(habit.frequency_days || []);
      setTimeOfDay(habit.time_of_day || []);
      setDuration(habit.duration_minutes ? String(habit.duration_minutes) : "");
      setPairWith(habit.pair_with_habit_id || "");
      setTag(habit.tag || "");
      setReminderTime(habit.reminder_time ? habit.reminder_time.slice(0, 5) : "");
    } else {
      setName(""); setDescription(""); setNotes("");
      setCategory("personal"); setColor("#0ea572");
      setFrequency("daily"); setFrequencyDays([]);
      setTimeOfDay([]); setDuration("");
      setPairWith(""); setTag(""); setReminderTime("");
    }
  }, [habit, open]);

  const toggleDay = (day: string) =>
    setFrequencyDays((prev) => (prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]));
  const toggleSlot = (slot: string) =>
    setTimeOfDay((prev) => (prev.includes(slot) ? prev.filter((s) => s !== slot) : [...prev, slot]));

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        notes: notes.trim() || null,
        category,
        color,
        icon: "circle",
        frequency,
        frequency_days: frequency === "custom" ? frequencyDays : null,
        time_of_day: timeOfDay,
        duration_minutes: duration ? parseInt(duration, 10) : null,
        // Keep schema column populated; we no longer expose a multi-reminder
        // UI because nothing reads this array — only `reminder_time` drives
        // native push. Empty array is the safe default.
        reminder_times: [],
        pair_with_habit_id: pairWith || null,
        tag: tag || null,
        reminder_time: reminderTime ? `${reminderTime}:00` : null,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Cell labels
  const categoryLabel = CATEGORIES.find((c) => c.id === category)?.label;
  const frequencyLabel = FREQUENCIES.find((f) => f.id === frequency)?.label;
  const slotsLabel = timeOfDay.length
    ? SLOTS.filter((s) => timeOfDay.includes(s.id)).map((s) => s.label).join(", ")
    : null;
  const pairLabel = habits.find((h) => h.id === pairWith)?.name;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="overflow-hidden p-0 flex flex-col">
          {/* HEADER */}
          <SheetHeader
            eyebrow={isEdit ? "Editing habit" : "New habit"}
            className="pr-12 pb-5 pt-7 gap-1.5"
          >
            <SheetTitle>
              {isEdit ? (
                <>
                  Editing this{" "}
                  <em className="font-display italic" style={{ color: "hsl(var(--terracotta-500))" }}>
                    rhythm
                  </em>
                  .
                </>
              ) : (
                <>
                  One small{" "}
                  <em className="font-display italic" style={{ color: "hsl(var(--terracotta-500))" }}>
                    loop
                  </em>
                  .
                </>
              )}
            </SheetTitle>
            <SheetDescription className="max-w-[46ch]">
              Small consistent loops. That's the whole thing.
            </SheetDescription>
          </SheetHeader>

          {/* BODY */}
          <SheetBody className="flex flex-col gap-0">
            <SheetTitleInput
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="What habit are you building?"
              autoFocus
            />
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description…"
              className="mt-2 h-9 border-0 shadow-none px-0 text-[13px] text-[hsl(var(--fg-secondary))] focus-visible:ring-0 focus-visible:ring-offset-0"
            />

            {/* § 01 · CADENCE */}
            <SheetSectionHead n="01">Cadence</SheetSectionHead>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <SheetTokenCell
                    icon={<CalendarRange className="h-3.5 w-3.5" />}
                    label="Frequency"
                    value={frequencyLabel}
                  />
                </PopoverTrigger>
                <PopoverContent align="start" className="w-52 p-1">
                  <PickerList options={FREQUENCIES} selected={frequency} onPick={setFrequency} />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <SheetTokenCell
                    icon={<Sun className="h-3.5 w-3.5" />}
                    label="Time of day"
                    value={slotsLabel}
                    placeholder="All day"
                  />
                </PopoverTrigger>
                <PopoverContent align="start" className="w-52 p-1">
                  <PickerList options={SLOTS} selected={timeOfDay} onPick={toggleSlot} multi />
                </PopoverContent>
              </Popover>
            </div>

            {frequency === "custom" && (
              <div className="mt-2 flex gap-1.5">
                {DAY_TOGGLES.map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => toggleDay(val)}
                    className={cn(
                      "h-8 flex-1 rounded-full border text-xs font-semibold transition-colors",
                      frequencyDays.includes(val)
                        ? "bg-[hsl(var(--ink-900))] text-[hsl(var(--paper-100))] border-[hsl(var(--ink-900))]"
                        : "bg-transparent text-muted-foreground border-[hsl(var(--border-hairline))] hover:border-[hsl(var(--ink-400))]",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* Duration + Push reminder — short labeled inputs */}
            <div className="mt-2 grid grid-cols-2 gap-2">
              <LabeledFieldInput
                icon={<Clock className="h-3.5 w-3.5" />}
                label="Duration"
                suffix="min"
                inputType="number"
                value={duration}
                onChange={setDuration}
                placeholder="—"
              />
              <LabeledFieldInput
                icon={<Clock className="h-3.5 w-3.5" />}
                label="Push reminder"
                inputType="time"
                value={reminderTime}
                onChange={setReminderTime}
                placeholder="—"
              />
            </div>

            {/* § 02 · IDENTITY */}
            <SheetSectionHead n="02">Identity</SheetSectionHead>
            <div className="grid grid-cols-2 gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <SheetTokenCell
                    dot={color}
                    label="Category"
                    value={categoryLabel}
                  />
                </PopoverTrigger>
                <PopoverContent align="start" className="w-52 p-1">
                  <PickerList options={CATEGORIES} selected={category} onPick={setCategory} />
                </PopoverContent>
              </Popover>

              <Popover>
                <PopoverTrigger asChild>
                  <SheetTokenCell
                    icon={<Hash className="h-3.5 w-3.5" />}
                    label="Tag"
                    value={tag || undefined}
                    placeholder="None"
                  />
                </PopoverTrigger>
                <PopoverContent align="start" className="w-52 p-1">
                  <PickerList
                    options={TAGS.map((t) => ({ id: t, label: t }))}
                    selected={tag}
                    onPick={setTag}
                    noneOption={{ label: "— None —", value: "" }}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Color swatches — full width, dense */}
            <div className="mt-3 flex items-center gap-3">
              <div className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[hsl(var(--ink-700))]">
                <Palette className="h-3.5 w-3.5 text-[hsl(var(--fg-muted))]" />
                Color
              </div>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    aria-label={`Pick color ${c}`}
                    className={cn(
                      "h-6 w-6 rounded-full border-2 transition-all hover:scale-110",
                      color === c ? "border-[hsl(var(--ink-900))] scale-110" : "border-transparent",
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </div>

            {/* § 03 · PAIR WITH (only when other habits exist) */}
            {habits.filter((h) => !habit || h.id !== habit.id).length > 0 && (
              <>
                <SheetSectionHead n="03">Pair with</SheetSectionHead>
                <Popover>
                  <PopoverTrigger asChild>
                    <SheetTokenCell
                      icon={<Link2 className="h-3.5 w-3.5" />}
                      label="After"
                      value={pairLabel}
                      placeholder="Choose a habit"
                    />
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-64 p-1">
                    <PickerList
                      options={habits
                        .filter((h) => !habit || h.id !== habit.id)
                        .map((h) => ({ id: h.id, label: h.name }))}
                      selected={pairWith}
                      onPick={setPairWith}
                      noneOption={{ label: "— None —", value: "" }}
                    />
                  </PopoverContent>
                </Popover>
              </>
            )}

            {/* § 04 · NOTES (edit only) */}
            {isEdit && (
              <>
                <SheetSectionHead n={habits.filter((h) => !habit || h.id !== habit.id).length > 0 ? "04" : "03"}>
                  Notes
                </SheetSectionHead>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="A personal note…"
                  rows={4}
                  maxLength={1000}
                  className="resize-none bg-[hsl(var(--paper-50))] border-[hsl(var(--border-hairline))] rounded-lg text-[13.5px] leading-[1.55]"
                />
              </>
            )}

          </SheetBody>

          {/* FOOTER */}
          <SheetFooter className="flex-row items-center justify-between gap-2 border-t border-[hsl(var(--ink-900))] bg-[hsl(var(--paper-200))] px-7 py-3.5">
            <div className="flex items-center gap-3">
              <div className="hidden md:inline-flex items-center gap-1.5 font-mono text-[10.5px] tracking-[0.08em] text-[hsl(var(--fg-muted))]">
                <SheetKbd>⌘</SheetKbd>
                <SheetKbd>↵</SheetKbd>
                <span className="ml-1 font-semibold uppercase">to {isEdit ? "save" : "create"}</span>
              </div>
              {isEdit && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteOpen(true)}
                  className="gap-1.5 text-[hsl(var(--fg-muted))] hover:text-[hsl(var(--destructive))]"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-lg border border-[hsl(var(--border-hairline))] bg-transparent px-4 py-2 font-body text-[13px] font-medium text-[hsl(var(--ink-800))] transition-colors hover:bg-[hsl(var(--ink-900)/0.04)]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isSubmitting || !name.trim()}
                className="rounded-lg border border-[hsl(var(--ink-900))] bg-[hsl(var(--ink-900))] px-4 py-2 font-body text-[13px] font-semibold text-[hsl(var(--paper-100))] transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {isSubmitting ? "Saving…" : isEdit ? "Save" : "Create"}
              </button>
            </div>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {habit && (
        <DeleteConfirmationDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={() => {
            onArchive(habit.id);
            setDeleteOpen(false);
          }}
          title={`Delete "${habit.name}"?`}
          description="This habit and its history will be archived. Type DELETE to confirm."
        />
      )}
    </>
  );
}

/* Reusable popover option list — collapses each picker dropdown to a few
   lines. Pass options as `{ id, label }` objects; selected id renders with
   the accent background; `onPick` returns the chosen id. */
function PickerList<T extends { id: string; label: string }>({
  options,
  selected,
  onPick,
  multi,
  noneOption,
}: {
  options: T[];
  selected: string | string[];
  onPick: (id: string) => void;
  multi?: boolean;
  /** Optional "— None —" item to clear selection. Renders first when set. */
  noneOption?: { label: string; value: string };
}) {
  const isActive = (id: string) =>
    Array.isArray(selected) ? selected.includes(id) : id === selected;
  return (
    <>
      {noneOption && (
        <button
          type="button"
          onClick={() => onPick(noneOption.value)}
          className={cn(
            "block w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
            isActive(noneOption.value) && "bg-accent",
          )}
        >
          {noneOption.label}
        </button>
      )}
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onPick(o.id)}
          className={cn(
            "flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent",
            isActive(o.id) && "bg-accent",
          )}
        >
          {o.label}
          {multi && isActive(o.id) && (
            <span className="text-[hsl(var(--terracotta-500))]">✓</span>
          )}
        </button>
      ))}
    </>
  );
}

/* Small labeled-input cell — for short free-form values that don't fit the
   TokenCell + popover pattern (e.g. numeric duration, time picker). Visually
   matches a TokenCell so the field row still reads as one. */
function LabeledFieldInput({
  icon,
  label,
  value,
  onChange,
  placeholder,
  inputType = "text",
  suffix,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputType?: "text" | "number" | "time";
  suffix?: string;
}) {
  return (
    <label className="flex w-full items-center gap-2.5 rounded-lg border border-[hsl(var(--border-hairline))] bg-[hsl(var(--paper-50))] px-3 py-2 focus-within:border-[hsl(var(--ink-400))]">
      <span className="inline-flex shrink-0 items-center text-[hsl(var(--fg-muted))]">{icon}</span>
      <span className="shrink-0 font-body text-[12.5px] font-semibold text-[hsl(var(--ink-700))]">{label}</span>
      <input
        type={inputType}
        inputMode={inputType === "number" ? "numeric" : undefined}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-0 border-0 bg-transparent p-0 text-right font-body text-[13px] tracking-[-0.005em] text-[hsl(var(--ink-900))] placeholder:text-[hsl(var(--fg-muted))] outline-none"
      />
      {suffix && (
        <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-[hsl(var(--fg-muted))]">
          {suffix}
        </span>
      )}
    </label>
  );
}
