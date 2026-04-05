import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, parseISO } from "date-fns";
import { CalendarIcon, Trophy, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AutoResizeTextarea } from "@/components/ui/auto-resize-textarea";
import type { Goal, GoalTarget } from "@/pages/Goals";

interface GoalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    data: Partial<Goal>,
    targets: Partial<GoalTarget>[]
  ) => Promise<void>;
  editGoal?: Goal | null;
  existingTargets?: GoalTarget[];
}

export function GoalDialog({
  open,
  onOpenChange,
  onSubmit,
  editGoal,
  existingTargets = [],
}: GoalDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [whyStatement, setWhyStatement] = useState("");
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editGoal) {
      setTitle(editGoal.title);
      setDescription(editGoal.description || "");
      setWhyStatement(editGoal.why_statement || "");
      setTargetDate(
        editGoal.target_date ? parseISO(editGoal.target_date) : undefined
      );
    } else {
      setTitle("");
      setDescription("");
      setWhyStatement("");
      setTargetDate(undefined);
    }
  }, [editGoal, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(
        {
          title: title.trim(),
          description: description.trim() || null,
          category: editGoal?.category || "business",
          why_statement: whyStatement.trim() || null,
          target_date: targetDate ? format(targetDate, "yyyy-MM-dd") : null,
        } as Partial<Goal>,
        existingTargets.map((t) => ({
          name: t.name,
          target_type: t.target_type,
          unit: t.unit || "",
          start_value: Number(t.start_value),
          target_value: Number(t.target_value),
          current_value: Number(t.current_value),
          is_done: t.is_done,
        }))
      );
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col border-l border-border">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          {/* Close button */}
          <div className="flex justify-end p-4 pb-0">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-8 pb-8 pt-2 space-y-14 flex-1 overflow-y-auto">
            {/* Goal Name */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Goal name</h3>
                  <p className="text-sm text-muted-foreground">
                    What do you want to achieve? Goals are high-level containers that can be broken down into smaller <span className="italic">Targets</span>.
                  </p>
                </div>
              </div>
              <div>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter goal name..."
                  className="w-full h-11 border-0 border-b border-border bg-transparent px-0 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                  maxLength={200}
                />
              </div>
            </div>

            {/* Target Date */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <CalendarIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Target date</h3>
                  <p className="text-sm text-muted-foreground">
                    This is optional. Set a deadline for when this goal should be completed.
                  </p>
                </div>
              </div>
              <div>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                    className="w-full justify-start text-left font-normal h-11 border-0 border-b border-border rounded-none px-0 hover:bg-transparent hover:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0 text-muted-foreground"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {targetDate
                        ? format(targetDate, "MMM d, yyyy")
                        : "Pick a date..."}
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
            </div>

            {/* Description */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h10" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Description</h3>
                  <p className="text-sm text-muted-foreground">
                    This is optional. Describe the goal and why it matters to you.
                  </p>
                </div>
              </div>
              <div>
                <AutoResizeTextarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  minRows={6}
                  className="border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 focus-visible:border-primary text-sm"
                  maxLength={1000}
                />
              </div>
            </div>
          </div>

          <SheetFooter className="px-8 py-5 border-t border-border gap-3 mt-auto">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="text-muted-foreground"
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
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
