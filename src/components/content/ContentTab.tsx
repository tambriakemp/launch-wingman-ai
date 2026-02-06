import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Calendar, CalendarRange, ChevronDown, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

import { SavedIdeasSheet } from "./SavedIdeasSheet";
import { PostEditorSheet, ContentPlannerItem } from "./PostEditorSheet";
import { ContentCalendarView } from "./ContentCalendarView";
import { ContentWeeklyView } from "./ContentWeeklyView";
import { GenerateLaunchContentModal } from "./GenerateLaunchContentModal";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { PlanPageHeader } from "@/components/PlanPageHeader";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import type { SavedItem } from "./SavedIdeasSection";

export type ContentType = "general" | "stories" | "offer" | "behind-the-scenes";

type CalendarViewMode = "weekly" | "monthly";

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
  const [calendarView, setCalendarView] = useState<CalendarViewMode>("weekly");
  const [postEditorOpen, setPostEditorOpen] = useState(false);
  const [savedSheetOpen, setSavedSheetOpen] = useState(false);
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const [selectedTalkingPoint, setSelectedTalkingPoint] = useState<TalkingPoint | null>(null);
  const [editingDraftId, setEditingDraftId] = useState<string | null>(null);
  const [editingPlannerItem, setEditingPlannerItem] = useState<ContentPlannerItem | null>(null);
  const [isCreatingNewPost, setIsCreatingNewPost] = useState(false);
  const [initialScheduledDate, setInitialScheduledDate] = useState<Date | null>(null);
  
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

  const currentPhase = project?.active_phase || "planning";
  const funnelType = project?.selected_funnel_type || null;

  if (!hasAccess('social_calendar')) {
    return (
      <div className="max-w-7xl mx-auto space-y-8 pb-12">
        <PlanPageHeader
          title="Social Planner"
          description="Ideas for what to say next, based on where you are in your project."
          tipText="These are starting points, not requirements. Use what feels right for you."
        />
        <UpgradePrompt feature="social_calendar" variant="card" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Section A: Orientation Header */}
      <PlanPageHeader
        title="Social Planner"
        description="View scheduled content on your calendar. Click any day to manage posts."
        tipText="These are starting points, not requirements. Use what feels right for you."
      />

      {/* Calendar Content */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* View Toggle */}
            <ToggleGroup 
              type="single" 
              value={calendarView} 
              onValueChange={(value) => value && setCalendarView(value as CalendarViewMode)}
              className="border border-border rounded-lg p-0.5"
            >
              <ToggleGroupItem value="weekly" aria-label="Weekly view" className="h-8 px-3 text-xs">
                <CalendarRange className="w-4 h-4 mr-1.5" />
                Weekly
              </ToggleGroupItem>
              <ToggleGroupItem value="monthly" aria-label="Monthly view" className="h-8 px-3 text-xs">
                <Calendar className="w-4 h-4 mr-1.5" />
                Monthly
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <Button
                onClick={() => setGenerateModalOpen(true)}
                variant="outline"
                size="sm"
                className="rounded-r-none border-r-0"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Launch Content
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-l-none px-2"
                  >
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={async () => {
                      try {
                        // Delete all generated launch content (posts in launch phases that aren't posted/completed)
                        const { error } = await supabase
                          .from("content_planner")
                          .delete()
                          .eq("project_id", projectId)
                          .in("phase", [
                            "pre-launch-week-1",
                            "pre-launch-week-2",
                            "pre-launch-week-3",
                            "pre-launch-week-4",
                            "launch",
                          ])
                          .not("status", "in", '("posted","completed")');
                        
                        if (error) throw error;
                        
                        queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
                        toast.success("All generated launch content deleted");
                      } catch (error) {
                        console.error("Error deleting content:", error);
                        toast.error("Failed to delete content");
                      }
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete All Generated Content
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button
              onClick={() => {
                setSelectedTalkingPoint(null);
                setEditingDraftId(null);
                setEditingPlannerItem(null);
                setIsCreatingNewPost(true);
                setPostEditorOpen(true);
              }}
              size="sm"
            >
              Create Post
            </Button>
          </div>
        </div>
        
        {calendarView === "weekly" ? (
          <ContentWeeklyView
            projectId={projectId}
            onCreatePost={() => {
              setSelectedTalkingPoint(null);
              setEditingDraftId(null);
              setEditingPlannerItem(null);
              setIsCreatingNewPost(true);
              setPostEditorOpen(true);
            }}
            onEditPost={(item) => {
              setSelectedTalkingPoint(null);
              setEditingDraftId(null);
              setEditingPlannerItem(item as ContentPlannerItem);
              setIsCreatingNewPost(false);
              setPostEditorOpen(true);
            }}
            onSchedulePost={(item) => {
              setSelectedTalkingPoint(null);
              setEditingDraftId(null);
              setEditingPlannerItem(item as ContentPlannerItem);
              setIsCreatingNewPost(false);
              setPostEditorOpen(true);
            }}
          />
        ) : (
          <ContentCalendarView
            projectId={projectId}
            onCreatePost={(date) => {
              setSelectedTalkingPoint(null);
              setEditingDraftId(null);
              setEditingPlannerItem(null);
              setIsCreatingNewPost(true);
              setInitialScheduledDate(date || null);
              setPostEditorOpen(true);
            }}
            onEditPost={(item) => {
              setSelectedTalkingPoint(null);
              setEditingDraftId(null);
              setEditingPlannerItem(item as ContentPlannerItem);
              setIsCreatingNewPost(false);
              setPostEditorOpen(true);
            }}
            onSchedulePost={(item) => {
              setSelectedTalkingPoint(null);
              setEditingDraftId(null);
              setEditingPlannerItem(item as ContentPlannerItem);
              setIsCreatingNewPost(false);
              setPostEditorOpen(true);
            }}
          />
        )}
      </div>

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
            setEditingPlannerItem(null);
            setIsCreatingNewPost(false);
            setInitialScheduledDate(null);
          }
        }}
        projectId={projectId}
        talkingPoint={selectedTalkingPoint}
        existingItem={editingPlannerItem}
        existingDraftId={editingDraftId}
        isCreateMode={isCreatingNewPost}
        initialScheduledDate={initialScheduledDate}
        currentPhase={currentPhase}
        funnelType={funnelType}
        audienceData={funnel}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
        }}
      />

      {/* Generate Launch Content Modal */}
      <GenerateLaunchContentModal
        open={generateModalOpen}
        onOpenChange={setGenerateModalOpen}
        projectId={projectId}
      />
    </div>
  );
};
