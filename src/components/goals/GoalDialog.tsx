import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
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
import type { Goal, GoalTarget } from "@/pages/Goals";

const CATEGORIES = [
  { id: "business", label: "Business" },
  { id: "personal", label: "Personal" },
  { id: "health", label: "Health" },
  { id: "finance", label: "Finance" },
  { id: "relationships", label: "Relationships" },
  { id: "mindset", label: "Mindset" },
];

const TARGET_TYPES = [
  { id: "number", label: "Number" },
  { id: "currency", label: "Currency" },
  { id: "true_false", label: "True / False" },
  { id: "tasks", label: "Tasks" },
];

interface TargetDraft {
  name: string;
  target_type: string;
  unit: string;
  start_value: number;
  target_value: number;
  current_value: number;
  is_done: boolean;
}

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
  const [category, setCategory] = useState("business");
  const [whyStatement, setWhyStatement] = useState("");
  const [targetDate, setTargetDate] = useState<Date | undefined>(undefined);
  const [targets, setTargets] = useState<TargetDraft[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New target form
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("number");
  const [newUnit, setNewUnit] = useState("");
  const [newStartValue, setNewStartValue] = useState("0");
  const [newTargetValue, setNewTargetValue] = useState("");

  useEffect(() => {
    if (editGoal) {
      setTitle(editGoal.title);
      setDescription(editGoal.description || "");
      setCategory(editGoal.category);
      setWhyStatement(editGoal.why_statement || "");
      setTargetDate(
        editGoal.target_date ? parseISO(editGoal.target_date) : undefined
      );
      setTargets(
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
    } else {
      setTitle("");
      setDescription("");
      setCategory("business");
      setWhyStatement("");
      setTargetDate(undefined);
      setTargets([]);
    }
    resetNewTarget();
  }, [editGoal, open]);

  const resetNewTarget = () => {
    setNewName("");
    setNewType("number");
    setNewUnit("");
    setNewStartValue("0");
    setNewTargetValue("");
  };

  const addTarget = () => {
    if (!newName.trim()) return;
    const isTrueFalse = newType === "true_false";
    setTargets((prev) => [
      ...prev,
      {
        name: newName.trim(),
        target_type: newType,
        unit: isTrueFalse ? "" : newUnit.trim(),
        start_value: isTrueFalse ? 0 : Number(newStartValue) || 0,
        target_value: isTrueFalse ? 1 : Number(newTargetValue) || 1,
        current_value: isTrueFalse ? 0 : Number(newStartValue) || 0,
        is_done: false,
      },
    ]);
    resetNewTarget();
  };

  const removeTarget = (idx: number) =>
    setTargets((prev) => prev.filter((_, i) => i !== idx));

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
        } as Partial<Goal>,
        targets
      );
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const typeLabel = (type: string) =>
    TARGET_TYPES.find((t) => t.id === type)?.label || type;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle>
              {editGoal ? "Edit Goal" : "New Goal"}
            </SheetTitle>
          </SheetHeader>

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

            {/* Category + Target date */}
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
                      {targetDate
                        ? format(targetDate, "MMM d, yyyy")
                        : "Pick date"}
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

            {/* Targets */}
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground">
                Targets
              </Label>

              {/* Existing targets */}
              {targets.length > 0 && (
                <div className="space-y-1.5">
                  {targets.map((t, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 group rounded-lg border border-border px-3 py-2"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {t.name}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {typeLabel(t.target_type)}
                          {t.target_type === "true_false"
                            ? ""
                            : ` · ${t.start_value} → ${t.target_value}`}
                          {t.unit ? ` ${t.unit}` : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeTarget(idx)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add target form */}
              <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Target name..."
                    className="h-9 text-sm"
                    maxLength={200}
                  />
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger className="h-9 text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TARGET_TYPES.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {newType !== "true_false" && (
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      type="number"
                      value={newStartValue}
                      onChange={(e) => setNewStartValue(e.target.value)}
                      placeholder="Start"
                      className="h-9 text-sm"
                    />
                    <Input
                      type="number"
                      value={newTargetValue}
                      onChange={(e) => setNewTargetValue(e.target.value)}
                      placeholder="Target"
                      className="h-9 text-sm"
                    />
                    <Input
                      value={newUnit}
                      onChange={(e) => setNewUnit(e.target.value)}
                      placeholder="Unit (opt)"
                      className="h-9 text-sm"
                      maxLength={30}
                    />
                  </div>
                )}

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTarget}
                  disabled={!newName.trim()}
                  className="h-8 gap-1.5 text-xs"
                >
                  <Plus className="w-3 h-3" /> Add Target
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
