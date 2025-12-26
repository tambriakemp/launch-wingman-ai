import { ContentIdeaCard } from "./ContentIdeaCard";
import { 
  BLUEPRINT_PHASES, 
  filterIdeasByContentType,
  FORMAT_LABELS,
  type BlueprintIdea 
} from "@/data/blueprintContent";
import type { ContentType } from "@/components/content/ContentTab";

interface OutlineViewProps {
  projectId: string;
  funnelType: string | null;
  contentType: ContentType;
  onTurnIntoPost: (idea: BlueprintIdea) => void;
  skippedIds: Set<string>;
  onSkip: (ideaId: string) => void;
}

export const OutlineView = ({
  projectId,
  funnelType,
  contentType,
  onTurnIntoPost,
  skippedIds,
  onSkip,
}: OutlineViewProps) => {
  return (
    <div className="space-y-8">
      {BLUEPRINT_PHASES.map((phase) => {
        // Filter ideas by content type and remove skipped
        const filteredIdeas = filterIdeasByContentType(phase.ideas, contentType)
          .filter(idea => !skippedIds.has(idea.id));

        if (filteredIdeas.length === 0) {
          return null;
        }

        return (
          <div key={phase.id} className="space-y-4">
            <div>
              <h3 className="text-base font-medium text-foreground">{phase.title}</h3>
              <p className="text-sm text-muted-foreground">{phase.subtitle}</p>
            </div>
            
            <div className="grid gap-3">
              {filteredIdeas.map((idea) => (
                <ContentIdeaCard
                  key={idea.id}
                  idea={idea}
                  projectId={projectId}
                  funnelType={funnelType}
                  onTurnIntoPost={onTurnIntoPost}
                  onSkip={onSkip}
                  formatLabels={FORMAT_LABELS}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
