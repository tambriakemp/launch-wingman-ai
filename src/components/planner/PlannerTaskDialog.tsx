import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import {
  CalendarCheck,
  CalendarIcon,
  CalendarOff,
  ChevronLeft,
  CircleDot,
  FolderOpen,
  Tag,
  RefreshCw,
  Plus,
  Trash2,
  MoreHorizontal,
  CheckSquare,
  Square,
  ListChecks,
} from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { PlannerSpace, SpaceCategory } from "@/hooks/usePlannerSpaces";

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

interface Subtask {
  id: string;
  task_id: string;
  user_id: string;
  title: string;
  completed: boolean;
  position: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

const STATUSES = [
  { id: "todo", label: "To Do" },
  { id: "in-progress", label: "Doing" },
  { id: "done", label: "Done" },
];

function isoToLocalTime(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

interface PlannerTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<PlannerTask>) => Promise<void>;
  editTask?: PlannerTask | null;
  defaultDueAt?: Date | null;
  spaces?: PlannerSpace[];
  categories?: SpaceCategory[];
  allCategories?: SpaceCategory[];
  selectedSpaceId?: string | null;
}

export const PlannerTaskDialog = ({
  open,
  onOpenChange,
  onSubmit,
  editTask,
  defaultDueAt,
  spaces = [],
  categories = [],
  allCategories = [],
  selectedSpaceId = null,
}: PlannerTaskDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [columnId, setColumnId] = useState("todo");
  const [category, setCategory] = useState("");
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recurrenceFreq, setRecurrenceFreq] = useState<"none"|"daily"|"weekly"|"monthly"|"yearly">("none");
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>([]);
  const [recurrenceEndType, setRecurrenceEndType] = useState<"never"|"on_date"|"after_n">("never");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>(undefined);
  const [recurrenceCount, setRecurrenceCount] = useState(10);

  // Subtasks state
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [activeSubtask, setActiveSubtask] = useState<Subtask | null>(null);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [subtaskDescription, setSubtaskDescription] = useState("");
  const [subtaskSaving, setSubtaskSaving] = useState(false);

  const spaceCats = spaceId
    ? allCategories.filter(c => c.space_id === spaceId)
    : categories;

  const isScheduled = editTask && (editTask.start_at || editTask.end_at);

  // Fetch subtasks
  const fetchSubtasks = useCallback(async (taskId: string) => {
    const { data } = await supabase
      .from("subtasks")
      .select("*")
      .eq("task_id", taskId)
      .order("position", { ascending: true });
    if (data) setSubtasks(data as unknown as Subtask[]);
  }, []);

  useEffect(() => {
    if (!open) {
      setActiveSubtask(null);
      return;
    }
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description || "");
      setColumnId(editTask.column_id);
      setSpaceId((editTask as any).space_id || selectedSpaceId);

      const editCat = editTask.category;
      const catExists = spaceCats.some(c => c.id === editCat);
      setCategory(catExists && editCat ? editCat : spaceCats[0]?.id || "");

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

      setEndTime(editTask.end_at ? isoToLocalTime(editTask.end_at) : "");

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
      fetchSubtasks(editTask.id);
    } else {
      setTitle("");
      setDescription("");
      setColumnId("todo");
      setSpaceId(selectedSpaceId);
      setCategory(spaceCats[0]?.id || "");
      setSelectedDate(defaultDueAt || undefined);
      setStartTime("");
      setEndTime("");
      setRecurrenceFreq("none");
      setRecurrenceInterval(1);
      setRecurrenceDays([]);
      setRecurrenceEndType("never");
      setRecurrenceEndDate(undefined);
      setRecurrenceCount(10);
      setSubtasks([]);
    }
  }, [editTask, open, defaultDueAt, selectedSpaceId]);

  useEffect(() => {
    if (!open) return;
    const newCats = spaceId
      ? allCategories.filter(c => c.space_id === spaceId)
      : categories;
    const currentValid = newCats.some(c => c.id === category);
    if (!currentValid && newCats.length > 0) {
      setCategory(newCats[0].id);
    }
  }, [spaceId]);

  const combineDatetime = (date: Date, time: string): string => {
    const [h, m] = time.split(":").map(Number);
    const combined = new Date(date);
    combined.setHours(h, m, 0, 0);
    return combined.toISOString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Title is required"); return; }
    if (startTime && !endTime) { toast.error("End time is required when start time is set"); return; }
    if (endTime && !startTime) { toast.error("Start time is required when end time is set"); return; }
    if (startTime && endTime && startTime >= endTime) { toast.error("End time must be after start time"); return; }

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
        task_type: "task",
        column_id: columnId,
        category: category || null,
        due_at: selectedDate ? selectedDate.toISOString() : null,
        start_at: hasSchedule ? combineDatetime(selectedDate!, startTime) : null,
        end_at: hasSchedule ? combineDatetime(selectedDate!, endTime) : null,
        location: null,
        recurrence_rule: recurrenceRuleValue,
        ...(({ space_id: spaceId }) as any),
      });
      onOpenChange(false);
    } catch {} finally {
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
        task_type: "task",
        column_id: editTask.column_id,
        category: editTask.category,
        due_at: editTask.due_at,
        start_at: null,
        end_at: null,
        location: null,
        ...(({ space_id: spaceId }) as any),
      });
      onOpenChange(false);
    } catch {} finally {
      setIsSubmitting(false);
    }
  };

  // --- Subtask CRUD ---
  const addSubtask = async () => {
    if (!editTask || !newSubtaskTitle.trim()) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    const { error } = await supabase.from("subtasks").insert({
      task_id: editTask.id,
      user_id: userData.user.id,
      title: newSubtaskTitle.trim(),
      position: subtasks.length,
    });
    if (error) { toast.error("Failed to add subtask"); return; }
    setNewSubtaskTitle("");
    fetchSubtasks(editTask.id);
  };

  const toggleSubtask = async (st: Subtask) => {
    await supabase.from("subtasks").update({ completed: !st.completed }).eq("id", st.id);
    setSubtasks(prev => prev.map(s => s.id === st.id ? { ...s, completed: !s.completed } : s));
  };

  const deleteSubtask = async (id: string) => {
    await supabase.from("subtasks").delete().eq("id", id);
    if (editTask) fetchSubtasks(editTask.id);
  };

  const openSubtaskDetail = (st: Subtask) => {
    setActiveSubtask(st);
    setSubtaskTitle(st.title);
    setSubtaskDescription((st as any).description || "");
  };

  const saveSubtaskDetail = async () => {
    if (!activeSubtask) return;
    setSubtaskSaving(true);
    await supabase.from("subtasks").update({
      title: subtaskTitle.trim(),
      description: subtaskDescription.trim() || null,
    } as any).eq("id", activeSubtask.id);
    setSubtaskSaving(false);
    if (editTask) fetchSubtasks(editTask.id);
    setActiveSubtask(null);
    toast.success("Subtask updated");
  };

  const completedCount = subtasks.filter(s => s.completed).length;
  const progressPct = subtasks.length > 0 ? (completedCount / subtasks.length) * 100 : 0;

  // --- Subtask Detail View ---
  if (activeSubtask) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-[720px] overflow-y-auto p-0">
          <SheetHeader className="px-6 pt-6 pb-4">
            <div className="flex items-center gap-3">
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveSubtask(null)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <ListChecks className="w-4 h-4 text-primary" />
              </div>
              <SheetTitle className="text-lg">Subtask Details</SheetTitle>
            </div>
          </SheetHeader>

          <div className="px-6 space-y-5 pb-6">
            {/* Completed toggle */}
            <div className="flex items-center gap-3">
              <Checkbox
                checked={activeSubtask.completed}
                onCheckedChange={() => {
                  toggleSubtask(activeSubtask);
                  setActiveSubtask({ ...activeSubtask, completed: !activeSubtask.completed });
                }}
              />
              <span className={cn("text-sm", activeSubtask.completed && "line-through text-muted-foreground")}>
                {activeSubtask.completed ? "Completed" : "Not completed"}
              </span>
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Title</Label>
              <Input value={subtaskTitle} onChange={e => setSubtaskTitle(e.target.value)} className="h-10 text-base font-medium" />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Description</Label>
              <Textarea value={subtaskDescription} onChange={e => setSubtaskDescription(e.target.value)} placeholder="Add details about this subtask..." rows={4} className="resize-none" />
            </div>

            {/* Meta */}
            <div className="text-xs text-muted-foreground">
              Created {format(new Date(activeSubtask.created_at), "PPP 'at' p")}
            </div>
          </div>

          <SheetFooter className="px-6 py-4 border-t border-border">
            <Button type="button" variant="outline" onClick={() => setActiveSubtask(null)}>Cancel</Button>
            <Button onClick={saveSubtaskDetail} disabled={subtaskSaving}>{subtaskSaving ? "Saving..." : "Save"}</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }

  // --- Main Task View ---
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[720px] overflow-y-auto p-0">
        <form onSubmit={handleSubmit}>
          <SheetHeader className="px-6 pt-6 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <CalendarCheck className="w-5 h-5 text-primary" />
              </div>
              <SheetTitle className="text-lg">
                {editTask ? "Edit" : "Create"} Task
              </SheetTitle>
            </div>
          </SheetHeader>

          <div className="px-6 space-y-5 pb-2">
            {/* Title — large input */}
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task name"
              maxLength={200}
              className="h-12 text-lg font-semibold border-none shadow-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
            />

            {/* ClickUp-style property grid */}
            <div className="rounded-xl border border-border bg-muted/20 divide-y divide-border">
              {/* Row: Status + Space */}
              <div className="grid grid-cols-2 divide-x divide-border">
                <PropertyRow icon={CircleDot} label="Status">
                  <Select value={columnId} onValueChange={setColumnId}>
                    <SelectTrigger className="h-8 border-none shadow-none bg-transparent text-sm px-2 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </PropertyRow>

                {spaces.length > 0 ? (
                  <PropertyRow icon={FolderOpen} label="Space">
                    <Select value={spaceId || "none"} onValueChange={(v) => setSpaceId(v === "none" ? null : v)}>
                      <SelectTrigger className="h-8 border-none shadow-none bg-transparent text-sm px-2 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No space</SelectItem>
                        {spaces.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ background: s.color }} />
                              {s.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </PropertyRow>
                ) : (
                  <PropertyRow icon={FolderOpen} label="Space">
                    <span className="text-sm text-muted-foreground px-2">—</span>
                  </PropertyRow>
                )}
              </div>

              {/* Row: Date + Category */}
              <div className="grid grid-cols-2 divide-x divide-border">
                <PropertyRow icon={CalendarIcon} label="Date">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className={cn("text-sm px-2 py-1 rounded hover:bg-accent/50 text-left truncate", !selectedDate && "text-muted-foreground")}>
                        {selectedDate ? format(selectedDate, "MMM d, yyyy") : "None"}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} initialFocus className="p-3 pointer-events-auto" />
                    </PopoverContent>
                  </Popover>
                </PropertyRow>

                {spaceCats.length > 0 ? (
                  <PropertyRow icon={Tag} label="Category">
                    <Select value={category} onValueChange={setCategory}>
                      <SelectTrigger className="h-8 border-none shadow-none bg-transparent text-sm px-2 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {spaceCats.map(cat => (
                          <SelectItem key={cat.id} value={cat.id}>
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ background: cat.color }} />
                              {cat.name}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </PropertyRow>
                ) : (
                  <PropertyRow icon={Tag} label="Category">
                    <span className="text-sm text-muted-foreground px-2">—</span>
                  </PropertyRow>
                )}
              </div>

              {/* Row: Start/End Time + Repeat */}
              <div className="grid grid-cols-2 divide-x divide-border">
                <PropertyRow icon={CalendarCheck} label="Time">
                  <div className="flex items-center gap-1 px-1">
                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-7 w-[5.5rem] text-xs border-none shadow-none bg-transparent px-1" />
                    <span className="text-muted-foreground text-xs">→</span>
                    <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-7 w-[5.5rem] text-xs border-none shadow-none bg-transparent px-1" />
                  </div>
                </PropertyRow>

                <PropertyRow icon={RefreshCw} label="Repeat">
                  <Select value={recurrenceFreq} onValueChange={(v) => setRecurrenceFreq(v as any)}>
                    <SelectTrigger className="h-8 border-none shadow-none bg-transparent text-sm px-2 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="yearly">Yearly</SelectItem>
                    </SelectContent>
                  </Select>
                </PropertyRow>
              </div>
            </div>

            {/* Recurrence detail panel */}
            {recurrenceFreq !== "none" && (
              <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <Label className="text-xs text-muted-foreground whitespace-nowrap">Every</Label>
                  <Input type="number" min={1} max={99} value={recurrenceInterval} onChange={e => setRecurrenceInterval(Number(e.target.value))} className="h-8 w-16 text-center" />
                  <span className="text-xs text-muted-foreground">
                    {recurrenceFreq === "daily" ? "day(s)" : recurrenceFreq === "weekly" ? "week(s)" : recurrenceFreq === "monthly" ? "month(s)" : "year(s)"}
                  </span>
                </div>

                {recurrenceFreq === "weekly" && (
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">On days</Label>
                    <div className="flex gap-1.5">
                      {[["SU","S"],["MO","M"],["TU","T"],["WE","W"],["TH","T"],["FR","F"],["SA","S"]].map(([val, label]) => (
                        <button key={val} type="button"
                          onClick={() => setRecurrenceDays(prev => prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val])}
                          className={cn("w-8 h-8 rounded-full text-xs font-semibold border transition-colors",
                            recurrenceDays.includes(val) ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/50"
                          )}
                        >{label}</button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Ends</Label>
                  <div className="space-y-2">
                    {[
                      { val: "never", label: "Never" },
                      { val: "on_date", label: "On date" },
                      { val: "after_n", label: "After" },
                    ].map(opt => (
                      <label key={opt.val} className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="recurrence-end" value={opt.val} checked={recurrenceEndType === opt.val} onChange={() => setRecurrenceEndType(opt.val as any)} className="accent-primary" />
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
                            <Input type="number" min={1} max={999} value={recurrenceCount} onChange={e => setRecurrenceCount(Number(e.target.value))} className="h-7 w-14 text-center text-xs" />
                            <span className="text-xs text-muted-foreground">occurrences</span>
                          </div>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Add a description..." rows={3} maxLength={1000} className="resize-none" />
            </div>

            {/* Subtasks — only when editing */}
            {editTask && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Subtasks</span>
                    {subtasks.length > 0 && (
                      <span className="text-xs text-muted-foreground">({completedCount}/{subtasks.length})</span>
                    )}
                  </div>
                </div>

                {subtasks.length > 0 && (
                  <Progress value={progressPct} className="h-1.5" indicatorClassName="bg-primary" />
                )}

                <div className="space-y-1">
                  {subtasks.map(st => (
                    <div key={st.id} className="group flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <Checkbox
                        checked={st.completed}
                        onCheckedChange={() => toggleSubtask(st)}
                        className="shrink-0"
                      />
                      <button
                        type="button"
                        onClick={() => openSubtaskDetail(st)}
                        className={cn(
                          "flex-1 text-left text-sm truncate",
                          st.completed && "line-through text-muted-foreground"
                        )}
                      >
                        {st.title}
                      </button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openSubtaskDetail(st)}>Edit</DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive" onClick={() => deleteSubtask(st.id)}>Delete</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  ))}
                </div>

                {/* Add subtask input */}
                <div className="flex items-center gap-2">
                  <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
                  <Input
                    value={newSubtaskTitle}
                    onChange={e => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addSubtask(); } }}
                    placeholder="Add a subtask..."
                    className="h-8 text-sm border-none shadow-none bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  {newSubtaskTitle.trim() && (
                    <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={addSubtask}>Add</Button>
                  )}
                </div>
              </div>
            )}
          </div>

          <SheetFooter className="px-6 py-4 border-t border-border flex-col sm:flex-row gap-2">
            {editTask && isScheduled && (
              <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground mr-auto" onClick={handleUnschedule} disabled={isSubmitting}>
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

// --- Helper: Property Row ---
function PropertyRow({ icon: Icon, label, children }: { icon: any; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 min-h-[40px]">
      <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <span className="text-xs text-muted-foreground w-16 shrink-0">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}
