import { Button } from "@/components/ui/button";

interface CheckInWelcomeProps {
  onStart: () => void;
  onSkip: () => void;
}

export function CheckInWelcome({ onStart, onSkip }: CheckInWelcomeProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          Quick check-in
        </h2>
        <p className="text-muted-foreground leading-relaxed">
          This isn't a review or a reset.
          <br />
          It's just a moment to notice where you are and decide what feels right next.
        </p>
      </div>
      
      <div className="flex flex-col gap-3">
        <Button onClick={onStart} className="w-full">
          Start check-in
        </Button>
        <Button variant="ghost" onClick={onSkip} className="text-muted-foreground">
          Skip for now
        </Button>
      </div>
    </div>
  );
}
