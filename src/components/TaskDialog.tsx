import { useState, useEffect, useCallback } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, X, Plus, Trash2, CheckCircle2, Circle, ListTodo } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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

export const TASK_PHASES = [
  { id: "foundation", label: "Foundation", color: "bg-slate-500/20 text-slate-700 dark:text-slate-300 border-slate-500/30" },
  { id: "content-creation", label: "Content Creation", color: "bg-violet-500/20 text-violet-700 dark:text-violet-300 border-violet-500/30" },
  { id: "technical-setup", label: "Technical Setup", color: "bg-blue-500/20 text-blue-700 dark:text-blue-300 border-blue-500/30" },
  { id: "sales-page", label: "Sales Page", color: "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/30" },
  { id: "email-marketing", label: "Email Marketing", color: "bg-amber-500/20 text-amber-700 dark:text-amber-300 border-amber-500/30" },
  { id: "prelaunch-content", label: "Pre-Launch Content", color: "bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 border-cyan-500/30" },
  { id: "launch-prep", label: "Launch Prep", color: "bg-orange-500/20 text-orange-700 dark:text-orange-300 border-orange-500/30" },
  { id: "launch-execution", label: "Launch Execution", color: "bg-red-500/20 text-red-700 dark:text-red-300 border-red-500/30" },
  { id: "delivery", label: "Delivery", color: "bg-green-500/20 text-green-700 dark:text-green-300 border-green-500/30" },
  { id: "analysis", label: "Analysis", color: "bg-purple-500/20 text-purple-700 dark:text-purple-300 border-purple-500/30" },
];

export interface Subtask {
  id: string;
  task_id: string;
  user_id: string;
  title: string;
  completed: boolean;
  position: number;
  created_at: string;
  updated_at: string;
}

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
  phase: string | null;
  created_at: string;
  updated_at: string;
  subtask_count?: number;
}

interface TaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { title: string; description: string; due_date: Date | null; column_id: string; labels: string[]; phase: string | null }) => Promise<void>;
  editTask?: Task | null;
  trigger?: React.ReactNode;
  onSubtasksChange?: () => void;
}

export const TaskDialog = ({
  open,
  onOpenChange,
  onSubmit,
  editTask,
  trigger,
  onSubtasksChange,
}: TaskDialogProps) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [columnId, setColumnId] = useState("todo");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Subtasks state
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState("");

  const fetchSubtasks = useCallback(async () => {
    if (!editTask?.id) return;
    
    const { data, error } = await supabase
      .from("subtasks")
      .select("*")
      .eq("task_id", editTask.id)
      .order("position", { ascending: true });

    if (error) {
      console.error("Error fetching subtasks:", error);
    } else {
      setSubtasks(data || []);
    }
  }, [editTask?.id]);

  useEffect(() => {
    if (editTask) {
      setTitle(editTask.title);
      setDescription(editTask.description || "");
      setDueDate(editTask.due_date ? new Date(editTask.due_date) : undefined);
      setColumnId(editTask.column_id);
      setSelectedLabels(editTask.labels || []);
      setSelectedPhase(editTask.phase || null);
      fetchSubtasks();
    } else {
      setTitle("");
      setDescription("");
      setDueDate(undefined);
      setColumnId("todo");
      setSelectedLabels([]);
      setSelectedPhase(null);
      setSubtasks([]);
    }
  }, [editTask, open, fetchSubtasks]);

  const toggleLabel = (labelId: string) => {
    setSelectedLabels((prev) =>
      prev.includes(labelId)
        ? prev.filter((id) => id !== labelId)
        : [...prev, labelId]
    );
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim() || !editTask?.id || !user) return;

    const { error } = await supabase.from("subtasks").insert({
      task_id: editTask.id,
      user_id: user.id,
      title: newSubtaskTitle.trim(),
      position: subtasks.length,
    });

    if (error) {
      console.error("Error adding subtask:", error);
      toast.error("Failed to add subtask");
    } else {
      setNewSubtaskTitle("");
      fetchSubtasks();
      onSubtasksChange?.();
    }
  };

  const handleToggleSubtask = async (subtask: Subtask) => {
    const { error } = await supabase
      .from("subtasks")
      .update({ completed: !subtask.completed })
      .eq("id", subtask.id);

    if (error) {
      console.error("Error toggling subtask:", error);
      toast.error("Failed to update subtask");
    } else {
      fetchSubtasks();
    }
  };

  const handleUpdateSubtask = async (subtaskId: string) => {
    if (!editingSubtaskTitle.trim()) return;

    const { error } = await supabase
      .from("subtasks")
      .update({ title: editingSubtaskTitle.trim() })
      .eq("id", subtaskId);

    if (error) {
      console.error("Error updating subtask:", error);
      toast.error("Failed to update subtask");
    } else {
      setEditingSubtaskId(null);
      setEditingSubtaskTitle("");
      fetchSubtasks();
    }
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    const { error } = await supabase
      .from("subtasks")
      .delete()
      .eq("id", subtaskId);

    if (error) {
      console.error("Error deleting subtask:", error);
      toast.error("Failed to delete subtask");
    } else {
      fetchSubtasks();
      onSubtasksChange?.();
    }
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
        phase: selectedPhase,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting task:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const completedSubtasks = subtasks.filter(s => s.completed).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
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
              <Label htmlFor="phase">Phase</Label>
              <Select value={selectedPhase || "none"} onValueChange={(value) => setSelectedPhase(value === "none" ? null : value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a phase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No phase</SelectItem>
                  {TASK_PHASES.map((phase) => (
                    <SelectItem key={phase.id} value={phase.id}>
                      {phase.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              <Label htmlFor="status">Status</Label>
              <Select value={columnId} onValueChange={setColumnId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a status" />
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

            {/* Subtasks Section - Only show when editing */}
            {editTask && (
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <ListTodo className="w-4 h-4" />
                  Subtasks {subtasks.length > 0 && `(${completedSubtasks}/${subtasks.length})`}
                </Label>
                
                {/* Add subtask input */}
                <div className="flex gap-2">
                  <Input
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Add a subtask..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSubtask();
                      }
                    }}
                  />
                  <Button type="button" size="icon" variant="outline" onClick={handleAddSubtask}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>

                {/* Subtasks list */}
                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center gap-2 p-2 rounded-md bg-muted/50 group"
                    >
                      <Checkbox
                        checked={subtask.completed}
                        onCheckedChange={() => handleToggleSubtask(subtask)}
                      />
                      {editingSubtaskId === subtask.id ? (
                        <Input
                          value={editingSubtaskTitle}
                          onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                          onBlur={() => handleUpdateSubtask(subtask.id)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleUpdateSubtask(subtask.id);
                            } else if (e.key === "Escape") {
                              setEditingSubtaskId(null);
                            }
                          }}
                          autoFocus
                          className="h-7 text-sm"
                        />
                      ) : (
                        <span
                          className={cn(
                            "flex-1 text-sm cursor-pointer",
                            subtask.completed && "line-through text-muted-foreground"
                          )}
                          onClick={() => {
                            setEditingSubtaskId(subtask.id);
                            setEditingSubtaskTitle(subtask.title);
                          }}
                        >
                          {subtask.title}
                        </span>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => handleDeleteSubtask(subtask.id)}
                      >
                        <Trash2 className="w-3 h-3 text-destructive" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
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