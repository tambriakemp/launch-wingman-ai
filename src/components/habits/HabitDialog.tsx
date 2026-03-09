import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Habit } from "@/pages/HabitTracker";

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

const HABIT_SUGGESTIONS = [
  "Exercise 30 mins", "Drink 8 glasses of water", "Read 20 minutes",
  "Journal", "Meditate", "Post on social media", "No social media",
  "Sleep by 10pm", "Take vitamins", "Gratitude list",
  "Work on side project", "Cold shower", "No sugar",
];

interface HabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: Partial<Habit>) => Promise<void>;
  editHabit?: Habit | null;
}

export function HabitDialog({ open, onOpenChange, onSubmit, editHabit }: HabitDialogProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("personal");
  const [color, setColor] = useState("#0ea572");
  const [frequency, setFrequency] = useState("daily");
  const [frequencyDays, setFrequencyDays] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editHabit) {
      setName(editHabit.name);
      setDescription(editHabit.description || "");
      setCategory(editHabit.category);
      setColor(editHabit.color);
      setFrequency(editHabit.frequency);
      setFrequencyDays(editHabit.frequency_days || []);
    } else {
      setName("");
      setDescription("");
      setCategory("personal");
      setColor("#0ea572");
      setFrequency("daily");
      setFrequencyDays([]);
    }
  }, [editHabit, open]);

  const toggleDay = (day: string) => {
    setFrequencyDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || null,
        category,
        color,
        frequency,
        frequency_days: frequency === "custom" ? frequencyDays : null,
        icon: "circle",
      } as any);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 gap-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="px-6 py-4 border-b border-border">
            <DialogTitle>{editHabit ? "Edit Habit" : "New Habit"}</DialogTitle>
          </DialogHeader>

          <div className="px-6 py-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Suggestions (new only) */}
            {!editHabit && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Quick pick</Label>
                <div className="flex flex-wrap gap-1.5">
                  {HABIT_SUGGESTIONS.slice(0, 8).map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setName(s)}
                      className={cn(
                        "text-xs px-2.5 py-1 rounded-full border transition-colors",
                        name === s
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary/50 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Habit name *</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Read 20 minutes" className="h-10" maxLength={100} />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Notes (optional)</Label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Why this habit matters to you..." rows={2} className="resize-none" maxLength={300} />
            </div>

            {/* Category + Frequency row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Frequency</Label>
                <Select value={frequency} onValueChange={setFrequency}>
                  <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Every day</SelectItem>
                    <SelectItem value="weekdays">Weekdays only</SelectItem>
                    <SelectItem value="weekends">Weekends only</SelectItem>
                    <SelectItem value="custom">Custom days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Custom day picker */}
            {frequency === "custom" && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Which days?</Label>
                <div className="flex gap-1.5">
                  {[["SU","S"],["MO","M"],["TU","T"],["WE","W"],["TH","T"],["FR","F"],["SA","S"]].map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => toggleDay(val)}
                      className={cn(
                        "w-8 h-8 rounded-full text-xs font-semibold border transition-colors flex-1",
                        frequencyDays.includes(val)
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

            {/* Color picker */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Color</Label>
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
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t border-border gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || !name.trim()}>
              {isSubmitting ? "Saving..." : editHabit ? "Update" : "Create Habit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
