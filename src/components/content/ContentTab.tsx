import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, FileText, List } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

import { SavedIdeasLink } from "./SavedIdeasLink";
import { SavedIdeasSheet } from "./SavedIdeasSheet";
import { PostEditorSheet } from "./PostEditorSheet";
import { TimelineSlotGrid } from "./TimelineSlotGrid";
import { ContentCalendarView } from "./ContentCalendarView";
import { SalesPageCopyTab } from "./sales-copy";
import { PlanPageHeader } from "@/components/PlanPageHeader";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import type { SavedItem } from "./SavedIdeasSection";

export type ContentType = "general" | "stories" | "offer" | "behind-the-scenes";

type ContentViewTab = "my-timeline" | "social-schedule" | "sales-copy";

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
  const [activeTab, setActiveTab] = useState<ContentViewTab>("my-timeline");
  const [postEditorOpen, setPostEditorOpen] = useState(false);
  const [savedSheetOpen, setSavedSheetOpen] = useState(false);
  const [selectedTalkingPoint, setSelectedTalkingPoint] = useState<TalkingPoint | null>(null);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  
  const { user } = useAuth();
  const { hasAccess } = useFeatureAccess();
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
      <PlanPageHeader
        title="Content"
        description="Ideas for what to say next, based on where you are in your project."
        tipText="These are starting points, not requirements. Use what feels right for you."
      />

      {/* Saved Ideas Link - accessible from all tabs */}
      <div className="flex justify-end">
        <SavedIdeasLink 
          projectId={projectId} 
          onOpen={() => setSavedSheetOpen(true)} 
        />
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-1 border-b border-border">
        <button
          onClick={() => setActiveTab("my-timeline")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
            activeTab === "my-timeline"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <List className="w-4 h-4" />
          Launch Content Timeline
        </button>
        <button
          onClick={() => setActiveTab("social-schedule")}
          className={cn(
            "flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px",
            activeTab === "social-schedule"
              ? "border-primary text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          )}
        >
          <CalendarDays className="w-4 h-4" />
          Social Media Schedule
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
      {activeTab === "my-timeline" ? (
        <TimelineSlotGrid
          projectId={projectId}
          onWritePost={handleTimelineWritePost}
        />
      ) : activeTab === "social-schedule" ? (
        hasAccess('social_calendar') ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-foreground">Social Media Schedule</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  View scheduled content on your calendar. Click any day to manage posts.
                </p>
              </div>
              <Button
                onClick={() => {
                  setSelectedTalkingPoint(null);
                  setPostEditorOpen(true);
                }}
                size="sm"
              >
                Create Post
              </Button>
            </div>
            <ContentCalendarView
              projectId={projectId}
              onCreatePost={() => {
                setSelectedTalkingPoint(null);
                setPostEditorOpen(true);
              }}
              onEditPost={(item) => {
                handleTimelineWritePost({
                  id: item.id,
                  title: item.title,
                  description: item.description,
                  contentType: item.content_type,
                });
              }}
              onSchedulePost={(item) => {
                handleTimelineWritePost({
                  id: item.id,
                  title: item.title,
                  description: item.description,
                  contentType: item.content_type,
                });
              }}
            />
          </div>
        ) : (
          <UpgradePrompt feature="social_calendar" variant="card" />
        )
      ) : (
        <SalesPageCopyTab projectId={projectId} />
      )}

      {/* Saved Ideas Sheet */}
      <SavedIdeasSheet
        open={savedSheetOpen}
        onOpenChange={setSavedSheetOpen}
        projectId={projectId}
        onOpenItem={(item) => {
          // Open the draft in the post editor
          setSelectedTalkingPoint({
            id: item.id,
            title: item.title,
            description: item.content,
            contentType: item.contentType as ContentType,
          });
          // If it's a draft, track the ID so we can update it
          setEditingDraftId(item.type === "draft" ? item.id : null);
          setPostEditorOpen(true);
        }}
      />

      {/* Post Editor Sheet - unified for ideas and timeline */}
      <PostEditorSheet
        open={postEditorOpen}
        onOpenChange={(open) => {
          setPostEditorOpen(open);
          if (!open) {
            setEditingDraftId(null);
          }
        }}
        projectId={projectId}
        talkingPoint={selectedTalkingPoint}
        existingDraftId={editingDraftId}
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