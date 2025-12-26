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
    setSkippedIds(new Set());
    setRefreshKey(prev => prev + 1);
    setTimeout(() => setIsRefreshing(false), 300);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      {/* Collapsed card */}
      <div className="p-5 rounded-xl border border-border bg-card/50">
        <CollapsibleTrigger asChild>
          <button className="flex items-start gap-3 text-left w-full group">
            <div className="mt-0.5 shrink-0">
              {isOpen ? (
                <ChevronDown className="w-5 h-5 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-5 h-5 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-medium text-foreground group-hover:text-primary transition-colors">
                Launch Content Blueprint
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                A suggested content rhythm for launches like yours.
              </p>
            </div>
          </button>
        </CollapsibleTrigger>
        
        {/* View buttons when collapsed */}
        {!isOpen && (
          <div className="flex items-center gap-2 mt-4 pl-8">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setViewMode("outline");
                setIsOpen(true);
              }}
              className="text-sm"
            >
              <List className="w-4 h-4 mr-2" />
              View outline
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setViewMode("timeline");
                setIsOpen(true);
              }}
              className="text-sm text-muted-foreground"
            >
              <Calendar className="w-4 h-4 mr-2" />
              View timeline
            </Button>
          </div>
        )}

        {/* Expanded content */}
        <CollapsibleContent className="mt-6 space-y-5">
          {/* View toggle and refresh */}
          <div className="flex items-center justify-between pl-8">
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
              className="text-sm text-muted-foreground"
            >
              {isRefreshing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Reset view
            </Button>
          </div>

          {/* Content views */}
          <div key={refreshKey} className="pl-8">
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
              <div className="max-h-[500px] overflow-y-auto rounded-lg border border-border/50 bg-muted/20 p-4">
                <p className="text-xs text-muted-foreground mb-4 italic">
                  This is an optional advanced view showing a day-by-day rhythm.
                </p>
                <TimelineView
                  projectId={projectId}
                  funnelType={funnelType}
                  contentType={contentType}
                  onTurnIntoPost={onTurnIntoPost}
                  skippedIds={skippedIds}
                  onSkip={handleSkip}
                />
              </div>
            )}
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};
