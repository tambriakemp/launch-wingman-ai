import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContentContextHeader } from "./ContentContextHeader";
import { ContentTypeFilter } from "./ContentTypeFilter";
import { TalkingPointsSection } from "./TalkingPointsSection";
import { SavedIdeasSection } from "./SavedIdeasSection";
import { DraftPanel } from "./DraftPanel";
import { PlanPageHeader } from "@/components/PlanPageHeader";

export type ContentType = "general" | "stories" | "offer" | "behind-the-scenes";

interface TalkingPoint {
  id: string;
  title: string;
  description: string;
  contentType: ContentType;
}

interface ContentTabProps {
  projectId: string;
}

export const ContentTab = ({ projectId }: ContentTabProps) => {
  const [selectedContentType, setSelectedContentType] = useState<ContentType>("general");
  const [draftPanelOpen, setDraftPanelOpen] = useState(false);
  const [selectedTalkingPoint, setSelectedTalkingPoint] = useState<TalkingPoint | null>(null);

  // Fetch project data for phase and funnel type
  const { data: project } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("active_phase, selected_funnel_type, name")
        .eq("id", projectId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch funnel data
  const { data: funnel } = useQuery({
    queryKey: ["funnel", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funnels")
        .select("target_audience, desired_outcome, primary_pain_point, niche")
        .eq("project_id", projectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const handleTurnIntoPost = (talkingPoint: TalkingPoint) => {
    setSelectedTalkingPoint(talkingPoint);
    setDraftPanelOpen(true);
  };

  const currentPhase = project?.active_phase || "planning";
  const funnelType = project?.selected_funnel_type || null;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <PlanPageHeader
        title="Content"
        description="Ideas for what to say next, based on where you are in your project."
        tipText="These are starting points, not requirements. Use what feels right for you."
      />

      <ContentContextHeader 
        currentPhase={currentPhase} 
        funnelType={funnelType} 
      />

      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-lg font-medium text-foreground">What to say next</h2>
              <p className="text-sm text-muted-foreground">
                Based on where you are in this project, here are a few directions you could talk about.
              </p>
            </div>
            <ContentTypeFilter 
              selected={selectedContentType} 
              onChange={setSelectedContentType} 
            />
          </div>

          <TalkingPointsSection
            projectId={projectId}
            contentType={selectedContentType}
            currentPhase={currentPhase}
            funnelType={funnelType}
            audienceData={funnel}
            onTurnIntoPost={handleTurnIntoPost}
          />
        </div>

        <SavedIdeasSection projectId={projectId} />
      </div>

      <DraftPanel
        open={draftPanelOpen}
        onOpenChange={setDraftPanelOpen}
        projectId={projectId}
        talkingPoint={selectedTalkingPoint}
        currentPhase={currentPhase}
        funnelType={funnelType}
        audienceData={funnel}
      />
    </div>
  );
};
