import { useState } from "react";
import { Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { TASK_LABELS, TASK_PHASES } from "@/components/TaskDialog";

const COLUMNS = [
  { id: "todo", label: "To Do" },
  { id: "blocked", label: "Blocked/Waiting" },
  { id: "in-progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
];

interface FilterPopoverProps {
  selectedStatus: string;
  onStatusChange: (status: string) => void;
  selectedLabels: string[];
  onLabelsChange: (labels: string[]) => void;
  selectedPhase: string;
  onPhaseChange: (phase: string) => void;
  onClear: () => void;
}

export const FilterPopover = ({
  selectedStatus,
  onStatusChange,
  selectedLabels,
  onLabelsChange,
  selectedPhase,
  onPhaseChange,
  onClear,
}: FilterPopoverProps) => {
  const [open, setOpen] = useState(false);

  const activeFilterCount =
    (selectedStatus !== "all" ? 1 : 0) +
    selectedLabels.length +
    (selectedPhase !== "all" ? 1 : 0);

  const toggleLabel = (labelId: string) => {
    if (selectedLabels.includes(labelId)) {
      onLabelsChange(selectedLabels.filter((id) => id !== labelId));
    } else {
      onLabelsChange([...selectedLabels, labelId]);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2">
          <Filter className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge
              variant="secondary"
              className="h-5 px-1.5 bg-primary/10 text-primary"
            >
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 p-4 space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm">Filters</span>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={onClear}
            >
              Clear all
            </Button>
          )}
        </div>

        {/* Status Filter */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Status</Label>
          <Select value={selectedStatus} onValueChange={onStatusChange}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {COLUMNS.map((col) => (
                <SelectItem key={col.id} value={col.id}>
                  {col.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Phase Filter */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Phase</Label>
          <Select value={selectedPhase} onValueChange={onPhaseChange}>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="All phases" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All phases</SelectItem>
              {TASK_PHASES.map((phase) => (
                <SelectItem key={phase.id} value={phase.id}>
                  {phase.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Labels Filter */}
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Labels</Label>
          <div className="grid grid-cols-2 gap-2">
            {TASK_LABELS.map((label) => (
              <div key={label.id} className="flex items-center gap-2">
                <Checkbox
                  id={label.id}
                  checked={selectedLabels.includes(label.id)}
                  onCheckedChange={() => toggleLabel(label.id)}
                />
                <label
                  htmlFor={label.id}
                  className={cn(
                    "text-xs cursor-pointer px-1.5 py-0.5 rounded",
                    label.color
                  )}
                >
                  {label.label}
                </label>
              </div>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};
