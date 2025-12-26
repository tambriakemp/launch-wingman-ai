import { ContentIdeaCard } from "./ContentIdeaCard";
import { 
  getAllBlueprintIdeas,
  filterIdeasByContentType,
  filterIdeasByFunnelType,
  FORMAT_LABELS,
  type BlueprintIdea 
} from "@/data/blueprintContent";
import type { ContentType } from "@/components/content/ContentTab";
import { Badge } from "@/components/ui/badge";
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
  // Filter by funnel type first, then content type, then remove skipped
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
        // Morning before evening
        if (a.timeOfDay === "morning" && b.timeOfDay === "evening") return -1;
        if (a.timeOfDay === "evening" && b.timeOfDay === "morning") return 1;
        return 0;
      }),
    }));

  if (sortedDays.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">
          No timeline ideas for this content type. Try a different filter.
        </p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
      
      <div className="space-y-6">
        {sortedDays.map((day) => (
          <div key={day.dayHint} className="relative pl-10">
            {/* Timeline dot */}
            <div 
              className={cn(
                "absolute left-2.5 w-3 h-3 rounded-full border-2 border-background",
                day.dayHint < 0 ? "bg-muted-foreground/50" : 
                day.dayHint === 0 ? "bg-primary" : 
                "bg-accent"
              )}
              style={{ top: "0.5rem" }}
            />
            
            {/* Day header */}
            <div className="flex items-center gap-2 mb-3">
              <Badge 
                variant={day.dayHint === 0 ? "default" : "secondary"}
                className="text-xs"
              >
                {day.label}
              </Badge>
              {day.dayHint < 0 && (
                <span className="text-xs text-muted-foreground">Pre-launch</span>
              )}
              {day.dayHint > 0 && (
                <span className="text-xs text-muted-foreground">During launch</span>
              )}
            </div>
            
            {/* Ideas for this day */}
            <div className="grid gap-3">
              {day.ideas.map((idea) => (
                <div key={idea.id} className="relative">
                  {idea.timeOfDay && (
                    <span className="absolute -left-6 top-4 text-[10px] text-muted-foreground uppercase tracking-wider rotate-[-90deg] origin-left">
                      {idea.timeOfDay === "morning" ? "AM" : "PM"}
                    </span>
                  )}
                  <ContentIdeaCard
                    idea={idea}
                    projectId={projectId}
                    funnelType={funnelType}
                    onTurnIntoPost={onTurnIntoPost}
                    onSkip={onSkip}
                    formatLabels={FORMAT_LABELS}
                  />
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
