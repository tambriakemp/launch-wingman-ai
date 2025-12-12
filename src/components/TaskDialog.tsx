import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const COLUMNS = [
  { id: "todo", label: "To Do" },
  { id: "blocked", label: "Blocked/Waiting" },
  { id: "in-progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
];

export const TASK_LABELS = [
  { id: "technical", label: "Technical", color: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30" },
  { id: "creative", label: "Creative", color: "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30" },
  { id: "copy", label: "Copy", color: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  { id: "video", label: "Video", color: "bg-pink-500/20 text-pink-700 dark:text-pink-300 border-pink-500/30" },
  { id: "strategy", label: "Strategy", color: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  { id: "marketing", label: "Marketing", color: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/30" },
  { id: "high-priority", label: "High Priority", color: "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30" },
  { id: "can-delegate", label: "Can Delegate", color: "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30" },
  { id: "quick-win", label: "Quick Win", color: "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30" },
];

export interface Task {
  id: string;
  project_id: string;
  user_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  column_id: string;
  position: number;
  labels: string[] | null;
  created_at: string;
  updated_at: string;
}

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { title: string; description: string; due_date: Date | null; column_id: string; labels: string[] }) => Promise<void>;
  editTask?: Task | null;
  trigger?: React.ReactNode;
}

export const TaskDialog = ({
  open,
  onOpenChange,
  onSubmit,
  editTask,
  trigger,
}: TaskDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [columnId, setColumnId] = useState("todo");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description || "");
      setDueDate(editTask.due_date ? new Date(editTask.due_date) : undefined);
      setColumnId(editTask.column_id);
      setSelectedLabels(editTask.labels || []);
    } else {
      setTitle("");
      setDescription("");
      setDueDate(undefined);
      setColumnId("todo");
      setSelectedLabels([]);
    }
  }, [editTask, open]);

  const toggleLabel = (labelId: string) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast.error("Task title is required");
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        due_date: dueDate || null,
        column_id: columnId,
        labels: selectedLabels,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{editTask ? "Edit Task" : "Add New Task"}</DialogTitle>
            <DialogDescription>
              {editTask ? "Update task details below." : "Create a new task for your project board."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title"
                maxLength={200}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter task description"
                rows={3}
                maxLength={1000}
              />
            </div>
            <div className="grid gap-2">
              <Label>Labels</Label>
              <div className="flex flex-wrap gap-2">
                {TASK_LABELS.map((label) => (
                  <Badge
                    key={label.id}
                    variant="outline"
                    className={cn(
                      "cursor-pointer transition-all",
                      selectedLabels.includes(label.id)
                        ? label.color
                        : "bg-muted/50 text-muted-foreground hover:bg-muted"
                    )}
                    onClick={() => toggleLabel(label.id)}
                  >
                    {label.label}
                    {selectedLabels.includes(label.id) && (
                      <X className="w-3 h-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="column">Column</Label>
              <Select value={columnId} onValueChange={setColumnId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a column" />
                </SelectTrigger>
                <SelectContent>
                  {COLUMNS.map((column) => (
                    <SelectItem key={column.id} value={column.id}>
                      {column.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editTask ? "Update Task" : "Add Task"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
