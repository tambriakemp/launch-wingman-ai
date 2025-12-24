import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface ProgressSnapshotCardProps {
  stageLabel: string;
  currentStep: number;
  totalSteps: number;
  reassuranceText: string;
}

export const ProgressSnapshotCard = ({
  stageLabel,
  currentStep,
  totalSteps,
  reassuranceText,
}: ProgressSnapshotCardProps) => {
  const progressPercentage = Math.round((currentStep / totalSteps) * 100);

  return (
    <Card className="border bg-card">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs font-semibold uppercase tracking-wider">
            Your Progress
          </Badge>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Launch stage:</span>
            <span className="font-medium text-foreground">{stageLabel}</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progress:</span>
              <span className="font-medium text-foreground">
                Step {currentStep} of {totalSteps}
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <p className="text-sm text-muted-foreground italic pt-1">
            {reassuranceText}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
