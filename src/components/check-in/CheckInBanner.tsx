import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCheckIn } from "@/hooks/useCheckIn";

interface CheckInBannerProps {
  onStartCheckIn: () => void;
}

export function CheckInBanner({ onStartCheckIn }: CheckInBannerProps) {
  const { shouldShowCheckIn, snoozeCheckIn } = useCheckIn();

  if (!shouldShowCheckIn) return null;

  const handleDismiss = async () => {
    await snoozeCheckIn(30);
  };

  return (
    <div className="relative bg-accent/50 border border-border/50 rounded-lg px-4 py-3 flex items-center justify-between gap-4">
      <p className="text-sm text-foreground">
        Want to do a quick check-in?
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onStartCheckIn}
          className="text-primary hover:text-primary"
        >
          Start check-in
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={handleDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
