import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CheckInReflectionProps {
  prompt: string;
  response: string;
  onResponseChange: (value: string) => void;
  onNext: () => void;
  onSkip: () => void;
}

export function CheckInReflection({
  prompt,
  response,
  onResponseChange,
  onNext,
  onSkip,
}: CheckInReflectionProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">
          Reflection
        </p>
        <h2 className="text-xl font-semibold text-foreground">
          {prompt}
        </h2>
      </div>
      
      <Textarea
        placeholder="Write whatever comes to mind..."
        value={response}
        onChange={(e) => onResponseChange(e.target.value)}
        className="min-h-[120px] resize-none"
      />
      
      <div className="flex items-center justify-between">
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip
        </button>
        <Button onClick={onNext}>
          Continue
        </Button>
      </div>
    </div>
  );
}
