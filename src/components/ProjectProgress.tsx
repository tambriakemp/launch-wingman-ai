import { Check, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface ProgressStep {
  id: string;
  label: string;
  completed: boolean;
}

interface ProjectProgressProps {
  steps: ProgressStep[];
}

export const ProjectProgress = ({ steps }: ProjectProgressProps) => {
  const completedCount = steps.filter((s) => s.completed).length;
  const progressPercent = (completedCount / steps.length) * 100;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Project Progress</span>
        <span className="font-medium text-foreground">
          {completedCount} of {steps.length} complete
        </span>
      </div>
      <Progress value={progressPercent} className="h-2" indicatorClassName="bg-primary" />
      <div className="flex flex-wrap gap-3">
        {steps.map((step) => (
          <div
            key={step.id}
            className={cn(
              "flex items-center gap-1.5 text-xs px-2 py-1 rounded-full transition-colors",
              step.completed
                ? "bg-success/10 text-success"
                : "bg-muted text-muted-foreground"
            )}
          >
            {step.completed ? (
              <Check className="w-3 h-3" />
            ) : (
              <Circle className="w-3 h-3" />
            )}
            <span>{step.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
