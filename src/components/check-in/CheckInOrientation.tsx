import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Compass, RotateCcw, RefreshCw, Sparkles, HelpCircle, Check } from "lucide-react";
import { OrientationChoice } from "@/hooks/useCheckIn";

interface CheckInOrientationProps {
  onSelect: (choice: OrientationChoice) => void;
  isSubmitting: boolean;
  hasPastProjects: boolean;
}

interface OrientationOption {
  value: OrientationChoice;
  label: string;
  description: string;
  icon: typeof Compass;
}

const EXPERIENCED_USER_OPTIONS: OrientationOption[] = [
  { value: "continue_current", label: "Continue with my current project", description: "Pick up where you left off", icon: Compass },
  { value: "revisit_past", label: "Revisit a past project", description: "Take another look at something finished", icon: RotateCcw },
  { value: "plan_relaunch", label: "Plan a relaunch", description: "Run a launch you've done before", icon: RefreshCw },
  { value: "start_new", label: "Start something new", description: "Open a fresh project", icon: Sparkles },
  { value: "not_sure", label: "I'm not sure yet", description: "Sit with it and decide later", icon: HelpCircle },
];

const NEW_USER_OPTIONS: OrientationOption[] = [
  { value: "continue_current", label: "Continue with my project", description: "Pick up where you left off", icon: Compass },
  { value: "start_new", label: "Start something new", description: "Open a fresh project", icon: Sparkles },
  { value: "not_sure", label: "I'm not sure yet", description: "Sit with it and decide later", icon: HelpCircle },
];

export function CheckInOrientation({ onSelect, isSubmitting, hasPastProjects }: CheckInOrientationProps) {
  const [selected, setSelected] = useState<OrientationChoice | null>(null);

  const options = hasPastProjects ? EXPERIENCED_USER_OPTIONS : NEW_USER_OPTIONS;

  const handleSubmit = () => {
    if (selected) {
      onSelect(selected);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <p className="eyebrow">Next step</p>
        <h2 className="font-serif text-2xl font-medium text-foreground tracking-tight">
          What feels like the right next step?
        </h2>
      </div>

      <div className="rounded-2xl bg-card border border-[hsl(var(--border-hairline))] overflow-hidden">
        {options.map((option, i) => {
          const Icon = option.icon;
          const isActive = selected === option.value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setSelected(option.value)}
              aria-pressed={isActive}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 text-left transition-colors active:bg-[hsl(var(--paper-100))]"
              style={{
                borderTop: i === 0 ? 0 : `0.5px solid hsl(var(--border-hairline))`,
                background: isActive ? "hsl(var(--paper-100))" : "transparent",
              }}
            >
              <div
                className="shrink-0 inline-flex items-center justify-center rounded-xl"
                style={{
                  width: 38,
                  height: 38,
                  background: isActive ? "hsl(var(--terracotta-500))" : "rgba(198,90,62,0.10)",
                  transition: "background 160ms ease-out",
                }}
              >
                <Icon
                  size={18}
                  strokeWidth={2}
                  color={isActive ? "white" : "hsl(var(--terracotta-500))"}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-foreground text-[15px] leading-snug tracking-tight">
                  {option.label}
                </div>
                <div className="text-[12.5px] text-muted-foreground mt-0.5 leading-snug">
                  {option.description}
                </div>
              </div>
              {isActive && (
                <Check
                  size={18}
                  strokeWidth={2.4}
                  className="shrink-0"
                  color="hsl(var(--terracotta-500))"
                />
              )}
            </button>
          );
        })}
      </div>

      <Button onClick={handleSubmit} disabled={!selected || isSubmitting} className="w-full" size="lg">
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
