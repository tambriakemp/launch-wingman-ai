import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useCheckIn, CheckInCadence } from "@/hooks/useCheckIn";
import { toast } from "sonner";

const CADENCE_OPTIONS: { value: CheckInCadence; label: string; description: string }[] = [
  { 
    value: "monthly", 
    label: "Monthly", 
    description: "A gentle check-in once a month" 
  },
  { 
    value: "quarterly", 
    label: "Quarterly", 
    description: "A check-in every three months" 
  },
];

export function CheckInSettings() {
  const { preferences, setCadence, snoozeCheckIn, isLoading } = useCheckIn();

  const handleCadenceChange = async (value: CheckInCadence) => {
    try {
      await setCadence(value);
      toast.success("Check-in frequency updated");
    } catch {
      toast.error("Failed to update settings");
    }
  };

  const handleSnoozeIndefinitely = async () => {
    try {
      // Snooze for 10 years (effectively indefinite)
      await snoozeCheckIn(3650);
      toast.success("Check-ins paused indefinitely");
    } catch {
      toast.error("Failed to pause check-ins");
    }
  };

  const currentCadence = preferences?.cadence || "monthly";

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">How often would you like to check in?</Label>
        <RadioGroup
          value={currentCadence}
          onValueChange={(value) => handleCadenceChange(value as CheckInCadence)}
          className="space-y-2"
          disabled={isLoading}
        >
          {CADENCE_OPTIONS.map((option) => (
            <div
              key={option.value}
              className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:border-border transition-colors cursor-pointer"
              onClick={() => !isLoading && handleCadenceChange(option.value)}
            >
              <RadioGroupItem value={option.value} id={`cadence-${option.value}`} />
              <div className="flex-1">
                <Label
                  htmlFor={`cadence-${option.value}`}
                  className="font-medium cursor-pointer"
                >
                  {option.label}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </div>
          ))}
        </RadioGroup>
      </div>

      <button
        onClick={handleSnoozeIndefinitely}
        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        disabled={isLoading}
      >
        Start without using check-ins
      </button>
    </div>
  );
}
