import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Lightbulb, CalendarDays, FileText } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ContentContextHeader } from "./ContentContextHeader";
import { ContentTypeFilter } from "./ContentTypeFilter";
import { TalkingPointsSection } from "./TalkingPointsSection";
import { SavedIdeasLink } from "./SavedIdeasLink";
import { SavedIdeasSheet } from "./SavedIdeasSheet";
import { PostEditorSheet } from "./PostEditorSheet";
import { TimelineSlotGrid } from "./TimelineSlotGrid";
import { SalesPageCopyTab } from "./sales-copy";
import { PlanPageHeader } from "@/components/PlanPageHeader";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { SavedItem } from "./SavedIdeasSection";

export type ContentType = "general" | "stories" | "offer" | "behind-the-scenes";

type ContentViewTab = "ideas" | "my-timeline" | "sales-copy";

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
  const [postEditorOpen, setPostEditorOpen] = useState(false);
  const [savedSheetOpen, setSavedSheetOpen] = useState(false);
  const [selectedTalkingPoint, setSelectedTalkingPoint] = useState<TalkingPoint | null>(null);
  
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
    setSelectedTalkingPoint(talkingPoint);
    setPostEditorOpen(true);
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
    setSelectedTalkingPoint(asTalkingPoint);
    setPostEditorOpen(true);
  };

  const currentPhase = project?.active_phase || "planning";
  const funnelType = project?.selected_funnel_type || null;

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Section A: Orientation Header */}
      <div className="space-y-4">
        <PlanPageHeader
          title="Content"
          description="Ideas for what to say next, based on where you are in your project."
          tipText="These are starting points, not requirements. Use what feels right for you."
        />

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
        <button
          onClick={() => setActiveTab("sales-copy")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
            activeTab === "sales-copy"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <FileText className="w-4 h-4" />
          Sales Page Copy
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "ideas" ? (
        <div className="space-y-12">
          {/* Section B: What to Say Next (Primary Focus) */}
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-lg font-medium text-foreground">What to say next</h2>
              {/* Saved ideas link - top right of ideas section */}
              <SavedIdeasLink 
                projectId={projectId} 
                onOpen={() => setSavedSheetOpen(true)} 
              />
            </div>
            
            {/* Content type filter row */}
            <ContentTypeFilter 
              selected={selectedContentType} 
              onChange={setSelectedContentType} 
            />

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
      ) : activeTab === "my-timeline" ? (
        <TimelineSlotGrid
          projectId={projectId}
          onWritePost={handleTimelineWritePost}
        />
      ) : (
        <SalesPageCopyTab projectId={projectId} />
      )}

      {/* Saved Ideas Sheet */}
      <SavedIdeasSheet
        open={savedSheetOpen}
        onOpenChange={setSavedSheetOpen}
        projectId={projectId}
        onOpenItem={() => {}}
      />

      {/* Post Editor Sheet - unified for ideas and timeline */}
      <PostEditorSheet
        open={postEditorOpen}
        onOpenChange={setPostEditorOpen}
        projectId={projectId}
        talkingPoint={selectedTalkingPoint}
        currentPhase={currentPhase}
        funnelType={funnelType}
        audienceData={funnel}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
        }}
      />
    </div>
  );
};