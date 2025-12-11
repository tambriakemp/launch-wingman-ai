import { cn } from "@/lib/utils";
import { CheckCircle2 } from "lucide-react";

interface Step {
  key: string;
  title: string;
  icon?: React.ElementType;
}

interface AssessmentProgressStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick: (stepIndex: number) => void;
  completedSteps?: number[];
}

export const AssessmentProgressStepper = ({
  steps,
  currentStep,
  onStepClick,
  completedSteps = [],
}: AssessmentProgressStepperProps) => {
  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Step {currentStep + 1} of {steps.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300" 
            style={{ width: `${progress}%` }} 
          />
        </div>
      </div>

      {/* Clickable step indicators */}
      <div className="flex flex-wrap gap-2">
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(index) || index < currentStep;
          const isCurrent = index === currentStep;
          const Icon = step.icon;

          return (
            <button
              key={step.key}
              onClick={() => onStepClick(index)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                "border hover:scale-105",
                isCurrent
                  ? "bg-primary text-primary-foreground border-primary"
                  : isCompleted
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
              )}
            >
              {isCompleted && !isCurrent ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : Icon ? (
                <Icon className="w-3 h-3" />
              ) : (
                <span className="w-4 h-4 rounded-full bg-current/20 flex items-center justify-center text-[10px]">
                  {index + 1}
                </span>
              )}
              <span className="hidden sm:inline">{step.title}</span>
              <span className="sm:hidden">{index + 1}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
