import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ContentContextHeader } from "./ContentContextHeader";
import { ContentTypeFilter } from "./ContentTypeFilter";
import { TalkingPointsSection } from "./TalkingPointsSection";
import { SavedIdeasLink } from "./SavedIdeasLink";
import { SavedIdeasSheet } from "./SavedIdeasSheet";
import { DraftPanel } from "./DraftPanel";
import { PlanPageHeader } from "@/components/PlanPageHeader";
import { BlueprintSection } from "./blueprint";
import type { BlueprintIdea } from "@/data/blueprintContent";
import type { SavedItem } from "./SavedIdeasSection";

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
  const [savedSheetOpen, setSavedSheetOpen] = useState(false);
  const [selectedTalkingPoint, setSelectedTalkingPoint] = useState<TalkingPoint | null>(null);
  const [selectedSavedItem, setSelectedSavedItem] = useState<SavedItem | null>(null);

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
    setSelectedSavedItem(null);
    setSelectedTalkingPoint(talkingPoint);
    setDraftPanelOpen(true);
  };

  const handleBlueprintTurnIntoPost = (idea: BlueprintIdea) => {
    const asTalkingPoint: TalkingPoint = {
      id: idea.id,
      title: idea.title,
      description: idea.whyItWorks,
      contentType: idea.contentType,
    };
    setSelectedSavedItem(null);
    setSelectedTalkingPoint(asTalkingPoint);
    setDraftPanelOpen(true);
  };

  const handleOpenSavedItem = (item: SavedItem) => {
    setSelectedTalkingPoint(null);
    setSelectedSavedItem(item);
    setDraftPanelOpen(true);
  };

  const currentPhase = project?.active_phase || "planning";
  const funnelType = project?.selected_funnel_type || null;

  return (
    <div className="max-w-3xl mx-auto space-y-12 pb-12">
      {/* Section A: Orientation Header */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <PlanPageHeader
            title="Content"
            description="Ideas for what to say next, based on where you are in your project."
            tipText="These are starting points, not requirements. Use what feels right for you."
          />
          
          {/* Saved ideas link - subtle, top right */}
          <div className="shrink-0 pt-1">
            <SavedIdeasLink 
              projectId={projectId} 
              onOpen={() => setSavedSheetOpen(true)} 
            />
          </div>
        </div>

        <ContentContextHeader 
          currentPhase={currentPhase} 
          funnelType={funnelType} 
        />
      </div>

      {/* Section B: What to Say Next (Primary Focus) */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-medium text-foreground">What to say next</h2>
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

      {/* Section C: Launch Content Blueprint (Collapsed by Default) */}
      <BlueprintSection
        projectId={projectId}
        funnelType={funnelType}
        contentType={selectedContentType}
        onTurnIntoPost={handleBlueprintTurnIntoPost}
      />

      {/* Saved Ideas Sheet */}
      <SavedIdeasSheet
        open={savedSheetOpen}
        onOpenChange={setSavedSheetOpen}
        projectId={projectId}
        onOpenItem={handleOpenSavedItem}
      />

      {/* Draft Panel */}
      <DraftPanel
        open={draftPanelOpen}
        onOpenChange={setDraftPanelOpen}
        projectId={projectId}
        talkingPoint={selectedTalkingPoint}
        savedItem={selectedSavedItem}
        currentPhase={currentPhase}
        funnelType={funnelType}
        audienceData={funnel}
      />
    </div>
  );
};
