import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { MinimalIdeaRow } from "./MinimalIdeaRow";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  BLUEPRINT_PHASES, 
  filterIdeasByContentType,
  filterIdeasByFunnelType,
  FORMAT_LABELS,
  type BlueprintIdea 
} from "@/data/blueprintContent";
import type { ContentType } from "@/components/content/ContentTab";

interface OutlineViewProps {
  projectId: string;
  funnelType: string | null;
  contentType: ContentType;
  onTurnIntoPost: (idea: BlueprintIdea) => void;
  onAddToTimeline?: (idea: BlueprintIdea) => void;
  skippedIds: Set<string>;
  onSkip: (ideaId: string) => void;
}

const PHASE_INTROS: Record<string, string> = {
  "pre-launch-awareness": "Build curiosity and establish yourself as the go-to person.",
  "pre-launch-desire": "Help people see what's possible and start wanting in.",
  "launch": "Make the offer clear and help people decide calmly.",
};

export const OutlineView = ({
  projectId,
  funnelType,
  contentType,
  onTurnIntoPost,
  onAddToTimeline,
  skippedIds,
  onSkip,
}: OutlineViewProps) => {
  const [openPhases, setOpenPhases] = useState<Set<string>>(new Set());

  const togglePhase = (phaseId: string) => {
    setOpenPhases(prev => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-2">
      {BLUEPRINT_PHASES.map((phase) => {
        const filteredIdeas = filterIdeasByFunnelType(
          filterIdeasByContentType(phase.ideas, contentType),
          funnelType
        ).filter(idea => !skippedIds.has(idea.id));

        if (filteredIdeas.length === 0) {
          return null;
        }

        const isOpen = openPhases.has(phase.id);

        return (
          <Collapsible 
            key={phase.id} 
            open={isOpen} 
            onOpenChange={() => togglePhase(phase.id)}
          >
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 w-full py-3 px-2 rounded-md hover:bg-muted/50 transition-colors text-left group">
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {phase.title}
                </span>
                <span className="text-xs text-muted-foreground ml-auto">
                  {filteredIdeas.length} ideas
                </span>
              </button>
            </CollapsibleTrigger>
            
            <CollapsibleContent>
              <div className="pl-6 pb-2">
                {/* Phase intro */}
                {PHASE_INTROS[phase.id] && (
                  <p className="text-sm text-muted-foreground mb-3 italic">
                    {PHASE_INTROS[phase.id]}
                  </p>
                )}
                
                {/* Minimal idea rows */}
                <div className="space-y-0.5">
                {filteredIdeas.map((idea) => (
                    <MinimalIdeaRow
                      key={idea.id}
                      idea={idea}
                      onTurnIntoPost={onTurnIntoPost}
                      onAddToTimeline={onAddToTimeline}
                      formatLabels={FORMAT_LABELS}
                    />
                  ))}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}
    </div>
  );
};
