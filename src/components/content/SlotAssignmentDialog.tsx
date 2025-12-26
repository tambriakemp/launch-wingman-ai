import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BlueprintIdea } from "@/data/blueprintContent";

interface SlotInfo {
  phase: string;
  dayNumber: number;
}

interface SlotAssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  idea: BlueprintIdea | null;
  onConfirm: (slotInfo: SlotInfo) => void;
}

const PHASES = [
  { value: "pre-launch-week-1", label: "Pre-Launch: Week 1" },
  { value: "pre-launch-week-2", label: "Pre-Launch: Week 2" },
  { value: "pre-launch-week-3", label: "Pre-Launch: Week 3" },
  { value: "pre-launch-week-4", label: "Pre-Launch: Week 4" },
  { value: "launch", label: "Launch Week" },
];

const DAYS = [
  { value: 1, label: "Day 1" },
  { value: 2, label: "Day 2" },
  { value: 3, label: "Day 3" },
  { value: 4, label: "Day 4" },
  { value: 5, label: "Day 5" },
  { value: 6, label: "Day 6" },
  { value: 7, label: "Day 7" },
];

export const SlotAssignmentDialog = ({
  open,
  onOpenChange,
  idea,
  onConfirm,
}: SlotAssignmentDialogProps) => {
  const [phase, setPhase] = useState<string>("pre-launch-week-1");
  const [dayNumber, setDayNumber] = useState<number>(1);

  const handleConfirm = () => {
    onConfirm({ phase, dayNumber });
  };

  if (!idea) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5 text-primary" />
            Add to Timeline
          </DialogTitle>
          <DialogDescription>
            Choose when to post "{idea.title}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Phase/Week Selection */}
          <div className="space-y-2">
            <Label htmlFor="phase">Week</Label>
            <Select value={phase} onValueChange={setPhase}>
              <SelectTrigger id="phase">
                <SelectValue placeholder="Select a week" />
              </SelectTrigger>
              <SelectContent>
                {PHASES.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Day Selection */}
          <div className="space-y-2">
            <Label htmlFor="day">Day</Label>
            <Select 
              value={dayNumber.toString()} 
              onValueChange={(v) => setDayNumber(parseInt(v))}
            >
              <SelectTrigger id="day">
                <SelectValue placeholder="Select a day" />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((d) => (
                  <SelectItem key={d.value} value={d.value.toString()}>
                    {d.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>
            Add & Write Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};