import { useState } from "react";
import { Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { BlueprintIdea, FORMAT_LABELS } from "@/data/blueprintContent";

interface MinimalIdeaRowProps {
  idea: BlueprintIdea;
  onTurnIntoPost: (idea: BlueprintIdea) => void;
  formatLabels: typeof FORMAT_LABELS;
}

export const MinimalIdeaRow = ({
  idea,
  onTurnIntoPost,
  formatLabels,
}: MinimalIdeaRowProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Show max 2 format tags
  const visibleFormats = idea.formats.slice(0, 2);

  return (
    <div className="group">
      <div className="flex items-center gap-3 py-2.5 px-3 rounded-md hover:bg-muted/50 transition-colors">
        {/* Expand toggle */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="shrink-0 p-0.5 text-muted-foreground hover:text-foreground"
        >
          {isExpanded ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        
        {/* Title */}
        <span className="flex-1 text-sm text-foreground truncate">
          {idea.title}
        </span>
        
        {/* Format tags - hidden on mobile */}
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          {visibleFormats.map((format) => (
            <Badge 
              key={format} 
              variant="secondary" 
              className="text-xs font-normal py-0 h-5"
            >
              {formatLabels[format]}
            </Badge>
          ))}
        </div>
        
        {/* Action - visible on hover */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onTurnIntoPost(idea)}
          className="shrink-0 text-xs h-7 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1" />
          <span className="hidden sm:inline">Turn into a post</span>
          <span className="sm:hidden">Create</span>
        </Button>
      </div>
      
      {/* Expanded description */}
      {isExpanded && (
        <div className="pl-10 pr-3 pb-2">
          <p className="text-sm text-muted-foreground">
            {idea.whyItWorks}
          </p>
          {/* Show all format tags when expanded on mobile */}
          <div className="flex sm:hidden flex-wrap gap-1.5 mt-2">
            {idea.formats.map((format) => (
              <Badge 
                key={format} 
                variant="secondary" 
                className="text-xs font-normal py-0 h-5"
              >
                {formatLabels[format]}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
