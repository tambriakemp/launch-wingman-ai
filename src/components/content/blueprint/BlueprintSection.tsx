import { useState } from "react";
import { ChevronDown, ChevronRight, List, Calendar, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { OutlineView } from "./OutlineView";
import { TimelineView } from "./TimelineView";
import type { ContentType } from "@/components/content/ContentTab";
import type { BlueprintIdea } from "@/data/blueprintContent";
import { cn } from "@/lib/utils";

type ViewMode = "outline" | "timeline";

interface BlueprintSectionProps {
  projectId: string;
  funnelType: string | null;
  contentType: ContentType;
  onTurnIntoPost: (idea: BlueprintIdea) => void;
}

export const BlueprintSection = ({
  projectId,
  funnelType,
  contentType,
  onTurnIntoPost,
}: BlueprintSectionProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("outline");
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleSkip = (ideaId: string) => {
    setSkippedIds(prev => new Set([...prev, ideaId]));
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Clear skipped ideas and increment key to force re-render
    setSkippedIds(new Set());
    setRefreshKey(prev => prev + 1);
    // Brief delay for visual feedback
    setTimeout(() => setIsRefreshing(false), 300);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="space-y-3">
      <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border bg-card/50">
        <CollapsibleTrigger asChild>
          <button className="flex items-start gap-3 text-left flex-1 group">
            <div className="mt-0.5">
              {isOpen ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <h3 className="text-base font-medium text-foreground group-hover:text-primary transition-colors">
                Launch Content Blueprint
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                A suggested content rhythm for launches like yours. This is optional guidance, not a checklist.
              </p>
            </div>
          </button>
        </CollapsibleTrigger>
        
        {!isOpen && (
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(true);
                setViewMode("outline");
              }}
              className="text-xs"
            >
              <List className="w-3.5 h-3.5 mr-1.5" />
              View outline
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsOpen(true);
                setViewMode("timeline");
              }}
              className="text-xs"
            >
              <Calendar className="w-3.5 h-3.5 mr-1.5" />
              View timeline
            </Button>
          </div>
        )}
      </div>

      <CollapsibleContent className="space-y-4">
        {/* View toggle and refresh */}
        <div className="flex items-center justify-between">
          <div className="inline-flex rounded-lg border border-border p-1 bg-muted/30">
            <button
              onClick={() => setViewMode("outline")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                viewMode === "outline" 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="w-4 h-4" />
              Outline
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-colors",
                viewMode === "timeline" 
                  ? "bg-background text-foreground shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Calendar className="w-4 h-4" />
              Timeline
            </button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="text-xs text-muted-foreground"
          >
            {isRefreshing ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
            )}
            Reset view
          </Button>
        </div>

        {/* Encouraging note */}
        <p className="text-sm text-muted-foreground italic">
          Use what helps. Skip what doesn't. This is a map, not a mandate.
        </p>

        {/* Content views */}
        <div key={refreshKey}>
          {viewMode === "outline" ? (
            <OutlineView
              projectId={projectId}
              funnelType={funnelType}
              contentType={contentType}
              onTurnIntoPost={onTurnIntoPost}
              skippedIds={skippedIds}
              onSkip={handleSkip}
            />
          ) : (
            <TimelineView
              projectId={projectId}
              funnelType={funnelType}
              contentType={contentType}
              onTurnIntoPost={onTurnIntoPost}
              skippedIds={skippedIds}
              onSkip={handleSkip}
            />
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
