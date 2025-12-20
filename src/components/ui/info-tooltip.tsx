import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { MARKETING_GLOSSARY, GlossaryTerm } from "@/data/marketingGlossary";
import { cn } from "@/lib/utils";

interface InfoTooltipProps {
  /** The glossary key to look up, or provide custom content */
  termKey?: string;
  /** Custom term data if not using glossary */
  customTerm?: GlossaryTerm;
  /** Override just the definition text */
  definition?: string;
  /** Size of the info icon */
  size?: "sm" | "md";
  /** Additional className for the icon */
  className?: string;
}

export const InfoTooltip = ({
  termKey,
  customTerm,
  definition,
  size = "sm",
  className,
}: InfoTooltipProps) => {
  // Get term from glossary or use custom
  const term = termKey ? MARKETING_GLOSSARY[termKey] : customTerm;
  
  if (!term && !definition) return null;

  const displayDefinition = definition || term?.definition;
  const displayExample = term?.example;

  const iconSize = size === "sm" ? "w-3.5 h-3.5" : "w-4 h-4";

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex items-center justify-center rounded-full text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              className
            )}
            aria-label={term ? `Learn more about ${term.term}` : "More info"}
          >
            <Info className={iconSize} />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="top" 
          className="max-w-xs p-3 text-left"
          sideOffset={5}
        >
          {term?.term && (
            <p className="font-semibold text-foreground mb-1">{term.term}</p>
          )}
          <p className="text-sm text-popover-foreground">{displayDefinition}</p>
          {displayExample && (
            <p className="text-xs text-muted-foreground mt-2 italic">
              Example: {displayExample}
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

/** 
 * Inline text with an info tooltip - for adding tooltips to labels
 */
interface LabelWithTooltipProps {
  children: React.ReactNode;
  termKey?: string;
  definition?: string;
  className?: string;
}

export const LabelWithTooltip = ({
  children,
  termKey,
  definition,
  className,
}: LabelWithTooltipProps) => {
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      {children}
      <InfoTooltip termKey={termKey} definition={definition} />
    </span>
  );
};
