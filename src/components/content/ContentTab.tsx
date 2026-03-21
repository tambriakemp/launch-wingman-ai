import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Sparkles, Calendar, ChevronDown, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

import { SavedIdeasSheet } from "./SavedIdeasSheet";
import { PostEditorSheet, ContentPlannerItem } from "./PostEditorSheet";
import { ContentCalendarView } from "./ContentCalendarView";
import { ContentWeeklyView } from "./ContentWeeklyView";
import { GenerateLaunchContentModal } from "./GenerateLaunchContentModal";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { PlanPageHeader } from "@/components/PlanPageHeader";
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
  projectId: string | null;
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

  const openCreatePost = () => {
    setSelectedTalkingPoint(null);
    setEditingDraftId(null);
    setEditingPlannerItem(null);
    setIsCreatingNewPost(true);
    setPostEditorOpen(true);
  };

  const openEditPost = (item: ContentPlannerItem) => {
    setSelectedTalkingPoint(null);
    setEditingDraftId(null);
    setEditingPlannerItem(item);
    setIsCreatingNewPost(false);
    setPostEditorOpen(true);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.16))]">
      {/* Compact top bar with actions */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-background shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-teal-100/50 dark:bg-teal-900/20 rounded-xl shrink-0">
            <Calendar className="w-6 h-6 text-teal-600 dark:text-teal-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Social Planner</h1>
            <p className="text-sm text-muted-foreground hidden sm:block">Plan and schedule your social content.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center">
            <Button
              onClick={() => setGenerateModalOpen(true)}
              variant="outline"
              size="sm"
              className="rounded-r-none border-r-0 h-8"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Generate
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="rounded-l-none px-1.5 h-8">
                  <ChevronDown className="h-3.5 w-3.5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={async () => {
                    try {
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
          <Button onClick={openCreatePost} size="sm" className="h-8">
            Create Post
          </Button>
        </div>
      </div>

      {/* Calendar content - fills remaining space */}
      <div className="flex-1 overflow-hidden">
        {calendarView === "weekly" ? (
          <ContentWeeklyView
            projectId={projectId}
            onCreatePost={openCreatePost}
            onEditPost={openEditPost}
            onSchedulePost={openEditPost}
          />
        ) : (
          <div className="p-4 overflow-auto h-full">
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
              onEditPost={openEditPost}
              onSchedulePost={openEditPost}
            />
          </div>
        )}
      </div>

      {/* Sheets & modals */}
      <SavedIdeasSheet
        open={savedSheetOpen}
        onOpenChange={setSavedSheetOpen}
        projectId={projectId}
        onOpenItem={(item) => {
          setSelectedTalkingPoint({
            id: item.id,
            title: item.title,
            description: item.content,
            contentType: item.contentType as ContentType,
          });
          setEditingDraftId(item.type === "draft" ? item.id : null);
          setPostEditorOpen(true);
        }}
      />

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

      <GenerateLaunchContentModal
        open={generateModalOpen}
        onOpenChange={setGenerateModalOpen}
        projectId={projectId}
      />
    </div>
  );
};
