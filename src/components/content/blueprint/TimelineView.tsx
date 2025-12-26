import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  getAllBlueprintIdeas,
  filterIdeasByContentType,
  filterIdeasByFunnelType,
  FORMAT_LABELS,
  type BlueprintIdea 
} from "@/data/blueprintContent";
import type { ContentType } from "@/components/content/ContentTab";
import { cn } from "@/lib/utils";

interface TimelineViewProps {
  projectId: string;
  funnelType: string | null;
  contentType: ContentType;
  onTurnIntoPost: (idea: BlueprintIdea) => void;
  skippedIds: Set<string>;
  onSkip: (ideaId: string) => void;
}

interface TimelineDay {
  dayHint: number;
  label: string;
  ideas: BlueprintIdea[];
}

export const TimelineView = ({
  projectId,
  funnelType,
  contentType,
  onTurnIntoPost,
  skippedIds,
  onSkip,
}: TimelineViewProps) => {
  const allIdeas = getAllBlueprintIdeas();
  const filteredIdeas = filterIdeasByFunnelType(
    filterIdeasByContentType(allIdeas, contentType),
    funnelType
  ).filter(idea => !skippedIds.has(idea.id));

  // Group ideas by day
  const dayMap = new Map<number, BlueprintIdea[]>();
  
  filteredIdeas.forEach(idea => {
    const day = idea.dayHint ?? 0;
    const existing = dayMap.get(day) || [];
    dayMap.set(day, [...existing, idea]);
  });

  // Sort days chronologically
  const sortedDays = Array.from(dayMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([dayHint, ideas]): TimelineDay => ({
      dayHint,
      label: getDayLabel(dayHint),
      ideas: ideas.sort((a, b) => {
        if (a.timeOfDay === "morning" && b.timeOfDay === "evening") return -1;
        if (a.timeOfDay === "evening" && b.timeOfDay === "morning") return 1;
        return 0;
      }),
    }));

  if (sortedDays.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          No timeline ideas for this content type.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line - muted */}
      <div className="absolute left-3 top-0 bottom-0 w-px bg-border/50" />
      
      <div className="space-y-5">
        {sortedDays.map((day) => (
          <div key={day.dayHint} className="relative pl-8">
            {/* Timeline dot - smaller, muted */}
            <div 
              className={cn(
                "absolute left-1.5 w-3 h-3 rounded-full border-2 border-background",
                day.dayHint < 0 ? "bg-muted-foreground/30" : 
                day.dayHint === 0 ? "bg-primary/70" : 
                "bg-muted-foreground/40"
              )}
              style={{ top: "0.25rem" }}
            />
            
            {/* Day header - smaller */}
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-medium text-muted-foreground">
                {day.label}
              </span>
            </div>
            
            {/* Compact idea cards */}
            <div className="space-y-2">
              {day.ideas.map((idea) => (
                <div 
                  key={idea.id} 
                  className="group p-3 rounded-lg border border-border/50 bg-card/50 hover:bg-card transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground/90 mb-1 truncate">
                        {idea.title}
                      </h4>
                      <div className="flex flex-wrap gap-1">
                        {idea.formats.slice(0, 2).map((format) => (
                          <Badge 
                            key={format} 
                            variant="secondary" 
                            className="text-[10px] font-normal py-0 h-4 bg-muted/50"
                          >
                            {FORMAT_LABELS[format]}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onTurnIntoPost(idea)}
                      className="shrink-0 h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Sparkles className="w-3 h-3 mr-1" />
                      Create
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

function getDayLabel(dayHint: number): string {
  if (dayHint === 0) return "Launch Day";
  if (dayHint < 0) {
    const weeksOut = Math.ceil(Math.abs(dayHint) / 7);
    if (weeksOut === 1) return "Week before";
    if (weeksOut === 2) return "2 weeks before";
    if (weeksOut === 3) return "3 weeks before";
    return `${weeksOut} weeks before`;
  }
  if (dayHint === 1) return "Day 1";
  if (dayHint === 2) return "Day 2";
  if (dayHint === 3) return "Day 3";
  return `Day ${dayHint}`;
}
