import { cn } from "@/lib/utils";
import { Phase, PHASE_LABELS } from "@/types/tasks";

interface PhaseFiltersProps {
  selectedPhase: Phase | "all";
  onPhaseChange: (phase: Phase | "all") => void;
}

const FILTER_OPTIONS: { value: Phase | "all"; label: string }[] = [
  { value: "all", label: "All Phases" },
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
          data-active={selectedPhase === option.value}
          onClick={() => onPhaseChange(option.value)}
          className={cn(
            "px-4 py-2 rounded-full text-sm font-medium transition-all",
            "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
            "data-[active=true]:bg-primary data-[active=true]:text-primary-foreground"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
