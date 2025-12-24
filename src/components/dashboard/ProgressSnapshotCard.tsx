import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2 } from "lucide-react";

interface ProgressSnapshotCardProps {
  currentPhase: string;
  isPhaseComplete: boolean;
  reassuranceText: string;
}

export const ProgressSnapshotCard = ({
  currentPhase,
  isPhaseComplete,
  reassuranceText,
}: ProgressSnapshotCardProps) => {
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
            <span className="font-medium text-foreground">{currentPhase}</span>
          </div>

          {isPhaseComplete && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium text-green-600 dark:text-green-400 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4" />
                Complete
              </span>
            </div>
          )}

          <p className="text-sm text-muted-foreground italic pt-1">
            {reassuranceText}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
