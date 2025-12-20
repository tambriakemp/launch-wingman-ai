import { Clock, Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";

interface PlanPageHeaderProps {
  title: string;
  description: string;
  /** Why this step matters - helps beginners understand the purpose */
  whyItMatters?: string;
  /** Estimated time to complete this section */
  estimatedTime?: string;
  /** Quick tip for this section */
  tipText?: string;
  /** Additional className */
  className?: string;
}

export const PlanPageHeader = ({ 
  title, 
  description,
  whyItMatters,
  estimatedTime,
  tipText,
  className,
}: PlanPageHeaderProps) => {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Main header */}
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          {estimatedTime && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              <Clock className="w-3 h-3" />
              {estimatedTime}
            </span>
          )}
        </div>
        <p className="text-muted-foreground">{description}</p>
      </div>

      {/* Why it matters section */}
      {whyItMatters && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm">
          <p className="text-foreground">
            <span className="font-medium text-primary">Why this matters: </span>
            {whyItMatters}
          </p>
        </div>
      )}

      {/* Quick tip */}
      {tipText && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Lightbulb className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
          <p>{tipText}</p>
        </div>
      )}
    </div>
  );
};
