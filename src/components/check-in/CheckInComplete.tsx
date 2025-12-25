import { Button } from "@/components/ui/button";

interface CheckInCompleteProps {
  onClose: () => void;
}

export function CheckInComplete({ onClose }: CheckInCompleteProps) {
  return (
    <div className="p-6 space-y-6 text-center">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          That's okay
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          You can come back to this anytime.
        </p>
      </div>
      
      <Button onClick={onClose} variant="outline" className="w-full">
        Back to Dashboard
      </Button>
    </div>
  );
}
