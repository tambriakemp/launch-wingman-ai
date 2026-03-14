import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Goal, GoalMilestone } from "@/pages/Goals";

const CATEGORIES = [
  { id: "business", label: "Business" },
  { id: "personal", label: "Personal" },
  { id: "health", label: "Health" },
  { id: "finance", label: "Finance" },
  { id: "relationships", label: "Relationships" },
  { id: "mindset", label: "Mindset" },
];

const QUARTERS = [
  "Q1 2025", "Q2 2025", "Q3 2025", "Q4 2025",
  "Q1 2026", "Q2 2026", "Q3 2026", "Q4 2026",
];

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    data: Partial<Goal>,
    milestones: Partial<GoalMilestone>[]
  ) => Promise<void>;
  editGoal?: Goal | null;
  existingMilestones?: GoalMilestone[];
}

export function GoalDialog({
  open,
  onOpenChange,
  onSubmit,
  editGoal,
  existingMilestones = [],
}: GoalDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("business");
  const [whyStatement, setWhyStatement] = useState("");
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
  const [quarter, setQuarter] = useState("");
  const [milestones, setMilestones] = useState<
    { title: string; is_done: boolean; due_date?: string }[]
  >([]);
  const [newMilestone, setNewMilestone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuarter = `Q${Math.ceil((new Date().getMonth() + 1) / 3)} ${new Date().getFullYear()}`;

  useEffect(() => {
    if (editGoal) {
      setTitle(editGoal.title);
      setDescription(editGoal.description || "");
      setCategory(editGoal.category);
      setWhyStatement(editGoal.why_statement || "");
      setTargetDate(
        editGoal.target_date ? parseISO(editGoal.target_date) : undefined
      );
      setQuarter(editGoal.quarter || "");
      setMilestones(
        existingMilestones.map((m) => ({
          title: m.title,
          is_done: m.is_done,
          due_date: m.due_date || undefined,
        }))
      );
    } else {
      setTitle("");
      setDescription("");
      setCategory("business");
      setWhyStatement("");
      setTargetDate(undefined);
      setQuarter(currentQuarter);
      setMilestones([]);
    }
    setNewMilestone("");
  }, [editGoal, open]);

  const addMilestone = () => {
    if (!newMilestone.trim()) return;
    setMilestones((prev) => [
      ...prev,
      { title: newMilestone.trim(), is_done: false },
    ]);
    setNewMilestone("");
  };

  const removeMilestone = (idx: number) =>
    setMilestones((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(
        {
          title: title.trim(),
          description: description.trim() || null,
          category,
          why_statement: whyStatement.trim() || null,
          target_date: targetDate ? format(targetDate, "yyyy-MM-dd") : null,
          quarter: quarter || null,
        } as Partial<Goal>,
        milestones
      );
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle>
              {editGoal ? "Edit Goal" : "New Goal"}
            </DialogTitle>
          </DialogHeader>

          <div className="px-6 py-4 space-y-4">
            {/* Title */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Goal *
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What do you want to achieve?"
                className="h-10"
                maxLength={200}
              />
            </div>

            {/* Why statement */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Why does this matter?
              </Label>
              <Textarea
                value={whyStatement}
                onChange={(e) => setWhyStatement(e.target.value)}
                placeholder="The deeper reason behind this goal..."
                rows={2}
                className="resize-none text-sm"
                maxLength={400}
              />
            </div>

            {/* Category + Quarter row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Category
                </Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  Sprint / Quarter
                </Label>
                <Select value={quarter} onValueChange={setQuarter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select quarter" />
                  </SelectTrigger>
                  <SelectContent>
                    {QUARTERS.map((q) => (
                      <SelectItem key={q} value={q}>
                        {q}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Target date */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Target Date
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-10",
                      !targetDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {targetDate ? format(targetDate, "PPP") : "Pick a target date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={targetDate}
                    onSelect={setTargetDate}
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Milestones */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Milestones
              </Label>
              <div className="space-y-1.5">
                {milestones.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-2 group">
                    <div className="w-4 h-4 rounded border border-border flex-shrink-0" />
                    <span className="flex-1 text-sm text-foreground">
                      {m.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeMilestone(idx)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newMilestone}
                  onChange={(e) => setNewMilestone(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addMilestone();
                    }
                  }}
                  placeholder="Add a milestone..."
                  className="h-9 text-sm"
                  maxLength={200}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addMilestone}
                  className="h-9 px-3"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-border gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !title.trim()}>
              {isSubmitting
                ? "Saving..."
                : editGoal
                ? "Update Goal"
                : "Create Goal"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
