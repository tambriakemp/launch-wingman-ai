import { cn } from "@/lib/utils";
import { Phase, PHASE_LABELS } from "@/types/tasks";

interface PhaseFiltersProps {
  selectedPhase: "all" | Phase;
  onPhaseChange: (phase: "all" | Phase) => void;
}

const FILTER_OPTIONS: { value: "all" | Phase; label: string }[] = [
  { value: "all", label: "All" },
  { value: "planning", label: PHASE_LABELS.planning },
  { value: "messaging", label: PHASE_LABELS.messaging },
  { value: "build", label: PHASE_LABELS.build },
  { value: "content", label: PHASE_LABELS.content },
  { value: "launch", label: PHASE_LABELS.launch },
  { value: "post-launch", label: PHASE_LABELS["post-launch"] },
];

export function PhaseFilters({ selectedPhase, onPhaseChange }: PhaseFiltersProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {FILTER_OPTIONS.map((option) => (
        <button
          key={option.value}
          onClick={() => onPhaseChange(option.value)}
          className={cn(
            "px-4 py-1.5 rounded-full text-sm font-medium transition-all",
            selectedPhase === option.value
              ? "bg-primary text-primary-foreground"
              : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
