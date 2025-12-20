import { useState } from "react";
import { ChevronDown, ChevronUp, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface Example {
  good?: string;
  bad?: string;
  explanation?: string;
}

interface ExampleToggleProps {
  /** The examples to display */
  examples: Example;
  /** Label for the toggle button */
  label?: string;
  /** Additional className */
  className?: string;
}

export const ExampleToggle = ({
  examples,
  label = "See example",
  className,
}: ExampleToggleProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={cn("mt-2", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Lightbulb className="w-3.5 h-3.5" />
        <span>{label}</span>
        {isOpen ? (
          <ChevronUp className="w-3 h-3" />
        ) : (
          <ChevronDown className="w-3 h-3" />
        )}
      </button>
      
      {isOpen && (
        <div className="mt-2 p-3 rounded-lg bg-muted/50 border border-border text-sm space-y-2 animate-in fade-in-0 slide-in-from-top-1 duration-200">
          {examples.good && (
            <div className="flex gap-2">
              <span className="text-emerald-500 font-medium shrink-0">✓ Good:</span>
              <span className="text-foreground">{examples.good}</span>
            </div>
          )}
          {examples.bad && (
            <div className="flex gap-2">
              <span className="text-destructive font-medium shrink-0">✗ Weak:</span>
              <span className="text-muted-foreground">{examples.bad}</span>
            </div>
          )}
          {examples.explanation && (
            <p className="text-xs text-muted-foreground pt-1 border-t border-border/50">
              {examples.explanation}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

// Pre-defined examples for common fields
export const FIELD_EXAMPLES = {
  niche: {
    good: "Weight loss for busy working moms over 40",
    bad: "Health and fitness",
    explanation: "Specific niches help you speak directly to your ideal customer's unique situation.",
  },
  targetAudience: {
    good: "First-time entrepreneurs who are overwhelmed by marketing and struggling to get their first 10 customers",
    bad: "Business owners",
    explanation: "Include who they are, their current struggle, and what stage they're at.",
  },
  painPoint: {
    good: "Spending 3+ hours daily on social media with zero engagement or leads, feeling like they're shouting into the void",
    bad: "They need more customers",
    explanation: "Describe the emotional experience and specific symptoms, not just the surface problem.",
  },
  desiredOutcome: {
    good: "A consistent flow of 10+ qualified leads per week without spending all day on marketing",
    bad: "More sales",
    explanation: "Be specific about numbers, timeframes, and the feeling of achieving the goal.",
  },
  transformationStatement: {
    good: "Go from confused and scattered with no clear direction to confident with a complete marketing plan you can execute in just 2 hours per day",
    bad: "Learn marketing",
    explanation: "Show the before state, after state, and hint at the method or timeframe.",
  },
  offerTitle: {
    good: "The 90-Day Launch Accelerator",
    bad: "My Course",
    explanation: "Include a benefit, timeframe, or transformation in the name.",
  },
};
