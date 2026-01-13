import { useState } from "react";
import { X, Tag, Check } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LabelOption {
  id: string;
  name: string;
  color: string;
}

const DEFAULT_LABELS: LabelOption[] = [
  { id: "educational", name: "Educational", color: "bg-blue-500" },
  { id: "promotional", name: "Promotional", color: "bg-emerald-500" },
  { id: "engagement", name: "Engagement", color: "bg-purple-500" },
  { id: "testimonial", name: "Testimonial", color: "bg-amber-500" },
  { id: "behind-the-scenes", name: "Behind the Scenes", color: "bg-cyan-500" },
  { id: "announcement", name: "Announcement", color: "bg-rose-500" },
  { id: "tips", name: "Tips & Tricks", color: "bg-indigo-500" },
  { id: "story", name: "Story", color: "bg-orange-500" },
];

interface LabelsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedLabel: string | null;
  onLabelChange: (label: string | null) => void;
}

export function LabelsModal({
  open,
  onOpenChange,
  selectedLabel,
  onLabelChange,
}: LabelsModalProps) {
  const [localLabel, setLocalLabel] = useState<string | null>(selectedLabel);

  // Sync local state when modal opens
  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setLocalLabel(selectedLabel);
    }
    onOpenChange(isOpen);
  };

  const selectLabel = (labelId: string) => {
    // Toggle off if already selected, otherwise select
    setLocalLabel((prev) => (prev === labelId ? null : labelId));
  };

  const handleSave = () => {
    onLabelChange(localLabel);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Add labels
          </DialogTitle>
          <DialogDescription>
            Add labels to categorize and organize your content.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2 py-4">
          {DEFAULT_LABELS.map((label) => {
            const isSelected = localLabel === label.id;
            return (
              <button
                key={label.id}
                type="button"
                onClick={() => selectLabel(label.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border transition-colors text-left",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-muted-foreground/30"
                )}
              >
                <div className={cn("w-3 h-3 rounded-full", label.color)} />
                <span className="flex-1 text-sm">{label.name}</span>
                {isSelected && (
                  <Check className="w-4 h-4 text-primary" />
                )}
              </button>
            );
          })}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { DEFAULT_LABELS };
export type { LabelOption };
