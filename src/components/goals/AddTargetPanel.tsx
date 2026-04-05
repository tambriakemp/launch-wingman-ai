import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Target, X, Hash, DollarSign, ToggleLeft, ListChecks } from "lucide-react";

const TARGET_TYPES = [
  { id: "number", label: "Number", description: "Any number like 1 or 2", icon: Hash },
  { id: "true_false", label: "True/False", description: "Done or not done", icon: ToggleLeft },
  { id: "currency", label: "Currency", description: "Show me the money", icon: DollarSign },
  { id: "tasks", label: "Tasks", description: "Track completion of tasks", icon: ListChecks },
];

interface AddTargetPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (target: {
    name: string;
    target_type: string;
    unit: string;
    start_value: number;
    target_value: number;
  }) => Promise<void>;
}

export function AddTargetPanel({ open, onOpenChange, onSave }: AddTargetPanelProps) {
  const [name, setName] = useState("");
  const [targetType, setTargetType] = useState("number");
  const [unit, setUnit] = useState("");
  const [startValue, setStartValue] = useState("0");
  const [targetValue, setTargetValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setName("");
    setTargetType("number");
    setUnit("");
    setStartValue("0");
    setTargetValue("");
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    const isTF = targetType === "true_false";
    try {
      await onSave({
        name: name.trim(),
        target_type: targetType,
        unit: isTF ? "" : unit.trim(),
        start_value: isTF ? 0 : Number(startValue) || 0,
        target_value: isTF ? 1 : Number(targetValue) || 1,
      });
      resetForm();
      onOpenChange(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) resetForm(); onOpenChange(v); }}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col border-l border-border [&>button]:hidden">
        {/* Close button */}
        <div className="flex justify-end p-4 pb-0">
          <button
            type="button"
            onClick={() => { resetForm(); onOpenChange(false); }}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-8 pb-8 pt-2 space-y-14 flex-1 overflow-y-auto">
          {/* Target Name */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Target name</h3>
                <p className="text-sm text-muted-foreground">
                  Break your Goal down into pieces. Targets are measurable results that, when completed, will also complete the Goal.
                </p>
              </div>
            </div>
            <div>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter target name..."
                className="w-full h-11 border-0 border-b border-border bg-transparent px-0 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                maxLength={200}
              />
            </div>
          </div>

          {/* Type of Target */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Type of Target</h3>
                <p className="text-sm text-muted-foreground">
                  How do you want to measure this result?
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-muted-foreground mb-3">Choose type</p>
              <div className="grid grid-cols-4 gap-2">
                {TARGET_TYPES.map((t) => {
                  const Icon = t.icon;
                  const isSelected = targetType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTargetType(t.id)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-all ${
                        isSelected
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-xs font-medium">{t.label}</span>
                      <span className="text-[10px] text-muted-foreground leading-tight">{t.description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Start / Target values */}
            {targetType !== "true_false" && (
              <div className="pt-2">
                <div className="flex items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-muted-foreground">Start</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={startValue}
                        onChange={(e) => setStartValue(e.target.value)}
                        className="w-full h-10 border border-border rounded-lg bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setUnit(unit ? "" : "units")}
                        className="text-xs text-primary hover:underline whitespace-nowrap"
                      >
                        {unit ? `${unit}` : "+ Add unit"}
                      </button>
                    </div>
                  </div>
                  <span className="text-muted-foreground mt-5">→</span>
                  <div className="flex-1 space-y-1">
                    <p className="text-xs text-muted-foreground">Target</p>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={targetValue}
                        onChange={(e) => setTargetValue(e.target.value)}
                        placeholder="1"
                        className="w-full h-10 border border-border rounded-lg bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                      {unit && (
                        <span className="text-xs text-muted-foreground whitespace-nowrap">{unit}</span>
                      )}
                    </div>
                  </div>
                </div>
                {/* Unit input (shown when toggled) */}
                {unit && (
                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-1">Unit label</p>
                    <input
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="e.g. miles, dollars, items..."
                      className="w-full h-10 border border-border rounded-lg bg-transparent px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      maxLength={30}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <SheetFooter className="px-8 py-5 border-t border-border gap-3 mt-auto">
          <Button
            type="button"
            variant="ghost"
            onClick={() => { resetForm(); onOpenChange(false); }}
            className="text-muted-foreground"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !name.trim()}
          >
            {isSaving ? "Saving..." : "Save Target"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
