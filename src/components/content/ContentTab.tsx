import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lightbulb, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ContentContextHeader } from "./ContentContextHeader";
import { ContentTypeFilter } from "./ContentTypeFilter";
import { TalkingPointsSection } from "./TalkingPointsSection";
import { SavedIdeasLink } from "./SavedIdeasLink";
import { SavedIdeasSheet } from "./SavedIdeasSheet";
import { DraftPanel } from "./DraftPanel";
import { TimelineSlotGrid } from "./TimelineSlotGrid";
import { PlanPageHeader } from "@/components/PlanPageHeader";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { SavedItem } from "./SavedIdeasSection";

export type ContentType = "general" | "stories" | "offer" | "behind-the-scenes";

type ContentViewTab = "ideas" | "my-timeline";

interface TalkingPoint {
  id: string;
  title: string;
  description: string;
  contentType: ContentType;
}

interface SlotInfo {
  phase: string;
  dayNumber: number;
}

interface ContentTabProps {
  projectId: string;
}

export const ContentTab = ({ projectId }: ContentTabProps) => {
  const [activeTab, setActiveTab] = useState<ContentViewTab>("ideas");
  const [selectedContentType, setSelectedContentType] = useState<ContentType>("general");
  const [draftPanelOpen, setDraftPanelOpen] = useState(false);
  const [savedSheetOpen, setSavedSheetOpen] = useState(false);
  const [selectedTalkingPoint, setSelectedTalkingPoint] = useState<TalkingPoint | null>(null);
  const [selectedSavedItem, setSelectedSavedItem] = useState<SavedItem | null>(null);
  const [pendingSlotInfo, setPendingSlotInfo] = useState<SlotInfo | null>(null);
  
  const { user } = useAuth();
  const queryClient = useQueryClient();

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
    setPendingSlotInfo(null);
    setDraftPanelOpen(true);
  };

  const handleOpenSavedItem = (item: SavedItem) => {
    setSelectedTalkingPoint(null);
    setSelectedSavedItem(item);
    setPendingSlotInfo(null);
    setDraftPanelOpen(true);
  };

  const handleTimelineWritePost = (item: {
    id: string;
    title: string;
    description: string | null;
    contentType: string;
  }) => {
    const asTalkingPoint: TalkingPoint = {
      id: item.id,
      title: item.title,
      description: item.description || "",
      contentType: item.contentType as ContentType,
    };
    setSelectedSavedItem(null);
    setSelectedTalkingPoint(asTalkingPoint);
    setPendingSlotInfo(null);
    setDraftPanelOpen(true);
  };

  const handleSlotAssign = (slotInfo: SlotInfo) => {
    setPendingSlotInfo(slotInfo);
  };

  const currentPhase = project?.active_phase || "planning";
  const funnelType = project?.selected_funnel_type || null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
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

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab("ideas")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
            activeTab === "ideas"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <Lightbulb className="w-4 h-4" />
          Ideas
        </button>
        <button
          onClick={() => setActiveTab("my-timeline")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
            activeTab === "my-timeline"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <CalendarDays className="w-4 h-4" />
          Launch Content Timeline
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "ideas" ? (
        <div className="space-y-12">
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
        </div>
      ) : (
        <TimelineSlotGrid
          projectId={projectId}
          onWritePost={handleTimelineWritePost}
        />
      )}

      {/* Saved Ideas Sheet */}
      <SavedIdeasSheet
        open={savedSheetOpen}
        onOpenChange={setSavedSheetOpen}
        projectId={projectId}
        onOpenItem={handleOpenSavedItem}
      />

      {/* Draft Panel with timeline assignment */}
      <DraftPanel
        open={draftPanelOpen}
        onOpenChange={setDraftPanelOpen}
        projectId={projectId}
        talkingPoint={selectedTalkingPoint}
        savedItem={selectedSavedItem}
        currentPhase={currentPhase}
        funnelType={funnelType}
        audienceData={funnel}
        slotInfo={pendingSlotInfo}
        onSlotAssign={handleSlotAssign}
      />
    </div>
  );
};