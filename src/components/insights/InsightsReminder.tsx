import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TrendingUp, X } from "lucide-react";

interface InsightsReminderProps {
  lastUpdateDate: Date | null;
  onUpdateClick: () => void;
}

export function InsightsReminder({ lastUpdateDate, onUpdateClick }: InsightsReminderProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  // Check if it's been more than 30 days since last update
  const daysSinceUpdate = lastUpdateDate
    ? Math.floor((Date.now() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const shouldShow = !isDismissed && daysSinceUpdate !== null && daysSinceUpdate >= 30;

  if (!shouldShow) return null;

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
              <TrendingUp className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">
                It's been {daysSinceUpdate} days since your last update
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Capturing where you are now helps you see how far you've come.
              </p>
              <Button
                variant="link"
                size="sm"
                onClick={onUpdateClick}
                className="px-0 h-auto mt-1 text-primary"
              >
                Update your numbers →
              </Button>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 flex-shrink-0"
            onClick={() => setIsDismissed(true)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Dismiss</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
