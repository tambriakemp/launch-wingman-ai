import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Send, Loader2, X } from "lucide-react";
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
import { PlatformSelector } from "./PlatformSelector";
import { MediaUploader } from "./MediaUploader";
import { SocialPostPreview } from "./SocialPostPreview";
import { PinterestBoardSelector } from "./PinterestBoardSelector";
import { ScheduleDateTimePicker } from "./ScheduleDateTimePicker";
import { trackSocialPostPublish, trackSocialPostSchedule, trackSocialPostScheduleCancel } from "@/lib/analytics";
import { usePinterestEnvironmentSetting } from "@/hooks/usePinterestEnvironmentSetting";
import { usePinterestSandboxToken } from "@/hooks/usePinterestSandboxToken";

interface SchedulePostSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  contentItem: {
    id: string;
    title: string;
    content: string | null;
    description: string | null;
    scheduled_at?: string | null;
    scheduled_platforms?: string[] | null;
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
  const queryClient = useQueryClient();
  const { environment: pinterestEnvironment } = usePinterestEnvironmentSetting();
  const { token: pinterestSandboxToken } = usePinterestSandboxToken();
  const [isPosting, setIsPosting] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
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
    instagram_post_type: "feed" as "feed" | "reel" | "story",
  });

  const isAlreadyScheduled = !!(contentItem?.scheduled_at);

  // Reset form when content item changes
  useEffect(() => {
    if (contentItem) {
      // Pre-populate with existing data
      const existingPlatforms = contentItem.scheduled_platforms || [];
      
      setFormData({
        title: contentItem.title || "",
        content: contentItem.content || contentItem.description || "",
        media_url: null,
        media_type: null,
        scheduled_platforms: existingPlatforms,
        pinterest_board_id: null,
        link_url: "",
        instagram_post_type: "feed",
      });

      // If already scheduled, pre-populate the date/time and set mode to schedule
      if (contentItem.scheduled_at) {
        const scheduledDateTime = new Date(contentItem.scheduled_at);
        setScheduledDate(scheduledDateTime);
        const hours = scheduledDateTime.getHours().toString().padStart(2, "0");
        const minutes = scheduledDateTime.getMinutes().toString().padStart(2, "0");
        setScheduledTime(`${hours}:${minutes}`);
        setScheduleMode("schedule");
      } else {
        setScheduleMode("now");
        setScheduledDate(null);
        setScheduledTime("09:00");
      }
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

  // Check if Instagram is connected
  const { data: instagramConnection } = useQuery({
    queryKey: ["instagram-connection", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_connections")
        .select("id, account_name, account_id, page_id")
        .eq("user_id", user!.id)
        .eq("platform", "instagram")
        .single();

      if (error) return null;
      return data;
    },
    enabled: !!user,
  });

  const postToPinterest = async () => {
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
          media_url: formData.media_url,
          board_id: formData.pinterest_board_id,
          link: formData.link_url || undefined,
          environment: pinterestEnvironment,
          sandboxToken: pinterestEnvironment === "sandbox" ? pinterestSandboxToken : undefined,
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
      trackSocialPostPublish('pinterest');
      onScheduled?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error posting to Pinterest:", error);
      toast.error(error.message || "Failed to post to Pinterest");
    } finally {
      setIsPosting(false);
    }
  };

  const postToInstagram = async () => {
    if (!formData.media_url) {
      toast.error("Instagram requires an image or video");
      return;
    }

    if (!instagramConnection) {
      toast.error("Please connect your Instagram account first");
      return;
    }

    // Validate media type for specific post types
    const isVideo = formData.media_type === "video";
    if (formData.instagram_post_type === "reel" && !isVideo) {
      toast.error("Reels require a video");
      return;
    }

    setIsPosting(true);
    try {
      const response = await supabase.functions.invoke("post-to-instagram", {
        body: {
          caption: formData.content,
          postType: formData.instagram_post_type,
          ...(isVideo 
            ? { videoUrl: formData.media_url, mediaType: "video" }
            : { imageUrl: formData.media_url, mediaType: "image" }
          ),
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to post to Instagram");
      }

      if (response.data?.error) {
        throw new Error(response.data.error);
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

      toast.success("Posted to Instagram successfully!");
      trackSocialPostPublish('instagram', formData.instagram_post_type);
      onScheduled?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error posting to Instagram:", error);
      toast.error(error.message || "Failed to post to Instagram");
    } finally {
      setIsPosting(false);
    }
  };

  const handlePostNow = async () => {
    const selectedPlatform = formData.scheduled_platforms[0];

    if (!selectedPlatform) {
      toast.error("Please select a platform to post");
      return;
    }

    if (selectedPlatform === "pinterest") {
      await postToPinterest();
    } else if (selectedPlatform === "instagram") {
      await postToInstagram();
    } else {
      toast.error(`Posting to ${selectedPlatform} is not yet supported`);
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
          media_url: formData.media_url,
          board_id: formData.pinterest_board_id,
          link: formData.link_url,
          environment: pinterestEnvironment,
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
      trackSocialPostSchedule(formData.scheduled_platforms[0]);
      onScheduled?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error scheduling post:", error);
      toast.error(error.message || "Failed to schedule post");
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCancelSchedule = async () => {
    if (!contentItem?.id) return;

    setIsCancelling(true);
    try {
      // Update content_planner to remove schedule
      await supabase
        .from("content_planner")
        .update({
          scheduled_at: null,
          scheduled_platforms: [],
        })
        .eq("id", contentItem.id);

      // Delete pending scheduled posts
      await supabase
        .from("scheduled_posts")
        .delete()
        .eq("content_item_id", contentItem.id)
        .eq("status", "pending");

      queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
      toast.success("Scheduled post cancelled");
      trackSocialPostScheduleCancel(contentItem?.scheduled_platforms?.[0] || 'unknown');
      onScheduled?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error cancelling schedule:", error);
      toast.error(error.message || "Failed to cancel schedule");
    } finally {
      setIsCancelling(false);
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

              {/* Instagram Post Type Selector */}
              {formData.scheduled_platforms.includes("instagram") && instagramConnection && (
                <div className="space-y-2">
                  <Label className="text-xs">Instagram Post Type</Label>
                  <div className="flex gap-2">
                    {[
                      { value: "feed", label: "Feed Post", icon: "📷" },
                      { value: "reel", label: "Reel", icon: "🎬" },
                      { value: "story", label: "Story", icon: "⏱️" },
                    ].map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            instagram_post_type: option.value as "feed" | "reel" | "story",
                          }))
                        }
                        className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-md border text-sm transition-colors ${
                          formData.instagram_post_type === option.value
                            ? "bg-primary text-primary-foreground border-primary"
                            : "bg-background border-border hover:bg-muted"
                        }`}
                      >
                        <span>{option.icon}</span>
                        <span>{option.label}</span>
                      </button>
                    ))}
                  </div>
                  {formData.instagram_post_type === "reel" && (
                    <p className="text-xs text-muted-foreground">Reels require a video file</p>
                  )}
                  {formData.instagram_post_type === "story" && (
                    <p className="text-xs text-muted-foreground">Stories disappear after 24 hours</p>
                  )}
                </div>
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
        <SheetFooter className="px-6 py-4 border-t shrink-0 flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            {isAlreadyScheduled && (
              <Button
                variant="destructive"
                onClick={handleCancelSchedule}
                disabled={isCancelling}
              >
                {isCancelling ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <X className="w-4 h-4 mr-2" />
                )}
                Cancel Schedule
              </Button>
            )}
          </div>
          <div className="flex gap-2">
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
                {isAlreadyScheduled ? "Reschedule" : "Schedule"}
              </Button>
            )}
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
