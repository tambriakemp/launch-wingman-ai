interface AssessmentProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabel?: string;
}

export const AssessmentProgressBar = ({
  currentStep,
  totalSteps,
  stepLabel,
}: AssessmentProgressBarProps) => {
  const progress = ((currentStep + 1) / totalSteps) * 100;

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm text-muted-foreground">
        <span>{stepLabel || `Step ${currentStep + 1} of ${totalSteps}`}</span>
        <span>{Math.round(progress)}% complete</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary transition-all duration-300" 
          style={{ width: `${progress}%` }} 
        />
      </div>
    </div>
  );
};
