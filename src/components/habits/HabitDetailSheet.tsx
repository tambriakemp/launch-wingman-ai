import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, X, Plus, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, eachDayOfInterval, subDays } from "date-fns";
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

const SLOTS = [
  { id: "morning", label: "Morning" },
  { id: "afternoon", label: "Afternoon" },
  { id: "evening", label: "Evening" },
  { id: "all_day", label: "All day" },
];

interface HabitDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  habit: Habit | null;
  completions: HabitCompletion[];
  onSubmit: (data: Partial<Habit>) => Promise<void>;
  onArchive: (id: string) => Promise<void>;
}

export function HabitDetailSheet({ open, onOpenChange, habit, completions, onSubmit, onArchive }: HabitDetailSheetProps) {
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
  const [reminders, setReminders] = useState<string[]>([]);
  const [newReminder, setNewReminder] = useState("");
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
      setReminders(habit.reminder_times || []);
    } else {
      setName(""); setDescription(""); setNotes("");
      setCategory("personal"); setColor("#0ea572");
      setFrequency("daily"); setFrequencyDays([]);
      setTimeOfDay([]); setDuration(""); setReminders([]);
    }
  }, [habit, open]);

  const toggleSlot = (slot: string) => {
    setTimeOfDay(prev => prev.includes(slot) ? prev.filter(s => s !== slot) : [...prev, slot]);
  };
  const toggleDay = (day: string) => {
    setFrequencyDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };
  const addReminder = () => {
    if (!/^\d{2}:\d{2}$/.test(newReminder)) return;
    if (reminders.includes(newReminder)) return;
    setReminders([...reminders, newReminder].sort());
    setNewReminder("");
  };

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
        reminder_times: reminders,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Stats for edit mode
  const habitCompletions = habit ? completions.filter(c => c.habit_id === habit.id) : [];
  const habitDates = new Set(habitCompletions.map(c => c.completed_date));
  let streak = 0;
  if (habit) {
    let checkDate = new Date();
    while (true) {
      const d = format(checkDate, "yyyy-MM-dd");
      if (habitDates.has(d)) {
        streak++;
        checkDate = new Date(checkDate.getTime() - 86400000);
      } else {
        if (streak === 0 && d === format(new Date(), "yyyy-MM-dd")) {
          checkDate = new Date(checkDate.getTime() - 86400000);
          continue;
        }
        break;
      }
    }
  }
  const last7 = eachDayOfInterval({ start: subDays(new Date(), 6), end: new Date() });

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="px-5 py-3.5 border-b border-border flex-row items-center justify-between space-y-0">
            <SheetTitle>{isEdit ? "Habit" : "New Habit"}</SheetTitle>
            <div className="flex items-center gap-1">
              {isEdit && (
                <Button variant="ghost" size="icon" onClick={() => setDeleteOpen(true)} aria-label="Delete">
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              )}
              <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)} aria-label="Close">
                <X className="w-4 h-4" />
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            {/* Icon + name */}
            <div className="flex flex-col items-center text-center gap-3">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                style={{ background: `${color}20` }}
              >
                <div className="w-8 h-8 rounded-full" style={{ background: color }} />
              </div>
              <Input
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Habit name"
                className="h-11 text-center text-lg font-semibold border-0 shadow-none focus-visible:ring-0 px-0"
              />
              <Input
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Add description..."
                className="h-9 text-center text-sm border-0 shadow-none focus-visible:ring-0 px-0 text-muted-foreground"
              />
            </div>

            {/* Frequency */}
            <Field label="Frequency">
              <Select value={frequency} onValueChange={setFrequency}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Every day</SelectItem>
                  <SelectItem value="weekdays">Weekdays only</SelectItem>
                  <SelectItem value="weekends">Weekends only</SelectItem>
                  <SelectItem value="custom">Custom days</SelectItem>
                </SelectContent>
              </Select>
              {frequency === "custom" && (
                <div className="flex gap-1.5 mt-2">
                  {[["SU","S"],["MO","M"],["TU","T"],["WE","W"],["TH","T"],["FR","F"],["SA","S"]].map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => toggleDay(val)}
                      className={cn(
                        "h-8 flex-1 rounded-full text-xs font-semibold border transition-colors",
                        frequencyDays.includes(val)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:border-primary/50"
                      )}
                    >{label}</button>
                  ))}
                </div>
              )}
            </Field>

            {/* Duration */}
            <Field label="Duration per day (minutes)">
              <Input
                type="number"
                inputMode="numeric"
                min={0}
                value={duration}
                onChange={e => setDuration(e.target.value)}
                placeholder="e.g. 15"
                className="h-10"
              />
            </Field>

            {/* Time of day */}
            <Field label="Time of day">
              <div className="flex flex-wrap gap-1.5">
                {SLOTS.map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSlot(s.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                      timeOfDay.includes(s.id)
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-muted-foreground border-border hover:border-primary/50"
                    )}
                  >{s.label}</button>
                ))}
              </div>
              {timeOfDay.length === 0 && (
                <p className="text-[11px] text-muted-foreground">Defaults to All day if none selected.</p>
              )}
            </Field>

            {/* Reminders */}
            <Field label="Reminder times">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {reminders.map(t => (
                  <span key={t} className="flex items-center gap-1 bg-muted text-foreground text-xs font-medium px-2.5 py-1 rounded-full">
                    {t}
                    <button onClick={() => setReminders(r => r.filter(x => x !== t))} className="hover:text-destructive">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  type="time"
                  value={newReminder}
                  onChange={e => setNewReminder(e.target.value)}
                  className="h-9 flex-1"
                />
                <Button type="button" size="sm" variant="outline" onClick={addReminder} className="gap-1">
                  <Plus className="w-3.5 h-3.5" /> Add
                </Button>
              </div>
            </Field>

            {/* Category */}
            <Field label="Category">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>

            {/* Color */}
            <Field label="Color">
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map(c => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    className={cn(
                      "w-7 h-7 rounded-full border-2 transition-all hover:scale-110",
                      color === c ? "border-foreground scale-110" : "border-transparent"
                    )}
                    style={{ background: c }}
                  />
                ))}
              </div>
            </Field>

            {/* Stats / Notes */}
            {isEdit && (
              <Tabs defaultValue="stats" className="pt-2">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="stats">Statistics</TabsTrigger>
                  <TabsTrigger value="notes">Notes</TabsTrigger>
                </TabsList>
                <TabsContent value="stats" className="pt-4">
                  <div className="rounded-2xl border border-border bg-card p-5 flex flex-col items-center text-center">
                    <Flame className="w-5 h-5 text-primary mb-1" />
                    <p className="text-3xl font-bold tabular-nums">{streak}</p>
                    <p className="text-xs text-muted-foreground">{streak === 1 ? "Day" : "Days"} current streak</p>
                    <div className="flex gap-1 mt-4">
                      {last7.map(d => {
                        const ds = format(d, "yyyy-MM-dd");
                        const done = habitDates.has(ds);
                        return (
                          <div key={ds} className="flex flex-col items-center gap-1">
                            <span className="text-[10px] text-muted-foreground uppercase">{format(d, "EEEEE")}</span>
                            <div
                              className={cn(
                                "w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold",
                                done ? "text-white" : "bg-muted text-muted-foreground"
                              )}
                              style={done ? { background: color } : undefined}
                            >
                              {format(d, "d")}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="notes" className="pt-4">
                  <Textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Add a personal note..."
                    rows={6}
                    className="resize-none"
                    maxLength={1000}
                  />
                </TabsContent>
              </Tabs>
            )}
          </div>

          <div className="px-5 py-3.5 border-t border-border flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">Cancel</Button>
            <Button onClick={handleSave} disabled={isSubmitting || !name.trim()} className="flex-1">
              {isSubmitting ? "Saving..." : isEdit ? "Save" : "Create"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {habit && (
        <DeleteConfirmationDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          onConfirm={() => { onArchive(habit.id); setDeleteOpen(false); }}
          title={`Delete "${habit.name}"?`}
          description="This habit and its history will be archived. Type DELETE to confirm."
        />
      )}
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
