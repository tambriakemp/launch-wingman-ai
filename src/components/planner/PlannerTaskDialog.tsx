import { useState, useEffect, useCallback } from "react";
import { format, addDays, addWeeks, nextSaturday, startOfDay } from "date-fns";
import {
  CalendarCheck,
  CalendarIcon,
  CalendarOff,
  ChevronLeft,
  CircleDot,
  Tag,
  RefreshCw,
  Plus,
  Trash2,
  MoreHorizontal,
  CheckSquare,
  Square,
  ListChecks,
  Flag,
  Clock,
  FolderOpen,
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
  priority?: string;
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

const PRIORITIES = [
  { id: "urgent", label: "Urgent", color: "text-red-500" },
  { id: "high", label: "High", color: "text-orange-500" },
  { id: "normal", label: "Normal", color: "text-blue-500" },
  { id: "low", label: "Low", color: "text-muted-foreground" },
];

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
  onCreateCategory?: (spaceId: string, name: string) => Promise<SpaceCategory | null>;
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
  onCreateCategory,
}: PlannerTaskDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [columnId, setColumnId] = useState("todo");
  const [priority, setPriority] = useState("normal");
  const [category, setCategory] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [recurrenceFreq, setRecurrenceFreq] = useState<"none"|"daily"|"weekly"|"monthly"|"yearly">("none");
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceDays, setRecurrenceDays] = useState<string[]>([]);
  const [recurrenceEndType, setRecurrenceEndType] = useState<"never"|"on_date"|"after_n">("never");
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<Date | undefined>(undefined);
  const [recurrenceCount, setRecurrenceCount] = useState(10);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [showRepeat, setShowRepeat] = useState(false);
  const [taskSpaceId, setTaskSpaceId] = useState<string>("");

  // Subtasks state
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [activeSubtask, setActiveSubtask] = useState<Subtask | null>(null);
  const [subtaskTitle, setSubtaskTitle] = useState("");
  const [subtaskDescription, setSubtaskDescription] = useState("");
  const [subtaskSaving, setSubtaskSaving] = useState(false);

  const effectiveSpaceId = taskSpaceId || selectedSpaceId;
  const spaceCats = effectiveSpaceId
    ? allCategories.filter(c => c.space_id === effectiveSpaceId)
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
      setShowRepeat(false);
      return;
    }
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description || "");
      setColumnId(editTask.column_id);
      setPriority((editTask as any).priority || "normal");
      setTaskSpaceId((editTask as any).space_id || "");

      const editCat = editTask.category;
      const catExists = spaceCats.some(c => c.id === editCat);
      setCategory(catExists && editCat ? editCat : "");

      if (editTask.start_at) {
        setStartDate(new Date(editTask.start_at));
      } else if (editTask.due_at) {
        setStartDate(new Date(editTask.due_at));
      } else {
        setStartDate(undefined);
      }
      setEndDate(editTask.end_at ? new Date(editTask.end_at) : undefined);

      if (editTask.recurrence_rule) {
        const r = editTask.recurrence_rule;
        setRecurrenceFreq(r.freq || "none");
        setRecurrenceInterval(r.interval || 1);
        setRecurrenceDays(r.days || []);
        setRecurrenceEndType(r.end_type || "never");
        setRecurrenceEndDate(r.end_date ? new Date(r.end_date) : undefined);
        setRecurrenceCount(r.count || 10);
        setShowRepeat(true);
      } else {
        setRecurrenceFreq("none");
        setRecurrenceInterval(1);
        setRecurrenceDays([]);
        setRecurrenceEndType("never");
        setRecurrenceEndDate(undefined);
        setRecurrenceCount(10);
        setShowRepeat(false);
      }
      fetchSubtasks(editTask.id);
    } else {
      setTitle("");
      setDescription("");
      setColumnId("todo");
      setPriority("normal");
      setCategory("");
      setStartDate(defaultDueAt || undefined);
      // If defaultDueAt has a specific time (from timeslot click), auto-set end to +1 hour
      if (defaultDueAt && (defaultDueAt.getHours() !== 0 || defaultDueAt.getMinutes() !== 0)) {
        const autoEnd = new Date(defaultDueAt);
        autoEnd.setHours(autoEnd.getHours() + 1);
        setEndDate(autoEnd);
      } else {
        setEndDate(undefined);
      }
      setRecurrenceFreq("none");
      setRecurrenceInterval(1);
      setRecurrenceDays([]);
      setRecurrenceEndType("never");
      setRecurrenceEndDate(undefined);
      setRecurrenceCount(10);
      setSubtasks([]);
      setShowRepeat(false);
      // Default to first space if no space selected (All Spaces view)
      setTaskSpaceId(!selectedSpaceId && spaces.length > 0 ? spaces[0].id : (selectedSpaceId || ""));
    }
  }, [editTask, open, defaultDueAt, selectedSpaceId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) { toast.error("Title is required"); return; }

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
        priority,
        category: category || null,
        due_at: startDate ? startDate.toISOString() : null,
        start_at: startDate ? startDate.toISOString() : null,
        end_at: endDate ? endDate.toISOString() : null,
        location: null,
        recurrence_rule: recurrenceRuleValue,
        ...(({ space_id: taskSpaceId || selectedSpaceId }) as any),
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
        priority: (editTask as any).priority || "normal",
        category: editTask.category,
        due_at: null,
        start_at: null,
        end_at: null,
        location: null,
        ...(({ space_id: taskSpaceId || selectedSpaceId }) as any),
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

  // Date quick-pick helpers
  const today = startOfDay(new Date());
  const quickDates = [
    { label: "Today", sub: format(today, "EEE"), date: today },
    { label: "Later", sub: format(today, "h:mm a"), date: today },
    { label: "Tomorrow", sub: format(addDays(today, 1), "EEE"), date: addDays(today, 1) },
    { label: "Next week", sub: format(addDays(today, 7), "MMM d"), date: addDays(today, 7) },
    { label: "Next weekend", sub: format(nextSaturday(today), "MMM d"), date: nextSaturday(today) },
    { label: "2 weeks", sub: format(addWeeks(today, 2), "MMM d"), date: addWeeks(today, 2) },
    { label: "4 weeks", sub: format(addWeeks(today, 4), "MMM d"), date: addWeeks(today, 4) },
  ];

  const priorityInfo = PRIORITIES.find(p => p.id === priority) || PRIORITIES[2];

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

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Title</Label>
              <Input value={subtaskTitle} onChange={e => setSubtaskTitle(e.target.value)} className="h-10 text-base font-medium" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Description</Label>
              <Textarea value={subtaskDescription} onChange={e => setSubtaskDescription(e.target.value)} placeholder="Add details about this subtask..." rows={4} className="resize-none" />
            </div>

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
              className="h-12 text-lg font-semibold border-none shadow-none px-2 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/50"
            />

            {/* ClickUp-style property grid */}
            <div className="rounded-xl border border-border bg-muted/20 divide-y divide-border">
              {/* Row 1: Status + Priority */}
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

                <PropertyRow icon={Flag} label="Priority">
                  <Select value={priority} onValueChange={setPriority}>
                    <SelectTrigger className="h-8 border-none shadow-none bg-transparent text-sm px-2 w-full">
                      <SelectValue>
                        <span className={priorityInfo.color}>{priorityInfo.label}</span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {PRIORITIES.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          <span className={p.color}>{p.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </PropertyRow>
              </div>

              {/* Row 2: Dates + Category */}
              <div className="grid grid-cols-2 divide-x divide-border">
                <PropertyRow icon={CalendarIcon} label="Dates">
                  <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <button type="button" className={cn("text-sm px-2 py-1 rounded hover:bg-accent/50 text-left truncate w-full", !startDate && !endDate && "text-muted-foreground")}>
                        {startDate && endDate
                          ? `${format(startDate, "MMM d")} → ${format(endDate, "MMM d")}`
                          : startDate
                            ? format(startDate, "MMM d, yyyy")
                            : "Set dates"}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start" side="bottom">
                      <DatePickerPanel
                        startDate={startDate}
                        endDate={endDate}
                        onStartDateChange={setStartDate}
                        onEndDateChange={setEndDate}
                        quickDates={quickDates}
                        showRepeat={showRepeat}
                        setShowRepeat={setShowRepeat}
                        recurrenceFreq={recurrenceFreq}
                        setRecurrenceFreq={setRecurrenceFreq}
                        recurrenceInterval={recurrenceInterval}
                        setRecurrenceInterval={setRecurrenceInterval}
                        recurrenceDays={recurrenceDays}
                        setRecurrenceDays={setRecurrenceDays}
                        recurrenceEndType={recurrenceEndType}
                        setRecurrenceEndType={setRecurrenceEndType}
                        recurrenceEndDate={recurrenceEndDate}
                        setRecurrenceEndDate={setRecurrenceEndDate}
                        recurrenceCount={recurrenceCount}
                        setRecurrenceCount={setRecurrenceCount}
                        onClose={() => setDatePickerOpen(false)}
                      />
                    </PopoverContent>
                  </Popover>
                </PropertyRow>

                {(() => {
                  return (
                    <PropertyRow icon={Tag} label="Category">
                      <CategoryCombobox
                        categories={spaceCats}
                        value={category}
                        onChange={setCategory}
                        selectedSpaceId={taskSpaceId || selectedSpaceId}
                        onCreateCategory={onCreateCategory}
                      />
                    </PropertyRow>
                  );
                })()}
              </div>

              {/* Row 3: Space selector — only when in All Spaces view and creating */}
              {!selectedSpaceId && spaces.length > 0 && (
                <div className="grid grid-cols-2 divide-x divide-border">
                  <PropertyRow icon={FolderOpen} label="Space">
                    <Select value={taskSpaceId} onValueChange={setTaskSpaceId}>
                      <SelectTrigger className="h-8 border-none shadow-none bg-transparent text-sm px-2 w-full">
                        <SelectValue placeholder="Select space" />
                      </SelectTrigger>
                      <SelectContent>
                        {spaces.map((s) => (
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
                  <div />
                </div>
              )}
            </div>

            {/* Description — longer */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description, notes, or details..."
                rows={6}
                maxLength={2000}
                className="resize-none"
              />
            </div>

            {/* Subtasks — only when editing, with more spacing */}
            {editTask && (
              <div className="space-y-3 pt-4 border-t border-border">
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
                  <Progress value={progressPct} className="h-1.5" />
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

// --- Category Combobox ---
function CategoryCombobox({
  categories, value, onChange, selectedSpaceId, onCreateCategory,
}: {
  categories: SpaceCategory[];
  value: string;
  onChange: (v: string) => void;
  selectedSpaceId?: string | null;
  onCreateCategory?: (spaceId: string, name: string) => Promise<SpaceCategory | null>;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = search.trim()
    ? categories.filter(c => c.name.toLowerCase().includes(search.toLowerCase()))
    : categories;

  const exactMatch = categories.some(c => c.name.toLowerCase() === search.trim().toLowerCase());
  const selected = categories.find(c => c.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className="flex items-center gap-2 text-sm px-2 py-1 rounded hover:bg-accent/50 text-left truncate w-full">
          {selected ? (
            <>
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: selected.color }} />
              {selected.name}
            </>
          ) : (
            <span className="text-muted-foreground">Select...</span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-2" align="start">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search or create..."
          className="h-8 text-sm mb-2"
          autoFocus
        />
        <div className="max-h-40 overflow-y-auto space-y-0.5">
          {filtered.map(c => (
            <button
              key={c.id}
              type="button"
              className={cn("w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent/50 text-left", c.id === value && "bg-accent")}
              onClick={() => { onChange(c.id); setOpen(false); setSearch(""); }}
            >
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: c.color }} />
              {c.name}
            </button>
          ))}
          {search.trim() && !exactMatch && selectedSpaceId && onCreateCategory && (
            <button
              type="button"
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-accent/50 text-left text-primary"
              onClick={async () => {
                const cat = await onCreateCategory(selectedSpaceId, search.trim());
                if (cat) { onChange(cat.id); setOpen(false); setSearch(""); }
              }}
            >
              <Plus className="w-3.5 h-3.5" /> Create "{search.trim()}"
            </button>
          )}
          {categories.length === 0 && !search.trim() && (
            <p className="text-xs text-muted-foreground px-2 py-1">No categories</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

// --- ClickUp-style Date Picker Panel ---
interface DatePickerPanelProps {
  startDate: Date | undefined;
  endDate: Date | undefined;
  onStartDateChange: (d: Date | undefined) => void;
  onEndDateChange: (d: Date | undefined) => void;
  quickDates: { label: string; sub: string; date: Date }[];
  showRepeat: boolean;
  setShowRepeat: (v: boolean) => void;
  recurrenceFreq: string;
  setRecurrenceFreq: (v: any) => void;
  recurrenceInterval: number;
  setRecurrenceInterval: (v: number) => void;
  recurrenceDays: string[];
  setRecurrenceDays: (v: string[] | ((prev: string[]) => string[])) => void;
  recurrenceEndType: string;
  setRecurrenceEndType: (v: any) => void;
  recurrenceEndDate: Date | undefined;
  setRecurrenceEndDate: (v: Date | undefined) => void;
  recurrenceCount: number;
  setRecurrenceCount: (v: number) => void;
  onClose: () => void;
}

function DatePickerPanel({
  startDate, endDate, onStartDateChange, onEndDateChange,
  quickDates, showRepeat, setShowRepeat,
  recurrenceFreq, setRecurrenceFreq,
  recurrenceInterval, setRecurrenceInterval,
  recurrenceDays, setRecurrenceDays,
  recurrenceEndType, setRecurrenceEndType,
  recurrenceEndDate, setRecurrenceEndDate,
  recurrenceCount, setRecurrenceCount,
  onClose,
}: DatePickerPanelProps) {
  const [activePicker, setActivePicker] = useState<"start" | "due">("start");

  return (
    <div className="flex pointer-events-auto">
      {/* Left: Quick picks + Set Recurring */}
      <div className="w-44 border-r border-border py-2">
        {quickDates.map(q => (
          <button
            key={q.label}
            type="button"
            className="flex items-center justify-between w-full px-3 py-1.5 text-sm hover:bg-accent/50 text-left"
            onClick={() => {
              if (activePicker === "start") onStartDateChange(q.date);
              else onEndDateChange(q.date);
            }}
          >
            <span>{q.label}</span>
            <span className="text-xs text-muted-foreground">{q.sub}</span>
          </button>
        ))}
        <div className="border-t border-border my-1" />
        <button
          type="button"
          className="flex items-center gap-2 w-full px-3 py-1.5 text-sm hover:bg-accent/50 text-left"
          onClick={() => {
            if (showRepeat) {
              setRecurrenceFreq("none");
              setRecurrenceInterval(1);
              setRecurrenceEndType("never");
              setRecurrenceEndDate(undefined);
              setRecurrenceCount(10);
            }
            setShowRepeat(!showRepeat);
          }}
        >
          <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
          <span>Set Recurring</span>
        </button>
      </div>

      {/* Right: Calendar + tabs */}
      <div className="p-3 space-y-3">
        {/* Start / Due tabs */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setActivePicker("start")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border transition-colors",
              activePicker === "start" ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50"
            )}
          >
            <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground text-xs">Start</span>
            <span className="text-xs font-medium ml-auto">{startDate ? format(startDate, "MMM d") : "—"}</span>
          </button>
          <button
            type="button"
            onClick={() => setActivePicker("due")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm border transition-colors",
              activePicker === "due" ? "border-primary bg-primary/5" : "border-border hover:bg-accent/50"
            )}
          >
           <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-muted-foreground text-xs">Due</span>
            <span className="text-xs font-medium ml-auto">{endDate ? format(endDate, "MMM d") : "—"}</span>
            {endDate && (
              <button
                type="button"
                className="text-muted-foreground hover:text-foreground ml-1"
                onClick={(e) => { e.stopPropagation(); onEndDateChange(undefined); }}
                title="Clear due date"
              >
                <CalendarOff className="h-3 w-3" />
              </button>
            )}
          </button>
        </div>

        <Calendar
          mode="single"
          selected={activePicker === "start" ? startDate : endDate}
          onSelect={(d) => {
            if (activePicker === "start") onStartDateChange(d);
            else onEndDateChange(d);
          }}
          className="p-0 pointer-events-auto"
        />

        {/* Repeat section */}
        {showRepeat && (
          <div className="border-t border-border pt-3 space-y-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-medium">Repeat</span>
            </div>
            <Select value={recurrenceFreq} onValueChange={(v) => setRecurrenceFreq(v)}>
              <SelectTrigger className="h-8 text-sm">
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

            {recurrenceFreq !== "none" && (
              <>
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-muted-foreground">Every</Label>
                  <Input type="number" min={1} max={99} value={recurrenceInterval} onChange={e => setRecurrenceInterval(Number(e.target.value))} className="h-7 w-14 text-center text-xs" />
                  <span className="text-xs text-muted-foreground">
                    {recurrenceFreq === "daily" ? "day(s)" : recurrenceFreq === "weekly" ? "week(s)" : recurrenceFreq === "monthly" ? "month(s)" : "year(s)"}
                  </span>
                </div>

                {recurrenceFreq === "weekly" && (
                  <div className="flex gap-1">
                    {[["SU","S"],["MO","M"],["TU","T"],["WE","W"],["TH","T"],["FR","F"],["SA","S"]].map(([val, label]) => (
                      <button key={val} type="button"
                        onClick={() => setRecurrenceDays(prev => prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val])}
                        className={cn("w-7 h-7 rounded-full text-xs font-semibold border transition-colors",
                          recurrenceDays.includes(val) ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:border-primary/50"
                        )}
                      >{label}</button>
                    ))}
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Ends</Label>
                  {[
                    { val: "never", label: "Never" },
                    { val: "on_date", label: "On date" },
                    { val: "after_n", label: "After" },
                  ].map(opt => (
                    <label key={opt.val} className="flex items-center gap-2 cursor-pointer">
                      <input type="radio" name="recurrence-end-dp" value={opt.val} checked={recurrenceEndType === opt.val} onChange={() => setRecurrenceEndType(opt.val)} className="accent-primary" />
                      <span className="text-xs">{opt.label}</span>
                      {opt.val === "after_n" && recurrenceEndType === "after_n" && (
                        <Input type="number" min={1} max={999} value={recurrenceCount} onChange={e => setRecurrenceCount(Number(e.target.value))} className="h-6 w-12 text-center text-xs ml-1" />
                      )}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
