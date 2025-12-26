import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { PlatformSelector } from "../content-planner/PlatformSelector";
import { MediaUploader } from "../content-planner/MediaUploader";
import { SocialPostPreview } from "../content-planner/SocialPostPreview";
import { PinterestBoardSelector } from "../content-planner/PinterestBoardSelector";
import { ScheduleDateTimePicker } from "../content-planner/ScheduleDateTimePicker";

interface SchedulePostSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  contentItem: {
    id: string;
    title: string;
    content: string | null;
    description: string | null;
  } | null;
  onScheduled?: () => void;
}

export function SchedulePostSheet({
  open,
  onOpenChange,
  projectId,
  contentItem,
  onScheduled,
}: SchedulePostSheetProps) {
  const { user } = useAuth();
  const [isPosting, setIsPosting] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleMode, setScheduleMode] = useState<"now" | "schedule">("now");
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    media_url: null as string | null,
    media_type: null as string | null,
    scheduled_platforms: [] as string[],
    pinterest_board_id: null as string | null,
    link_url: "",
  });

  // Reset form when content item changes
  useEffect(() => {
    if (contentItem) {
      setFormData({
        title: contentItem.title || "",
        content: contentItem.content || contentItem.description || "",
        media_url: null,
        media_type: null,
        scheduled_platforms: [],
        pinterest_board_id: null,
        link_url: "",
      });
      setScheduleMode("now");
      setScheduledDate(null);
    }
  }, [contentItem]);

  // Check if Pinterest is connected
  const { data: pinterestConnection } = useQuery({
    queryKey: ["pinterest-connection", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_connections")
        .select("id, account_name")
        .eq("user_id", user!.id)
        .eq("platform", "pinterest")
        .single();

      if (error) return null;
      return data;
    },
    enabled: !!user,
  });

  const handlePostNow = async () => {
    if (!formData.scheduled_platforms.includes("pinterest")) {
      toast.error("Please select Pinterest to post");
      return;
    }

    if (!formData.pinterest_board_id) {
      toast.error("Please select a Pinterest board");
      return;
    }

    if (!formData.media_url) {
      toast.error("Pinterest requires an image");
      return;
    }

    setIsPosting(true);
    try {
      const response = await supabase.functions.invoke("post-to-pinterest", {
        body: {
          title: formData.title,
          description: formData.content,
          imageUrl: formData.media_url,
          boardId: formData.pinterest_board_id,
          link: formData.link_url || undefined,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to post to Pinterest");
      }

      // Update the content_planner item with scheduled info
      if (contentItem?.id) {
        await supabase
          .from("content_planner")
          .update({
            scheduled_platforms: formData.scheduled_platforms,
            scheduled_at: new Date().toISOString(),
            status: "completed",
          })
          .eq("id", contentItem.id);
      }

      toast.success("Posted to Pinterest successfully!");
      onScheduled?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error posting to Pinterest:", error);
      toast.error(error.message || "Failed to post to Pinterest");
    } finally {
      setIsPosting(false);
    }
  };

  const handleSchedule = async () => {
    if (!scheduledDate) {
      toast.error("Please select a date to schedule");
      return;
    }

    if (!formData.scheduled_platforms.length) {
      toast.error("Please select at least one platform");
      return;
    }

    setIsScheduling(true);
    try {
      const [hours, minutes] = scheduledTime.split(":").map(Number);
      const scheduleDateTime = new Date(scheduledDate);
      scheduleDateTime.setHours(hours, minutes, 0, 0);

      // Save to scheduled_posts table
      const { error } = await supabase.from("scheduled_posts").insert({
        user_id: user!.id,
        project_id: projectId,
        content_item_id: contentItem?.id,
        platform: formData.scheduled_platforms[0],
        scheduled_for: scheduleDateTime.toISOString(),
        post_data: {
          title: formData.title,
          description: formData.content,
          imageUrl: formData.media_url,
          boardId: formData.pinterest_board_id,
          link: formData.link_url,
        },
        status: "pending",
      });

      if (error) throw error;

      // Update the content_planner item
      if (contentItem?.id) {
        await supabase
          .from("content_planner")
          .update({
            scheduled_platforms: formData.scheduled_platforms,
            scheduled_at: scheduleDateTime.toISOString(),
          })
          .eq("id", contentItem.id);
      }

      toast.success("Post scheduled successfully!");
      onScheduled?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error scheduling post:", error);
      toast.error(error.message || "Failed to schedule post");
    } finally {
      setIsScheduling(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[50vw] min-w-[700px] p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <SheetTitle>Schedule Social Post</SheetTitle>
          <SheetDescription>
            Schedule this content to your social media platforms.
          </SheetDescription>
        </SheetHeader>

        {/* Two Column Layout */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Column - Scrollable Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6">
            {/* Social Post Section */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span>✨</span>
                <span>Social Post</span>
              </div>

              {/* Platform Selector */}
              <div className="space-y-2">
                <Label className="text-xs">Post To</Label>
                <PlatformSelector
                  selected={formData.scheduled_platforms}
                  onChange={(platforms) => {
                    setFormData((prev) => ({
                      ...prev,
                      scheduled_platforms: platforms,
                    }));
                  }}
                />
              </div>

              {/* Pinterest Board Selector */}
              {formData.scheduled_platforms.includes("pinterest") && pinterestConnection && (
                <PinterestBoardSelector
                  selectedBoard={formData.pinterest_board_id}
                  onBoardChange={(boardId) =>
                    setFormData((prev) => ({ ...prev, pinterest_board_id: boardId }))
                  }
                />
              )}

              {/* Title */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Title</Label>
                  <span className="text-xs text-muted-foreground">
                    {formData.title.length}/100
                  </span>
                </div>
                <Input
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  maxLength={100}
                  placeholder="Enter post title..."
                />
              </div>

              {/* Content */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Content / Copy</Label>
                  <span className="text-xs text-muted-foreground">
                    {formData.content.length}/500
                  </span>
                </div>
                <Textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, content: e.target.value }))
                  }
                  maxLength={500}
                  rows={4}
                  placeholder="Enter your post content..."
                />
              </div>

              {/* Link URL for Pinterest */}
              {formData.scheduled_platforms.includes("pinterest") && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Link URL (optional)</Label>
                  <Input
                    value={formData.link_url}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, link_url: e.target.value }))
                    }
                    placeholder="https://..."
                  />
                </div>
              )}

              {/* Media Upload */}
              <MediaUploader
                projectId={projectId}
                mediaUrl={formData.media_url}
                mediaType={formData.media_type}
                onMediaChange={(url, type) =>
                  setFormData((prev) => ({ ...prev, media_url: url, media_type: type }))
                }
              />

              {/* Schedule Options */}
              <div className="pt-4 border-t">
                <ScheduleDateTimePicker
                  mode={scheduleMode}
                  onModeChange={setScheduleMode}
                  date={scheduledDate}
                  onDateChange={setScheduledDate}
                  time={scheduledTime}
                  onTimeChange={setScheduledTime}
                />
              </div>
            </div>
          </div>

          {/* Right Column - Preview */}
          <div className="w-[320px] border-l bg-muted/30 p-6 overflow-y-auto">
            <SocialPostPreview
              platforms={formData.scheduled_platforms}
              content={formData.content}
              mediaUrl={formData.media_url}
              mediaType={formData.media_type}
              title={formData.title}
              linkUrl={formData.link_url}
            />
          </div>
        </div>

        {/* Footer */}
        <SheetFooter className="px-6 py-4 border-t shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {scheduleMode === "now" ? (
            <Button
              onClick={handlePostNow}
              disabled={isPosting || !formData.scheduled_platforms.length}
              className="bg-rose-500 hover:bg-rose-600"
            >
              {isPosting ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Post Now
            </Button>
          ) : (
            <Button
              onClick={handleSchedule}
              disabled={isScheduling || !scheduledDate || !formData.scheduled_platforms.length}
            >
              {isScheduling ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Send className="w-4 h-4 mr-2" />
              )}
              Schedule
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
