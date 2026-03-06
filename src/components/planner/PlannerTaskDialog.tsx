import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
}

const STATUSES = [
  { id: "todo", label: "To Do" },
  { id: "in-progress", label: "Doing" },
  { id: "done", label: "Done" },
];

interface PlannerTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<PlannerTask>) => Promise<void>;
  editTask?: PlannerTask | null;
  defaultTaskType?: "task" | "event";
}

export const PlannerTaskDialog = ({
  open,
  onOpenChange,
  onSubmit,
  editTask,
  defaultTaskType = "task",
}: PlannerTaskDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskType, setTaskType] = useState<"task" | "event">("task");
  const [columnId, setColumnId] = useState("todo");
  const [category, setCategory] = useState<"business" | "life">("business");
  const [dueAt, setDueAt] = useState<Date | undefined>(undefined);
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [location, setLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description || "");
      setTaskType((editTask.task_type as "task" | "event") || "task");
      setColumnId(editTask.column_id);
      setCategory((editTask.category as "business" | "life") || "business");
      setDueAt(editTask.due_at ? new Date(editTask.due_at) : undefined);
      setStartAt(editTask.start_at ? editTask.start_at.slice(0, 16) : "");
      setEndAt(editTask.end_at ? editTask.end_at.slice(0, 16) : "");
      setLocation(editTask.location || "");
    } else {
      setTitle("");
      setDescription("");
      setTaskType(defaultTaskType);
      setColumnId("todo");
      setCategory("business");
      setDueAt(undefined);
      setStartAt("");
      setEndAt("");
      setLocation("");
    }
  }, [editTask, open, defaultTaskType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (taskType === "event" && (!startAt || !endAt)) {
      toast.error("Events require start and end times");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        task_type: taskType,
        column_id: columnId,
        category,
        due_at: dueAt ? dueAt.toISOString() : null,
        start_at: startAt ? new Date(startAt).toISOString() : null,
        end_at: endAt ? new Date(endAt).toISOString() : null,
        location: location.trim() || null,
      });
      onOpenChange(false);
    } catch {
      // handled upstream
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{editTask ? "Edit" : "Add"} {taskType === "event" ? "Event" : "Task"}</DialogTitle>
            <DialogDescription>
              {editTask ? "Update details below." : "Create a new planner item."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="planner-title">Title *</Label>
              <Input id="planner-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Enter title" maxLength={200} />
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={2} maxLength={1000} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select value={taskType} onValueChange={(v) => setTaskType(v as "task" | "event")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={(v) => setCategory(v as "business" | "life")}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="business">Business</SelectItem>
                    <SelectItem value="life">Life</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Status</Label>
              <Select value={columnId} onValueChange={setColumnId}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-full justify-start text-left font-normal", !dueAt && "text-muted-foreground")}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueAt ? format(dueAt, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={dueAt} onSelect={setDueAt} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            {(taskType === "event" || startAt || endAt) && (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-2">
                    <Label>Start {taskType === "event" && "*"}</Label>
                    <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>End {taskType === "event" && "*"}</Label>
                    <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Location</Label>
                  <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional location" />
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving..." : editTask ? "Update" : "Create"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
