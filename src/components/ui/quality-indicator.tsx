import { cn } from "@/lib/utils";

type QualityLevel = "empty" | "basic" | "good" | "strong";

interface QualityIndicatorProps {
  /** The text content to analyze */
  value: string;
  /** Minimum length for "basic" quality */
  minLength?: number;
  /** Minimum length for "good" quality */
  goodLength?: number;
  /** Minimum length for "strong" quality */
  strongLength?: number;
  /** Keywords that indicate higher quality */
  qualityKeywords?: string[];
  /** Show the text label */
  showLabel?: boolean;
  /** Additional className */
  className?: string;
}

const getQualityLevel = (
  value: string,
  minLength: number,
  goodLength: number,
  strongLength: number,
  qualityKeywords: string[]
): QualityLevel => {
  const trimmedValue = value.trim();
  
  if (!trimmedValue) return "empty";
  
  const length = trimmedValue.length;
  const hasKeywords = qualityKeywords.some(keyword => 
    trimmedValue.toLowerCase().includes(keyword.toLowerCase())
  );
  
  // Bonus for having quality keywords
  const effectiveLength = hasKeywords ? length * 1.3 : length;
  
  if (effectiveLength >= strongLength) return "strong";
  if (effectiveLength >= goodLength) return "good";
  if (length >= minLength) return "basic";
  return "empty";
};

const QUALITY_CONFIG: Record<QualityLevel, { label: string; color: string; bgColor: string }> = {
  empty: {
    label: "Empty",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
  basic: {
    label: "Basic",
    color: "text-amber-600 dark:text-amber-400",
    bgColor: "bg-amber-500",
  },
  good: {
    label: "Good",
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-500",
  },
  strong: {
    label: "Strong",
    color: "text-emerald-600 dark:text-emerald-400",
    bgColor: "bg-emerald-500",
  },
};

export const QualityIndicator = ({
  value,
  minLength = 10,
  goodLength = 50,
  strongLength = 100,
  qualityKeywords = [],
  showLabel = true,
  className,
}: QualityIndicatorProps) => {
  const quality = getQualityLevel(value, minLength, goodLength, strongLength, qualityKeywords);
  const config = QUALITY_CONFIG[quality];
  
  // Calculate progress for the bar (0-100)
  const progressWidth = quality === "empty" ? 0 
    : quality === "basic" ? 33 
    : quality === "good" ? 66 
    : 100;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Progress bar */}
      <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden max-w-20">
        <div 
          className={cn("h-full transition-all duration-300 rounded-full", config.bgColor)}
          style={{ width: `${progressWidth}%` }}
        />
      </div>
      
      {/* Label */}
      {showLabel && (
        <span className={cn("text-xs font-medium", config.color)}>
          {config.label}
        </span>
      )}
    </div>
  );
};

// Quality keywords for specific field types
export const QUALITY_KEYWORDS = {
  niche: ["for", "who", "over", "under", "first-time", "new", "experienced", "busy", "struggling"],
  audience: ["who", "struggling", "want", "need", "frustrated", "overwhelmed", "tired of"],
  painPoint: ["feeling", "frustrated", "overwhelmed", "confused", "stuck", "tired", "hours", "days", "weeks"],
  outcome: ["achieve", "become", "feel", "confident", "consistent", "without", "finally", "per week", "per month"],
  transformation: ["from", "to", "without", "in just", "finally", "become", "go from"],
};
