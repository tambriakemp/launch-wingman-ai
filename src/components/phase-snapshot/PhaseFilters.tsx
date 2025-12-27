import { cn } from "@/lib/utils";
import { Phase, PHASE_LABELS } from "@/types/tasks";

interface PhaseFiltersProps {
  selectedPhase: Phase;
  onPhaseChange: (phase: Phase) => void;
}

const FILTER_OPTIONS: { value: Phase; label: string; color: string }[] = [
  { value: "planning", label: PHASE_LABELS.planning, color: "data-[active=true]:bg-blue-500 data-[active=true]:text-white" },
  { value: "messaging", label: PHASE_LABELS.messaging, color: "data-[active=true]:bg-purple-500 data-[active=true]:text-white" },
  { value: "build", label: PHASE_LABELS.build, color: "data-[active=true]:bg-emerald-500 data-[active=true]:text-white" },
  { value: "content", label: PHASE_LABELS.content, color: "data-[active=true]:bg-amber-500 data-[active=true]:text-white" },
  { value: "launch", label: PHASE_LABELS.launch, color: "data-[active=true]:bg-rose-500 data-[active=true]:text-white" },
  { value: "post-launch", label: PHASE_LABELS["post-launch"], color: "data-[active=true]:bg-teal-500 data-[active=true]:text-white" },
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
            option.color
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
