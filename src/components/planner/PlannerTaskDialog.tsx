import { useState, useEffect } from "react";
import { format } from "date-fns";
import { CalendarCheck, CalendarIcon, CalendarOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export interface PlannerTask {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  column_id: string;
  position: number;
  labels: string[] | null;
  phase: string | null;
  created_at: string;
  updated_at: string;
  task_origin: string;
  task_scope: string;
  task_type: string;
  category: string | null;
  due_at: string | null;
  start_at: string | null;
  end_at: string | null;
  location: string | null;
  linked_entity_type: string | null;
  linked_entity_id: string | null;
  recurrence_rule: any | null;
  recurrence_parent_id: string | null;
  recurrence_exception_dates: string[] | null;
}

const STATUSES = [
  { id: "todo", label: "To Do" },
  { id: "in-progress", label: "Doing" },
  { id: "done", label: "Done" },
];

/** Extract HH:MM from an ISO string in local time */
function isoToLocalTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface PlannerTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<PlannerTask>) => Promise<void>;
  editTask?: PlannerTask | null;
  defaultTaskType?: "task" | "event";
  defaultDueAt?: Date | null;
}

export const PlannerTaskDialog = ({
  open,
  onOpenChange,
  onSubmit,
  editTask,
  defaultTaskType = "task",
  defaultDueAt,
}: PlannerTaskDialogProps) => {
  const DEFAULT_CATEGORIES = [
    { id: "business", name: "Work", color: "#f5c842" },
    { id: "life", name: "Personal", color: "#0ea572" },
    { id: "health", name: "Health", color: "#f43f5e" },
    { id: "finance", name: "Finance", color: "#8b5cf6" },
  ];
  const [plannerCategories, setPlannerCategories] = useState(() => {
    try {
      const stored = localStorage.getItem("planner-categories");
      return stored ? JSON.parse(stored) : DEFAULT_CATEGORIES;
    } catch { return DEFAULT_CATEGORIES; }
  });

  // Re-read categories from localStorage every time the dialog opens
  useEffect(() => {
    if (open) {
      try {
        const stored = localStorage.getItem("planner-categories");
        setPlannerCategories(stored ? JSON.parse(stored) : DEFAULT_CATEGORIES);
      } catch { setPlannerCategories(DEFAULT_CATEGORIES); }
    }
  }, [open]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskType, setTaskType] = useState<"task" | "event">("task");
  const [columnId, setColumnId] = useState("todo");
  const [category, setCategory] = useState("business");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recurrenceFreq, setRecurrenceFreq] = useState<"none"|"daily"|"weekly"|"monthly"|"yearly">("none");
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>([]);
  const [recurrenceEndType, setRecurrenceEndType] = useState<"never"|"on_date"|"after_n">("never");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>(undefined);
  const [recurrenceCount, setRecurrenceCount] = useState(10);

  const isScheduled = editTask && (editTask.start_at || editTask.end_at);

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description || "");
      setTaskType((editTask.task_type as "task" | "event") || "task");
      setColumnId(editTask.column_id);
      setCategory(editTask.category || "business");
      setLocation(editTask.location || "");

      // Date: prefer start_at, fallback to due_at
      if (editTask.start_at) {
        setSelectedDate(new Date(editTask.start_at));
        setStartTime(isoToLocalTime(editTask.start_at));
      } else if (editTask.due_at) {
        setSelectedDate(new Date(editTask.due_at));
        setStartTime("");
      } else {
        setSelectedDate(undefined);
        setStartTime("");
      }

      if (editTask.end_at) {
        setEndTime(isoToLocalTime(editTask.end_at));
      } else {
        setEndTime("");
      }

      if (editTask.recurrence_rule) {
        const r = editTask.recurrence_rule;
        setRecurrenceFreq(r.freq || "none");
        setRecurrenceInterval(r.interval || 1);
        setRecurrenceDays(r.days || []);
        setRecurrenceEndType(r.end_type || "never");
        setRecurrenceEndDate(r.end_date ? new Date(r.end_date) : undefined);
        setRecurrenceCount(r.count || 10);
      } else {
        setRecurrenceFreq("none");
        setRecurrenceInterval(1);
        setRecurrenceDays([]);
        setRecurrenceEndType("never");
        setRecurrenceEndDate(undefined);
        setRecurrenceCount(10);
      }
    } else {
      setTitle("");
      setDescription("");
      setTaskType(defaultTaskType);
      setColumnId("todo");
      setCategory("business");
      setSelectedDate(defaultDueAt || undefined);
      setStartTime("");
      setEndTime("");
      setLocation("");
      setRecurrenceFreq("none");
      setRecurrenceInterval(1);
      setRecurrenceDays([]);
      setRecurrenceEndType("never");
      setRecurrenceEndDate(undefined);
      setRecurrenceCount(10);
    }
  }, [editTask, open, defaultTaskType, defaultDueAt]);

  /** Combine selected date + time string into ISO */
  const combineDatetime = (date: Date, time: string): string => {
    const [h, m] = time.split(":").map(Number);
    const combined = new Date(date);
    combined.setHours(h, m, 0, 0);
    return combined.toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (taskType === "event" && (!selectedDate || !startTime || !endTime)) {
      toast.error("Events require a date with start and end times");
      return;
    }
    // Pair consistency for times
    if (startTime && !endTime) {
      toast.error("End time is required when start time is set");
      return;
    }
    if (endTime && !startTime) {
      toast.error("Start time is required when end time is set");
      return;
    }
    // end >= start
    if (startTime && endTime && startTime >= endTime) {
      toast.error("End time must be after start time");
      return;
    }

    const hasSchedule = selectedDate && startTime && endTime;

    setIsSubmitting(true);
    const recurrenceRuleValue = recurrenceFreq === "none" ? null : {
      freq: recurrenceFreq,
      interval: recurrenceInterval,
      days: recurrenceDays,
      end_type: recurrenceEndType,
      end_date: recurrenceEndDate ? recurrenceEndDate.toISOString().split("T")[0] : null,
      count: recurrenceCount,
    };
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        task_type: taskType,
        column_id: columnId,
        category,
        due_at: selectedDate ? selectedDate.toISOString() : null,
        start_at: hasSchedule ? combineDatetime(selectedDate!, startTime) : null,
        end_at: hasSchedule ? combineDatetime(selectedDate!, endTime) : null,
        location: location.trim() || null,
        recurrence_rule: recurrenceRuleValue,
      });
      onOpenChange(false);
    } catch {
      // handled upstream
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnschedule = async () => {
    if (!editTask) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        title: editTask.title,
        description: editTask.description,
        task_type: editTask.task_type === "event" ? "task" : editTask.task_type,
        column_id: editTask.column_id,
        category: editTask.category,
        due_at: editTask.due_at,
        start_at: null,
        end_at: null,
        location: null,
      });
      onOpenChange(false);
    } catch {
      // handled upstream
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[480px] overflow-y-auto p-0">
        <form onSubmit={handleSubmit}>
          {/* Header with icon */}
          <SheetHeader className="px-6 pt-6 pb-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <CalendarCheck className="w-5 h-5 text-primary" />
              </div>
              <SheetTitle className="text-lg">
                {editTask ? "Edit" : "Create"} {taskType === "event" ? "Event" : "Schedule"}
              </SheetTitle>
            </div>
          </SheetHeader>

          <div className="px-6 space-y-4 pb-2">
            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="planner-title" className="text-xs font-medium text-muted-foreground">Title *</Label>
              <Input
                id="planner-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter title"
                maxLength={200}
                className="h-10"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional description"
                rows={2}
                maxLength={1000}
                className="resize-none"
              />
            </div>

            {/* Type + Category row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Type</Label>
                <Select value={taskType} onValueChange={(v) => setTaskType(v as "task" | "event")}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v)}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {plannerCategories.map((cat: { id: string; name: string; color: string }) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Status</Label>
              <Select value={columnId} onValueChange={setColumnId}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date picker */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal h-10", !selectedDate && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                    className={cn("p-3 pointer-events-auto")}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Start / End time — always visible */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Start Time</Label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-10" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">End Time</Label>
                <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-10" />
              </div>
            </div>

            {/* Recurrence */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Repeat</Label>
              <Select value={recurrenceFreq} onValueChange={(v) => setRecurrenceFreq(v as any)}>
                <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Does not repeat</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {recurrenceFreq !== "none" && (
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
                {/* Interval */}
                <div className="flex items-center gap-3">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">Every</Label>
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    value={recurrenceInterval}
                    onChange={e => setRecurrenceInterval(Number(e.target.value))}
                    className="h-8 w-16 text-center"
                  />
                  <span className="text-xs text-muted-foreground">
                    {recurrenceFreq === "daily" ? "day(s)" : recurrenceFreq === "weekly" ? "week(s)" : recurrenceFreq === "monthly" ? "month(s)" : "year(s)"}
                  </span>
                </div>

                {/* Day picker for weekly */}
                {recurrenceFreq === "weekly" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">On days</Label>
                    <div className="flex gap-1.5">
                      {[["SU","S"],["MO","M"],["TU","T"],["WE","W"],["TH","T"],["FR","F"],["SA","S"]].map(([val, label]) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setRecurrenceDays(prev =>
                            prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val]
                          )}
                          className={cn(
                            "w-8 h-8 rounded-full text-xs font-semibold border transition-colors",
                            recurrenceDays.includes(val)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-background text-muted-foreground border-border hover:border-primary/50"
                          )}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* End condition */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Ends</Label>
                  <div className="space-y-2">
                    {[
                      { val: "never", label: "Never" },
                      { val: "on_date", label: "On date" },
                      { val: "after_n", label: "After" },
                    ].map(opt => (
                      <label key={opt.val} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="recurrence-end"
                          value={opt.val}
                          checked={recurrenceEndType === opt.val}
                          onChange={() => setRecurrenceEndType(opt.val as any)}
                          className="accent-primary"
                        />
                        <span className="text-sm">{opt.label}</span>
                        {opt.val === "on_date" && recurrenceEndType === "on_date" && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm" className="h-7 text-xs ml-1">
                                {recurrenceEndDate ? format(recurrenceEndDate, "MMM d, yyyy") : "Pick date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={recurrenceEndDate} onSelect={setRecurrenceEndDate} className="p-3 pointer-events-auto" />
                            </PopoverContent>
                          </Popover>
                        )}
                        {opt.val === "after_n" && recurrenceEndType === "after_n" && (
                          <div className="flex items-center gap-1.5 ml-1">
                            <Input
                              type="number"
                              min={1}
                              max={999}
                              value={recurrenceCount}
                              onChange={e => setRecurrenceCount(Number(e.target.value))}
                              className="h-7 w-14 text-center text-xs"
                            />
                            <span className="text-xs text-muted-foreground">occurrences</span>
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Location */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Location</Label>
              <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional location" className="h-10" />
            </div>
          </div>

          {/* Footer */}
          <SheetFooter className="px-6 py-4 border-t border-border flex-col sm:flex-row gap-2">
            {editTask && isScheduled && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="gap-1.5 text-muted-foreground mr-auto"
                onClick={handleUnschedule}
                disabled={isSubmitting}
              >
                <CalendarOff className="w-4 h-4" />
                Unschedule
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : editTask ? "Update" : "Create"}</Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
};
