import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Wand2,
  Copy,
  Check,
  Trash2,
  CalendarPlus,
  ChevronDown,
  Send,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PlatformSelector } from "./PlatformSelector";
import { MediaUploader } from "./MediaUploader";
import { SocialPostPreview } from "./SocialPostPreview";
import { PinterestBoardSelector } from "./PinterestBoardSelector";
import { ScheduleDateTimePicker } from "./ScheduleDateTimePicker";
import { TikTokPostOptions } from "./TikTokPostOptions";
import { trackSocialPostPublish, trackSocialPostSchedule, trackSocialPostScheduleCancel } from "@/lib/analytics";

// Types for the unified component
interface TalkingPoint {
  id: string;
  title: string;
  description: string;
  contentType: string;
}

interface AudienceData {
  target_audience?: string | null;
  desired_outcome?: string | null;
  primary_pain_point?: string | null;
  niche?: string | null;
}

export interface ContentPlannerItem {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  phase: string;
  day_number: number;
  time_of_day: string;
  status: string;
  content: string | null;
  scheduled_at: string | null;
  scheduled_platforms: string[] | null;
  media_url?: string | null;
  media_type?: string | null;
}

interface PostEditorSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  // Mode 1: Creating from an idea/talking point (generates draft)
  talkingPoint?: TalkingPoint | null;
  // Mode 2: Editing an existing content planner item
  existingItem?: ContentPlannerItem | null;
  // Mode 3: Creating a new blank post (no pre-population)
  isCreateMode?: boolean;
  // Mode 4: Editing an existing saved draft (from content_drafts table)
  existingDraftId?: string | null;
  // Slot context - when creating from a specific timeline slot
  slotContext?: {
    phase: string;
    dayNumber: number;
    timeOfDay: string;
  } | null;
  // Context data
  currentPhase?: string;
  funnelType?: string | null;
  audienceData?: AudienceData | null;
  // Callback when content is saved/scheduled
  onSaved?: () => void;
}

type ToneAdjustment = "simplify" | "shorter" | "calmer" | "direct";

const PHASES = [
  { value: "pre-launch-week-1", label: "Pre-Launch: Week 1" },
  { value: "pre-launch-week-2", label: "Pre-Launch: Week 2" },
  { value: "pre-launch-week-3", label: "Pre-Launch: Week 3" },
  { value: "pre-launch-week-4", label: "Pre-Launch: Week 4" },
  { value: "launch", label: "Launch Week" },
];

const DAYS = [
  { value: 1, label: "Day 1" },
  { value: 2, label: "Day 2" },
  { value: 3, label: "Day 3" },
  { value: 4, label: "Day 4" },
  { value: 5, label: "Day 5" },
  { value: 6, label: "Day 6" },
  { value: 7, label: "Day 7" },
];

const CATEGORY_GUIDANCE: Record<string, string> = {
  general: "Share a perspective or realization that helps your audience feel understood.",
  stories: "Start with a moment, question, or thought — not an explanation.",
  offer: "Explain this as if you're talking to someone who's curious, not convinced.",
  "behind-the-scenes": "Write this like you're thinking out loud.",
};

const CATEGORY_LABELS: Record<string, string> = {
  general: "General",
  stories: "Story",
  offer: "Offer",
  "behind-the-scenes": "Behind the Scenes",
};

export function PostEditorSheet({
  open,
  onOpenChange,
  projectId,
  talkingPoint,
  existingItem,
  isCreateMode = false,
  existingDraftId,
  slotContext,
  currentPhase = "planning",
  funnelType,
  audienceData,
  onSaved,
}: PostEditorSheetProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Track the current draft ID (from content_drafts table)
  const [currentDraftId, setCurrentDraftId] = useState<string | null>(null);

  // Content state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [contentType, setContentType] = useState("general");

  // Loading states
  const [generating, setGenerating] = useState(false);
  const [generatingIdea, setGeneratingIdea] = useState(false);
  const [hasGeneratedIdea, setHasGeneratedIdea] = useState(false);
  const [adjusting, setAdjusting] = useState<ToneAdjustment | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [addingToTimeline, setAddingToTimeline] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Timeline assignment state
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [selectedPhase, setSelectedPhase] = useState<string>("pre-launch-week-1");
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [isAssignedToTimeline, setIsAssignedToTimeline] = useState(false);
  const [timelineItemId, setTimelineItemId] = useState<string | null>(null);

  // Scheduling state
  const [scheduleMode, setScheduleMode] = useState<"now" | "schedule">("now");
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduledTime, setScheduledTime] = useState("09:00");

  // Social post state
  const [formData, setFormData] = useState({
    media_url: null as string | null,
    media_type: null as string | null,
    scheduled_platforms: [] as string[],
    pinterest_board_id: null as string | null,
    link_url: "",
    instagram_post_type: "feed" as "feed" | "reel" | "story",
    tiktok_privacy_level: "PUBLIC_TO_EVERYONE",
    tiktok_brand_content: false,
    tiktok_brand_organic: false,
  });

  const isAlreadyScheduled = !!(existingItem?.scheduled_at);
  const isEditingExisting = !!existingItem;
  // Posted content = status is "completed" (successfully posted to social platform)
  const isPostedContent = existingItem?.status === "completed";

  // Check social connections
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
    enabled: !!user && open,
  });

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
    enabled: !!user && open,
  });

  const { data: facebookConnection } = useQuery({
    queryKey: ["facebook-connection", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_connections")
        .select("id, account_name, account_id, page_id")
        .eq("user_id", user!.id)
        .eq("platform", "facebook")
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user && open,
  });

  const { data: threadsConnection } = useQuery({
    queryKey: ["threads-connection", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_connections")
        .select("id, account_name, account_id")
        .eq("user_id", user!.id)
        .eq("platform", "threads")
        .single();
      if (error) return null;
      return data;
    },
    enabled: !!user && open,
  });

  const { data: tiktokConnection } = useQuery({
    queryKey: ["tiktok-connection", user?.id],
    queryFn: async () => {
      // Check for both production and sandbox TikTok connections
      const { data, error } = await supabase
        .from("social_connections")
        .select("id, account_name, account_id, platform")
        .eq("user_id", user!.id)
        .in("platform", ["tiktok", "tiktok_sandbox"])
        .limit(1);
      if (error || !data || data.length === 0) return null;
      return data[0];
    },
    enabled: !!user && open,
  });

  // Combine all connections into a single array for the PlatformSelector
  const allConnections = [
    ...(pinterestConnection ? [{ id: pinterestConnection.id, platform: "pinterest", account_name: pinterestConnection.account_name }] : []),
    ...(instagramConnection ? [{ id: instagramConnection.id, platform: "instagram", account_name: instagramConnection.account_name }] : []),
    ...(facebookConnection ? [{ id: facebookConnection.id, platform: "facebook", account_name: facebookConnection.account_name }] : []),
    ...(threadsConnection ? [{ id: threadsConnection.id, platform: "threads", account_name: threadsConnection.account_name }] : []),
    ...(tiktokConnection ? [{ id: tiktokConnection.id, platform: tiktokConnection.platform, account_name: tiktokConnection.account_name }] : []),
  ];

  // Initialize form when opening
  useEffect(() => {
    if (!open) return;

    // Reset generation state when opening
    setHasGeneratedIdea(false);

    if (existingItem) {
      // Editing existing item - hydrate all fields including media and platforms
      setTitle(existingItem.title || "");
      setContent(existingItem.content || existingItem.description || "");
      setContentType(existingItem.content_type || "general");
      setSelectedPhase(existingItem.phase || "pre-launch-week-1");
      setSelectedDay(existingItem.day_number || 1);
      setIsAssignedToTimeline(true);
      setTimelineItemId(existingItem.id);
      
      // Hydrate form data including media and platforms
      setFormData((prev) => ({
        ...prev,
        scheduled_platforms: existingItem.scheduled_platforms || [],
        media_url: existingItem.media_url || null,
        media_type: existingItem.media_type || null,
      }));

      if (existingItem.scheduled_at) {
        const scheduledDateTime = new Date(existingItem.scheduled_at);
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
      setCurrentDraftId(null);
    } else if (talkingPoint) {
      // Check if this is from an existing draft (existingDraftId provided)
      if (existingDraftId) {
        // Editing an existing saved draft
        setTitle(talkingPoint.title);
        setContent(talkingPoint.description);
        setContentType(talkingPoint.contentType || "general");
        setCurrentDraftId(existingDraftId);
        setIsAssignedToTimeline(false);
        setTimelineItemId(null);
        setTimelineOpen(false);
        setScheduleMode("now");
        setScheduledDate(null);
        setFormData({
          media_url: null,
          media_type: null,
          scheduled_platforms: [],
          pinterest_board_id: null,
          link_url: "",
          instagram_post_type: "feed",
          tiktok_privacy_level: "PUBLIC_TO_EVERYONE",
          tiktok_brand_content: false,
          tiktok_brand_organic: false,
        });
      } else {
        // Creating from talking point - generate draft
        setTitle(talkingPoint.title);
        setContentType(talkingPoint.contentType || "general");
        setCurrentDraftId(null);
        setIsAssignedToTimeline(false);
        setTimelineItemId(null);
        setTimelineOpen(false);
        setScheduleMode("now");
        setScheduledDate(null);
        setFormData({
          media_url: null,
          media_type: null,
          scheduled_platforms: [],
          pinterest_board_id: null,
          link_url: "",
          instagram_post_type: "feed",
          tiktok_privacy_level: "PUBLIC_TO_EVERYONE",
          tiktok_brand_content: false,
          tiktok_brand_organic: false,
        });
        generateDraft();
      }
    } else if (isCreateMode) {
      // Creating new blank post
      setTitle("");
      setContent("");
      setContentType("general");
      setCurrentDraftId(null);
      setTimelineOpen(false);
      setScheduleMode("now");
      setScheduledDate(null);
      setFormData({
        media_url: null,
        media_type: null,
        scheduled_platforms: [],
        pinterest_board_id: null,
        link_url: "",
        instagram_post_type: "feed",
        tiktok_privacy_level: "PUBLIC_TO_EVERYONE",
        tiktok_brand_content: false,
        tiktok_brand_organic: false,
      });
      
      // If slot context is provided, pre-assign to that slot
      if (slotContext) {
        setSelectedPhase(slotContext.phase);
        setSelectedDay(slotContext.dayNumber);
        setIsAssignedToTimeline(true);
        setTimelineItemId(null); // Will be created on save
      } else {
        setIsAssignedToTimeline(false);
        setTimelineItemId(null);
      }
    }
  }, [open, existingItem, talkingPoint, isCreateMode, slotContext]);

  const generateDraft = async () => {
    if (!talkingPoint) return;

    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-content-draft", {
        body: {
          projectId,
          talkingPoint,
          currentPhase,
          funnelType,
          audienceData,
          contentType: talkingPoint.contentType || "general",
        },
      });

      if (error) throw error;

      if (data?.draft) {
        setContent(data.draft);
      }
    } catch (error) {
      console.error("Error generating draft:", error);
      setContent(`${talkingPoint.description}\n\nShare your thoughts on this...`);
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateIdea = async () => {
    setGeneratingIdea(true);
    try {
      // Use title if available, otherwise use a generic prompt based on content type
      const hasTitle = title.trim().length > 0;
      const ideaTitle = hasTitle ? title.trim() : `Create a ${CATEGORY_LABELS[contentType] || "general"} post`;
      
      const { data, error } = await supabase.functions.invoke("generate-content-draft", {
        body: {
          projectId,
          talkingPoint: {
            id: "manual",
            title: ideaTitle,
            description: ideaTitle,
            contentType: contentType,
          },
          currentPhase,
          funnelType,
          audienceData,
          contentType,
          generateTitle: !hasTitle,
        },
      });

      if (error) throw error;

      if (data?.draft) {
        setContent(data.draft);
        setHasGeneratedIdea(true);
      }
      
      // Set the generated title if one was returned
      if (data?.title && !hasTitle) {
        setTitle(data.title);
      }
    } catch (error) {
      console.error("Error generating idea:", error);
      toast.error("Failed to generate content");
    } finally {
      setGeneratingIdea(false);
    }
  };

  const adjustTone = async (adjustment: ToneAdjustment) => {
    if (!content) return;

    setAdjusting(adjustment);
    try {
      const { data, error } = await supabase.functions.invoke("generate-content-draft", {
        body: {
          projectId,
          existingDraft: content,
          adjustment,
          audienceData,
          contentType,
        },
      });

      if (error) throw error;

      if (data?.draft) {
        setContent(data.draft);
      }
    } catch (error) {
      console.error("Error adjusting draft:", error);
      toast.error("Failed to adjust draft");
    } finally {
      setAdjusting(null);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToTimeline = async () => {
    if (!user || !title.trim()) return;

    setAddingToTimeline(true);
    try {
      const { data, error } = await supabase
        .from("content_planner")
        .insert({
          project_id: projectId,
          user_id: user.id,
          phase: selectedPhase,
          day_number: selectedDay,
          time_of_day: "morning",
          title: title || "Untitled post",
          description: talkingPoint?.description || "",
          content_type: contentType,
          content: content || null,
          status: content ? "draft" : "planned",
        })
        .select()
        .single();

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
      setIsAssignedToTimeline(true);
      setTimelineItemId(data.id);
      setTimelineOpen(false);

      const phaseLabel = PHASES.find((p) => p.value === selectedPhase)?.label || selectedPhase;
      toast.success(`Added to ${phaseLabel}, Day ${selectedDay}`);
    } catch (error) {
      console.error("Error adding to timeline:", error);
      toast.error("Failed to add to timeline");
    } finally {
      setAddingToTimeline(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!user || !content.trim()) return;

    setSaving(true);
    try {
      if (timelineItemId) {
        // Update existing timeline item - include media and platforms
        const { error } = await supabase
          .from("content_planner")
          .update({
            title: title || "Untitled post",
            content: content,
            content_type: contentType,
            status: "draft",
            media_url: formData.media_url,
            media_type: formData.media_type,
            scheduled_platforms: formData.scheduled_platforms.length > 0 ? formData.scheduled_platforms : null,
          })
          .eq("id", timelineItemId);

        if (error) throw error;
        toast.success("Draft updated");
      } else if (slotContext && !timelineItemId) {
        // Creating from slot context - auto-save to that slot
        const { data, error } = await supabase
          .from("content_planner")
          .insert({
            project_id: projectId,
            user_id: user.id,
            phase: slotContext.phase,
            day_number: slotContext.dayNumber,
            time_of_day: slotContext.timeOfDay,
            title: title || "Untitled post",
            description: "",
            content_type: contentType,
            content: content || null,
            status: "draft",
            media_url: formData.media_url,
            media_type: formData.media_type,
            scheduled_platforms: formData.scheduled_platforms.length > 0 ? formData.scheduled_platforms : null,
          })
          .select()
          .single();

        if (error) throw error;
        setTimelineItemId(data.id);
        const phaseLabel = PHASES.find((p) => p.value === slotContext.phase)?.label || slotContext.phase;
        toast.success(`Draft saved to ${phaseLabel}, Day ${slotContext.dayNumber}`);
      } else if (currentDraftId) {
        // Update existing saved draft
        const { error } = await supabase
          .from("content_drafts")
          .update({
            title: title || "Untitled draft",
            content: content,
            content_type: contentType,
          })
          .eq("id", currentDraftId);

        if (error) throw error;
        toast.success("Draft updated");
      } else {
        // Save as new content draft (not on timeline)
        const { error } = await supabase.from("content_drafts").insert({
          project_id: projectId,
          user_id: user.id,
          title: title || "Untitled draft",
          content: content,
          content_type: contentType,
          phase: currentPhase,
          funnel_type: funnelType,
        });

        if (error) throw error;
        toast.success("Draft saved");
      }

      queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
      queryClient.invalidateQueries({ queryKey: ["content-drafts", projectId] });
      queryClient.invalidateQueries({ queryKey: ["saved-content-counts", projectId] });
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving draft:", error);
      toast.error("Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!existingItem) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from("content_planner")
        .delete()
        .eq("id", existingItem.id);

      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
      toast.success("Removed from timeline");
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to remove");
    } finally {
      setDeleting(false);
    }
  };

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
          title: title,
          description: content,
          imageUrl: formData.media_url,
          boardId: formData.pinterest_board_id,
          link: formData.link_url || undefined,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to post to Pinterest");
      }

      // Update the content_planner item if exists
      if (timelineItemId) {
        await supabase
          .from("content_planner")
          .update({
            scheduled_platforms: formData.scheduled_platforms,
            scheduled_at: new Date().toISOString(),
            status: "completed",
          })
          .eq("id", timelineItemId);
      }

      toast.success("Posted to Pinterest successfully!");
      trackSocialPostPublish('pinterest');
      queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
      onSaved?.();
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

    const isVideo = formData.media_type === "video";
    if (formData.instagram_post_type === "reel" && !isVideo) {
      toast.error("Reels require a video");
      return;
    }

    setIsPosting(true);
    try {
      const response = await supabase.functions.invoke("post-to-instagram", {
        body: {
          caption: content,
          postType: formData.instagram_post_type,
          ...(isVideo
            ? { videoUrl: formData.media_url, mediaType: "video" }
            : { imageUrl: formData.media_url, mediaType: "image" }),
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to post to Instagram");
      }
      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      if (timelineItemId) {
        await supabase
          .from("content_planner")
          .update({
            scheduled_platforms: formData.scheduled_platforms,
            scheduled_at: new Date().toISOString(),
            status: "completed",
          })
          .eq("id", timelineItemId);
      }

      toast.success("Posted to Instagram successfully!");
      trackSocialPostPublish('instagram', formData.instagram_post_type);
      queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
      onSaved?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error posting to Instagram:", error);
      toast.error(error.message || "Failed to post to Instagram");
    } finally {
      setIsPosting(false);
    }
  };

  const postToFacebook = async () => {
    if (!facebookConnection) {
      toast.error("Please connect your Facebook Page first");
      return;
    }

    setIsPosting(true);
    try {
      const response = await supabase.functions.invoke("post-to-facebook", {
        body: {
          message: content,
          imageUrl: formData.media_url || undefined,
          videoUrl: formData.media_type === "video" ? formData.media_url : undefined,
          link: formData.link_url || undefined,
          postType: formData.media_type === "video" ? "video" : formData.media_url ? "photo" : "feed",
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to post to Facebook");
      }
      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      if (timelineItemId) {
        await supabase
          .from("content_planner")
          .update({
            scheduled_platforms: formData.scheduled_platforms,
            scheduled_at: new Date().toISOString(),
            status: "completed",
          })
          .eq("id", timelineItemId);
      }

      toast.success("Posted to Facebook successfully!");
      trackSocialPostPublish('facebook');
      queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
      onSaved?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error posting to Facebook:", error);
      toast.error(error.message || "Failed to post to Facebook");
    } finally {
      setIsPosting(false);
    }
  };

  const postToThreads = async () => {
    if (!threadsConnection) {
      toast.error("Please connect your Threads account first");
      return;
    }

    setIsPosting(true);
    try {
      const isVideo = formData.media_type === "video";
      const response = await supabase.functions.invoke("post-to-threads", {
        body: {
          text: content,
          mediaType: formData.media_url ? (isVideo ? "VIDEO" : "IMAGE") : "TEXT",
          imageUrl: !isVideo ? formData.media_url : undefined,
          videoUrl: isVideo ? formData.media_url : undefined,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to post to Threads");
      }
      if (response.data?.error) {
        throw new Error(response.data.error);
      }

      if (timelineItemId) {
        await supabase
          .from("content_planner")
          .update({
            scheduled_platforms: formData.scheduled_platforms,
            scheduled_at: new Date().toISOString(),
            status: "completed",
          })
          .eq("id", timelineItemId);
      }

      toast.success("Posted to Threads successfully!");
      trackSocialPostPublish('threads');
      queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
      onSaved?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error posting to Threads:", error);
      toast.error(error.message || "Failed to post to Threads");
    } finally {
      setIsPosting(false);
    }
  };

  // Validate required fields before posting
  const validatePostRequirements = (platform: string): boolean => {
    const errors: string[] = [];
    
    // Content is always required
    if (!content?.trim()) {
      errors.push("Post content is required");
    }
    
    // Platform-specific validations
    if (platform === "pinterest") {
      if (!formData.media_url) {
        errors.push("Pinterest requires an image");
      }
      if (!formData.pinterest_board_id) {
        errors.push("Please select a Pinterest board");
      }
    } else if (platform === "instagram") {
      if (!formData.media_url) {
        errors.push("Instagram requires an image or video");
      }
      if (!instagramConnection) {
        errors.push("Please connect your Instagram account first");
      }
    } else if (platform === "facebook") {
      if (!facebookConnection) {
        errors.push("Please connect your Facebook Page first");
      }
    } else if (platform === "threads") {
      if (!threadsConnection) {
        errors.push("Please connect your Threads account first");
      }
    } else if (platform === "tiktok") {
      if (!tiktokConnection) {
        errors.push("Please connect your TikTok account first");
      }
      if (!formData.media_url || formData.media_type !== "video") {
        errors.push("TikTok only supports video posts");
      }
    }
    
    if (errors.length > 0) {
      errors.forEach((error) => toast.error(error));
      return false;
    }
    
    return true;
  };

  const handlePostNow = async () => {
    const selectedPlatform = formData.scheduled_platforms[0];

    if (!selectedPlatform) {
      toast.error("Please select a platform to post");
      return;
    }
    
    // Validate requirements before posting
    if (!validatePostRequirements(selectedPlatform)) {
      return;
    }

    if (selectedPlatform === "pinterest") {
      await postToPinterest();
    } else if (selectedPlatform === "instagram") {
      await postToInstagram();
    } else if (selectedPlatform === "facebook") {
      await postToFacebook();
    } else if (selectedPlatform === "threads") {
      await postToThreads();
    } else if (selectedPlatform === "tiktok") {
      await postToTikTok();
    } else {
      toast.error(`Posting to ${selectedPlatform} is not yet supported`);
    }
  };

  const postToTikTok = async () => {
    if (!user) return;

    setIsPosting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Please sign in again");
        setIsPosting(false);
        return;
      }

      const response = await supabase.functions.invoke("post-to-tiktok", {
        body: {
          videoUrl: formData.media_url,
          caption: content,
          privacyLevel: formData.tiktok_privacy_level,
          brandContentToggle: formData.tiktok_brand_content,
          brandOrganicToggle: formData.tiktok_brand_organic,
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      // Handle Supabase function invocation error
      if (response.error) {
        // Try to extract TikTok-specific error from response data
        const tiktokError = response.data?.tiktok_error;
        const errorMessage = tiktokError?.message || response.data?.error || response.error.message || "Failed to post to TikTok";
        throw new Error(errorMessage);
      }
      
      // Handle error returned in response data
      if (response.data?.error) {
        const tiktokError = response.data?.tiktok_error;
        const errorMessage = tiktokError?.message || response.data.error;
        throw new Error(errorMessage);
      }

      if (timelineItemId) {
        await supabase
          .from("content_planner")
          .update({
            scheduled_platforms: formData.scheduled_platforms,
            scheduled_at: new Date().toISOString(),
            status: "completed",
          })
          .eq("id", timelineItemId);
      }

      if (response.data?.status === "PROCESSING") {
        toast.success("Video submitted to TikTok! It may take a few minutes to appear.");
      } else {
        toast.success("Posted to TikTok successfully!");
      }
      trackSocialPostPublish('tiktok');
      queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
      onSaved?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error posting to TikTok:", error);
      toast.error(error.message || "Failed to post to TikTok");
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
    
    // Validate requirements for the selected platform
    const selectedPlatform = formData.scheduled_platforms[0];
    if (!validatePostRequirements(selectedPlatform)) {
      return;
    }
    
    if (!user) return;

    // Use existing item ID if editing, otherwise use timelineItemId
    let itemId = existingItem?.id || timelineItemId;
    
    if (!itemId) {
      // Create the content planner item first (only if truly new)
      const { data, error } = await supabase
        .from("content_planner")
        .insert({
          project_id: projectId,
          user_id: user.id,
          phase: selectedPhase,
          day_number: selectedDay,
          time_of_day: "morning",
          title: title || "Untitled post",
          description: "",
          content_type: contentType,
          content: content || null,
          status: "draft",
          media_url: formData.media_url,
          media_type: formData.media_type,
          scheduled_platforms: formData.scheduled_platforms.length > 0 ? formData.scheduled_platforms : null,
        })
        .select()
        .single();

      if (error) {
        toast.error("Failed to save post");
        return;
      }
      itemId = data.id;
    }

    setIsScheduling(true);
    try {
      const [hours, minutes] = scheduledTime.split(":").map(Number);
      const scheduleDateTime = new Date(scheduledDate);
      scheduleDateTime.setHours(hours, minutes, 0, 0);

      // Delete any existing pending scheduled_posts for this content item to avoid duplicates
      await supabase
        .from("scheduled_posts")
        .delete()
        .eq("content_item_id", itemId)
        .eq("status", "pending");

      // Save to scheduled_posts table
      const { error } = await supabase.from("scheduled_posts").insert({
        user_id: user.id,
        project_id: projectId,
        content_item_id: itemId,
        platform: formData.scheduled_platforms[0],
        scheduled_for: scheduleDateTime.toISOString(),
        post_data: {
          title: title,
          description: content,
          imageUrl: formData.media_url,
          boardId: formData.pinterest_board_id,
          link: formData.link_url,
        },
        status: "pending",
      });

      if (error) throw error;

      // Update the content_planner item with all fields
      await supabase
        .from("content_planner")
        .update({
          title: title || "Untitled post",
          content: content,
          content_type: contentType,
          scheduled_platforms: formData.scheduled_platforms,
          scheduled_at: scheduleDateTime.toISOString(),
          media_url: formData.media_url,
          media_type: formData.media_type,
        })
        .eq("id", itemId);

      toast.success("Post scheduled successfully!");
      trackSocialPostSchedule(formData.scheduled_platforms[0]);
      queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
      onSaved?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error scheduling post:", error);
      toast.error(error.message || "Failed to schedule post");
    } finally {
      setIsScheduling(false);
    }
  };

  const handleCancelSchedule = async () => {
    if (!existingItem?.id) return;

    setIsCancelling(true);
    try {
      await supabase
        .from("content_planner")
        .update({
          scheduled_at: null,
          scheduled_platforms: [],
        })
        .eq("id", existingItem.id);

      await supabase
        .from("scheduled_posts")
        .delete()
        .eq("content_item_id", existingItem.id)
        .eq("status", "pending");

      queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
      toast.success("Scheduled post cancelled");
      trackSocialPostScheduleCancel(existingItem?.scheduled_platforms?.[0] || 'unknown');
      onSaved?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error cancelling schedule:", error);
      toast.error(error.message || "Failed to cancel schedule");
    } finally {
      setIsCancelling(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setContent("");
    setContentType("general");
    setIsAssignedToTimeline(false);
    setTimelineItemId(null);
    setTimelineOpen(false);
    setFormData({
      media_url: null,
      media_type: null,
      scheduled_platforms: [],
      pinterest_board_id: null,
      link_url: "",
      instagram_post_type: "feed",
      tiktok_privacy_level: "PUBLIC_TO_EVERYONE",
      tiktok_brand_content: false,
      tiktok_brand_organic: false,
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="w-[90vw] max-w-[900px] p-0 flex flex-col"
      >
        <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <SheetTitle>
            {isPostedContent
              ? "View Posted Content"
              : isCreateMode
              ? "Create Post"
              : isEditingExisting
              ? "Edit Post"
              : "Turn into a Post"}
          </SheetTitle>
        </SheetHeader>

        {/* Two Column Layout */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Column - Content Editor & Scheduling */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
            {generating ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Creating your draft...
                </span>
              </div>
            ) : (
              <>
                {/* Title */}
                <div className="space-y-1.5">
                  <Label className="text-xs">Title</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter post title..."
                    disabled={isPostedContent}
                    readOnly={isPostedContent}
                  />
                </div>

                {/* Category guidance */}
                <p className="text-sm text-muted-foreground italic">
                  {CATEGORY_GUIDANCE[contentType] || CATEGORY_GUIDANCE.general}
                </p>

                {/* Content */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Content / Copy</Label>
                    <span className="text-xs text-muted-foreground">
                      {content.length} characters
                    </span>
                  </div>
                  <Textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Your content will appear here..."
                    className="min-h-[150px] resize-none"
                    disabled={isPostedContent}
                    readOnly={isPostedContent}
                  />
                  
                  {/* Content Type + Generate Ideas Row */}
                  {!isPostedContent && (
                    <div className="flex items-center gap-3 mt-2">
                      <Select
                        value={contentType}
                        onValueChange={setContentType}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Content type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="general">General posts</SelectItem>
                          <SelectItem value="stories">Stories / prompts</SelectItem>
                          <SelectItem value="offer">Offer explanation</SelectItem>
                          <SelectItem value="behind-the-scenes">Behind-the-scenes</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGenerateIdea}
                        disabled={generatingIdea}
                      >
                        {generatingIdea ? (
                          <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                        ) : (
                          <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                        )}
                        {hasGeneratedIdea ? "Regenerate" : "Generate Ideas"}
                      </Button>
                    </div>
                  )}
                </div>

                {/* Adjust Tone Section - hidden for posted content */}
                {!isPostedContent && (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Adjust tone
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => adjustTone("simplify")}
                      disabled={!!adjusting || !content}
                    >
                      {adjusting === "simplify" ? (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      ) : (
                        <Wand2 className="w-3.5 h-3.5 mr-1.5" />
                      )}
                      Simplify
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => adjustTone("shorter")}
                      disabled={!!adjusting || !content}
                    >
                      {adjusting === "shorter" && (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      )}
                      Make it shorter
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => adjustTone("calmer")}
                      disabled={!!adjusting || !content}
                    >
                      {adjusting === "calmer" && (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      )}
                      Calmer
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => adjustTone("direct")}
                      disabled={!!adjusting || !content}
                    >
                      {adjusting === "direct" && (
                        <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      )}
                      More direct
                    </Button>
                  </div>
                </div>
                )}

                {/* Platform Selector Section - hidden for posted content */}
                {!isPostedContent && (
                <div className="space-y-4 pt-6 mt-4 border-t">
                  <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
                    <span>✨</span>
                    <span>Schedule / Post</span>
                  </h3>

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
                      connections={allConnections}
                    />
                  </div>

                  {/* Pinterest Board Selector */}
                  {formData.scheduled_platforms.includes("pinterest") &&
                    pinterestConnection && (
                      <PinterestBoardSelector
                        selectedBoard={formData.pinterest_board_id}
                        onBoardChange={(boardId) =>
                          setFormData((prev) => ({ ...prev, pinterest_board_id: boardId }))
                        }
                      />
                    )}

                  {/* Instagram Post Type Selector */}
                  {formData.scheduled_platforms.includes("instagram") &&
                    instagramConnection && (
                      <div className="space-y-2">
                        <Label className="text-xs">Instagram Post Type</Label>
                        <div className="flex gap-2">
                          {[
                            { value: "feed", label: "Feed", icon: "📷" },
                            { value: "reel", label: "Reel", icon: "🎬" },
                            { value: "story", label: "Story", icon: "⏱️" },
                          ].map((option) => (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() =>
                                setFormData((prev) => ({
                                  ...prev,
                                  instagram_post_type: option.value as
                                    | "feed"
                                    | "reel"
                                    | "story",
                                }))
                              }
                              className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md border text-xs transition-colors ${
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
                      </div>
                    )}

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

                  {/* TikTok Post Options */}
                  {(formData.scheduled_platforms.includes("tiktok") || 
                    formData.scheduled_platforms.includes("tiktok_sandbox")) &&
                    tiktokConnection && (
                      <TikTokPostOptions
                        privacyLevel={formData.tiktok_privacy_level}
                        onPrivacyChange={(value) =>
                          setFormData((prev) => ({ ...prev, tiktok_privacy_level: value }))
                        }
                        brandContentToggle={formData.tiktok_brand_content}
                        onBrandContentChange={(checked) =>
                          setFormData((prev) => ({ ...prev, tiktok_brand_content: checked }))
                        }
                        brandOrganicToggle={formData.tiktok_brand_organic}
                        onBrandOrganicChange={(checked) =>
                          setFormData((prev) => ({ ...prev, tiktok_brand_organic: checked }))
                        }
                        disabled={isPosting}
                      />
                    )}
                </div>
                )}

                {/* Media Upload - hidden for posted content */}
                {!isPostedContent && (
                  <MediaUploader
                    projectId={projectId}
                    mediaUrl={formData.media_url}
                    mediaType={formData.media_type}
                    onMediaChange={(url, type) =>
                      setFormData((prev) => ({ ...prev, media_url: url, media_type: type }))
                    }
                  />
                )}

                {/* Schedule Options - hidden for posted content */}
                {!isPostedContent && (
                  <ScheduleDateTimePicker
                    mode={scheduleMode}
                    onModeChange={setScheduleMode}
                    date={scheduledDate}
                    onDateChange={setScheduledDate}
                    time={scheduledTime}
                    onTimeChange={setScheduledTime}
                  />
                )}

                {/* Show slot assignment info when creating from slot */}
                {!isPostedContent && slotContext && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-muted/50 border">
                    <CalendarPlus className="w-4 h-4 text-primary" />
                    <span>
                      Will be saved to {PHASES.find(p => p.value === slotContext.phase)?.label}, Day {slotContext.dayNumber}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Right Column - Preview Only */}
          <div className="w-[320px] border-l bg-muted/30 p-6 overflow-y-auto flex flex-col">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-4">
              Preview
            </p>
            <SocialPostPreview
              platforms={formData.scheduled_platforms}
              content={content}
              mediaUrl={formData.media_url}
              mediaType={formData.media_type}
              title={title}
              linkUrl={formData.link_url}
            />
          </div>
        </div>

        {/* Footer */}
        <SheetFooter className="px-6 py-4 border-t shrink-0 flex justify-between">
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Close
            </Button>
            <Button variant="outline" onClick={handleCopy} disabled={!content}>
              {copied ? (
                <Check className="w-4 h-4 mr-2" />
              ) : (
                <Copy className="w-4 h-4 mr-2" />
              )}
              {copied ? "Copied" : "Copy"}
            </Button>
            {!isPostedContent && (
              <>
                <Button
                  variant="outline"
                  onClick={handleSaveDraft}
                  disabled={!content.trim() || saving}
                >
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Save draft
                </Button>
                {isEditingExisting && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    {deleting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </Button>
                )}
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
              </>
            )}
          </div>
          {!isPostedContent && (
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
                  disabled={
                    isScheduling || !scheduledDate || !formData.scheduled_platforms.length
                  }
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
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
