import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { OrientationChoice } from "@/hooks/useCheckIn";

interface CheckInOrientationProps {
  onSelect: (choice: OrientationChoice) => void;
  isSubmitting: boolean;
  hasPastProjects: boolean;
}

// Options for users WITH past projects
const EXPERIENCED_USER_OPTIONS: { value: OrientationChoice; label: string }[] = [
  { value: "continue_current", label: "Continue with my current project" },
  { value: "revisit_past", label: "Revisit a past project" },
  { value: "plan_relaunch", label: "Plan a relaunch" },
  { value: "start_new", label: "Start something new" },
  { value: "not_sure", label: "I'm not sure yet" },
];

// Simplified options for NEW users (no past projects)
const NEW_USER_OPTIONS: { value: OrientationChoice; label: string }[] = [
  { value: "continue_current", label: "Continue with my project" },
  { value: "start_new", label: "Start something new" },
  { value: "not_sure", label: "I'm not sure yet" },
];

export function CheckInOrientation({ onSelect, isSubmitting, hasPastProjects }: CheckInOrientationProps) {
  const [selected, setSelected] = useState<OrientationChoice | null>(null);
  
  // Select appropriate options based on user context
  const options = hasPastProjects ? EXPERIENCED_USER_OPTIONS : NEW_USER_OPTIONS;

  const handleSubmit = () => {
    if (selected) {
      onSelect(selected);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          Next step
        </p>
        <h2 className="text-xl font-semibold text-foreground">
          What feels like the right next step?
        </h2>
      </div>
      
      <RadioGroup
        value={selected || ""}
        onValueChange={(value) => setSelected(value as OrientationChoice)}
        className="space-y-3"
      >
        {options.map((option) => (
          <div
            key={option.value}
            className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:border-border transition-colors cursor-pointer"
            onClick={() => setSelected(option.value)}
          >
            <RadioGroupItem value={option.value} id={option.value} />
            <Label
              htmlFor={option.value}
              className="flex-1 cursor-pointer font-normal"
            >
              {option.label}
            </Label>
          </div>
        ))}
      </RadioGroup>
      
      <Button
        onClick={handleSubmit}
        disabled={!selected || isSubmitting}
        className="w-full"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Saving...
          </>
        ) : (
          "Continue"
        )}
      </Button>
    </div>
  );
}
