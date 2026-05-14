import { Button } from "@/components/ui/button";

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
        <p className="eyebrow">Reflection</p>
        <h2 className="font-serif text-2xl font-medium text-foreground tracking-tight leading-snug">
          {prompt}
        </h2>
      </div>

      {/* Paper-style textarea: borderless, larger, italic placeholder. */}
      <div className="rounded-2xl bg-[hsl(var(--paper-50))] border border-[hsl(var(--border-hairline))] focus-within:border-[hsl(var(--terracotta-500))] transition-colors">
        <textarea
          placeholder="Write whatever comes to mind…"
          value={response}
          onChange={(e) => onResponseChange(e.target.value)}
          className="w-full min-h-[160px] resize-none bg-transparent px-4 py-3.5 text-[16px] leading-relaxed text-foreground placeholder:italic placeholder:text-muted-foreground/70 focus:outline-none"
          style={{
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <button
          onClick={onSkip}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Skip
        </button>
        <Button onClick={onNext} size="lg">
          Continue
        </Button>
      </div>
    </div>
  );
}
