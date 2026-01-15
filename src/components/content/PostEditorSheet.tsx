import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Copy,
  Check,
  Trash2,
  CalendarPlus,
  Send,
  X,
  Clock,
  AlertCircle,
  Sparkles,
  ChevronUp,
  Save,
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
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PlatformSelector } from "./PlatformSelector";
import { MediaUploader } from "./MediaUploader";
import { SocialPostPreview } from "./SocialPostPreview";
import { PinterestMediaOptionsModal } from "./PinterestMediaOptionsModal";
import { ScheduleModal } from "./ScheduleModal";
import { PerNetworkEditor, PerPlatformContent } from "./PerNetworkEditor";
import { TikTokPostOptions } from "./TikTokPostOptions";
import { ContentToolbar } from "./ContentToolbar";
import { AIAssistPanel } from "./AIAssistPanel";
import { MediaSelectModal } from "./MediaSelectModal";
import { ContentTypeModal } from "./ContentTypeModal";
import { trackSocialPostPublish, trackSocialPostSchedule, trackSocialPostScheduleCancel } from "@/lib/analytics";
import { usePinterestEnvironmentSetting } from "@/hooks/usePinterestEnvironmentSetting";
import { usePinterestSandboxToken } from "@/hooks/usePinterestSandboxToken";

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
  labels?: string[] | null;
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
  const { environment: pinterestEnvironment } = usePinterestEnvironmentSetting();
  const { token: pinterestSandboxToken } = usePinterestSandboxToken();

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
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date | null>(null);
  const [scheduledTime, setScheduledTime] = useState("09:00");
  const [isDraftScheduleMode, setIsDraftScheduleMode] = useState(false);

  // Pinterest options modal
  const [showPinterestOptions, setShowPinterestOptions] = useState(false);
  
  // Save dropdown state
  const [showSaveDropdown, setShowSaveDropdown] = useState(false);

  // Per-network customization
  const [customizePerNetwork, setCustomizePerNetwork] = useState(false);
  const [perPlatformContent, setPerPlatformContent] = useState<PerPlatformContent>({});

  // AI Assist Panel state
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [suggestions, setSuggestions] = useState<Array<{ id: string; title?: string; content: string }>>([]);
  const [showMediaModal, setShowMediaModal] = useState(false);
  
  // Content Type modal state
  const [showContentTypeModal, setShowContentTypeModal] = useState(false);

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
  // Draft content = status is "draft" (scheduled but not yet set to post)
  const isDraftContent = existingItem?.status === "draft";
  
  // Check social connections - always use production Pinterest
  const { data: pinterestConnection } = useQuery({
    queryKey: ["pinterest-connection", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("social_connections")
        .select("id, account_name, platform")
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
      } else {
        setScheduledDate(null);
        setScheduledTime("09:00");
      }
      setCurrentDraftId(null);
      setCustomizePerNetwork(false);
      setPerPlatformContent({});
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
        setScheduledDate(null);
        setCustomizePerNetwork(false);
        setPerPlatformContent({});
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
        setScheduledDate(null);
        setCustomizePerNetwork(false);
        setPerPlatformContent({});
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
      setScheduledDate(null);
      setCustomizePerNetwork(false);
      setPerPlatformContent({});
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
        // Add to suggestions list for the AI panel
        const newSuggestion = {
          id: crypto.randomUUID(),
          title: data.title || undefined,
          content: data.draft,
        };
        setSuggestions((prev) => [newSuggestion, ...prev]);
        setHasGeneratedIdea(true);
      }
    } catch (error) {
      console.error("Error generating idea:", error);
      toast.error("Failed to generate content");
    } finally {
      setGeneratingIdea(false);
    }
  };

  // Handler for copying suggestion to content area
  const handleCopySuggestion = (suggestionContent: string, suggestionTitle?: string) => {
    setContent(suggestionContent);
    if (suggestionTitle) {
      setTitle(suggestionTitle);
    }
    navigator.clipboard.writeText(suggestionContent);
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
      
      // Get thread posts from per-platform content if customizing per network
      const threadsContent = perPlatformContent["threads"];
      const threadPosts = threadsContent?.threadPosts || [];
      
      const response = await supabase.functions.invoke("post-to-threads", {
        body: {
          text: content,
          mediaType: formData.media_url ? (isVideo ? "VIDEO" : "IMAGE") : "TEXT",
          imageUrl: !isVideo ? formData.media_url : undefined,
          videoUrl: isVideo ? formData.media_url : undefined,
          threadPosts: threadPosts.map((post) => ({ text: post.text })),
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

      const totalPosts = response.data?.totalPosts || 1;
      toast.success(`Posted ${totalPosts > 1 ? `thread (${totalPosts} posts)` : 'to Threads'} successfully!`);
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
      // Check if Pinterest connection exists
      if (!pinterestConnection) {
        errors.push("Please connect your Pinterest account in Settings first.");
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

  const handleSchedule = async (date?: Date, time?: string) => {
    const scheduleDate = date || scheduledDate;
    const scheduleTime = time || scheduledTime;
    
    if (!scheduleDate) {
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
      const [hours, minutes] = scheduleTime.split(":").map(Number);
      const scheduleDateTime = new Date(scheduleDate);
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

      // Update the content_planner item with all fields and set status to "scheduled"
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
          status: "scheduled",
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

  // Handler for the Draft button - opens schedule modal in draft mode
  const handleDraftClick = () => {
    setIsDraftScheduleMode(true);
    setShowScheduleModal(true);
  };

  // Handler for scheduling as draft (saves to calendar with draft status)
  const handleScheduleAsDraft = async (date: Date, time: string) => {
    if (!user) return;

    setSaving(true);
    try {
      const [hours, minutes] = time.split(":").map(Number);
      const scheduleDateTime = new Date(date);
      scheduleDateTime.setHours(hours, minutes, 0, 0);

      if (timelineItemId) {
        // Update existing timeline item with scheduled date but keep as draft
        await supabase
          .from("content_planner")
          .update({
            title: title || "Untitled post",
            content: content,
            content_type: contentType,
            status: "draft",
            scheduled_at: scheduleDateTime.toISOString(),
            media_url: formData.media_url,
            media_type: formData.media_type,
            scheduled_platforms: formData.scheduled_platforms.length > 0 ? formData.scheduled_platforms : null,
          })
          .eq("id", timelineItemId);
      } else {
        // Create new content planner item as draft with scheduled date
        const { data, error } = await supabase
          .from("content_planner")
          .insert({
            project_id: projectId,
            user_id: user.id,
            phase: slotContext?.phase || selectedPhase,
            day_number: slotContext?.dayNumber || selectedDay,
            time_of_day: slotContext?.timeOfDay || "morning",
            title: title || "Untitled post",
            description: "",
            content_type: contentType,
            content: content || null,
            status: "draft",
            scheduled_at: scheduleDateTime.toISOString(),
            media_url: formData.media_url,
            media_type: formData.media_type,
            scheduled_platforms: formData.scheduled_platforms.length > 0 ? formData.scheduled_platforms : null,
          })
          .select()
          .single();

        if (error) throw error;
        setTimelineItemId(data.id);
      }

      toast.success("Draft saved to calendar");
      queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving draft to calendar:", error);
      toast.error("Failed to save draft");
    } finally {
      setSaving(false);
      setIsDraftScheduleMode(false);
    }
  };

  // Handler for save button (saves without closing)
  const handleSaveOnly = async () => {
    if (!user || !content.trim()) return;

    setSaving(true);
    try {
      if (timelineItemId) {
        await supabase
          .from("content_planner")
          .update({
            title: title || "Untitled post",
            content: content,
            content_type: contentType,
            media_url: formData.media_url,
            media_type: formData.media_type,
            scheduled_platforms: formData.scheduled_platforms.length > 0 ? formData.scheduled_platforms : null,
          })
          .eq("id", timelineItemId);
        toast.success("Saved");
      } else if (slotContext) {
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
        toast.success("Saved");
      } else if (currentDraftId) {
        await supabase
          .from("content_drafts")
          .update({
            title: title || "Untitled draft",
            content: content,
            content_type: contentType,
          })
          .eq("id", currentDraftId);
        toast.success("Saved");
      } else {
        const { data, error } = await supabase
          .from("content_drafts")
          .insert({
            project_id: projectId,
            user_id: user.id,
            title: title || "Untitled draft",
            content: content,
            content_type: contentType,
            phase: currentPhase,
            funnel_type: funnelType,
          })
          .select()
          .single();

        if (error) throw error;
        setCurrentDraftId(data.id);
        toast.success("Saved");
      }

      queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
      queryClient.invalidateQueries({ queryKey: ["content-drafts", projectId] });
      queryClient.invalidateQueries({ queryKey: ["saved-content-counts", projectId] });
      onSaved?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save");
    } finally {
      setSaving(false);
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
        className="w-[98vw] max-w-[1600px] p-0 flex flex-col"
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
          <div className="flex-1 min-w-[400px] overflow-y-auto px-6 py-4 space-y-5">
            {generating ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">
                  Creating your draft...
                </span>
              </div>
            ) : (
              <>
                {/* Platform Selector Section - moved to top */}
                {!isPostedContent && (
                <div className="space-y-3">
                  <Label className="text-xs font-medium">Post To</Label>
                  <PlatformSelector
                    selected={formData.scheduled_platforms}
                    onChange={(platforms) => {
                      setFormData((prev) => ({
                        ...prev,
                        scheduled_platforms: platforms,
                      }));
                    }}
                    connections={allConnections}
                    warnings={
                      formData.scheduled_platforms.includes("pinterest") && !formData.pinterest_board_id
                        ? { pinterest: "Board required" }
                        : {}
                    }
                    onSettingsClick={(platformId) => {
                      if (platformId === "pinterest") {
                        setShowPinterestOptions(true);
                      }
                    }}
                  />

                  {/* Pinterest warning message */}
                  {formData.scheduled_platforms.includes("pinterest") && !formData.pinterest_board_id && (
                    <Alert className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800 py-2">
                      <AlertCircle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
                        Click the settings icon on Pinterest to select a board before scheduling.
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Platform-specific options - directly below Post To */}
                  {formData.scheduled_platforms.length > 0 && (
                    <div className="space-y-3 pt-2">
                      {/* Instagram Post Type Selector - only when Instagram is the ONLY platform */}
                      {formData.scheduled_platforms.includes("instagram") &&
                        formData.scheduled_platforms.length === 1 &&
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

                      {/* Auto-determine info for Instagram when multi-platform - now shown in Instagram card */}

                      {/* TikTok Post Options - hidden for cleaner UI */}
                    </div>
                  )}
                </div>
                )}

                {/* Main Title & Content - show when NOT customizing per network OR when 0-1 platforms selected */}
                {(!customizePerNetwork || formData.scheduled_platforms.length <= 1) && (
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
                      <div className="relative flex flex-col">
                        <Textarea
                          value={content}
                          onChange={(e) => {
                            setContent(e.target.value);
                            // Auto-resize
                            const target = e.target as HTMLTextAreaElement;
                            target.style.height = 'auto';
                            target.style.height = `${Math.max(250, target.scrollHeight)}px`;
                          }}
                          placeholder="Your content will appear here..."
                          className="min-h-[250px] resize-none overflow-hidden"
                          disabled={isPostedContent}
                          readOnly={isPostedContent}
                          style={{ height: 'auto' }}
                        />
                        {/* AI Assist Badge - in its own row at bottom */}
                        {!isPostedContent && (
                          <div className="flex justify-end mt-2">
                            <button
                              type="button"
                              onClick={() => setShowAIPanel(true)}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-medium transition-colors"
                            >
                              <Sparkles className="w-3 h-3" />
                              AI Assist
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* Per-Network Content Customization - only when 2+ platforms and customizing */}
                {!isPostedContent && formData.scheduled_platforms.length > 1 && customizePerNetwork && (
                  <PerNetworkEditor
                    selectedPlatforms={formData.scheduled_platforms}
                    enabled={customizePerNetwork}
                    perPlatformContent={perPlatformContent}
                    onPerPlatformContentChange={setPerPlatformContent}
                    defaultContent={content}
                    defaultTitle={title}
                    onOpenAIAssist={() => setShowAIPanel(true)}
                    onSelectMedia={() => setShowMediaModal(true)}
                    onPinterestSettings={() => setShowPinterestOptions(true)}
                  />
                )}

                {/* Icon Toolbar - ALWAYS visible below content/per-network section */}
                {!isPostedContent && (
                  <ContentToolbar
                    customizePerNetwork={customizePerNetwork}
                    onCustomizeToggle={() => setCustomizePerNetwork(!customizePerNetwork)}
                    showPinterestOption={formData.scheduled_platforms.includes("pinterest")}
                    onPinterestClick={() => setShowPinterestOptions(true)}
                    pinterestHasWarning={!formData.pinterest_board_id}
                    showMultiplePlatforms={formData.scheduled_platforms.length > 1}
                    onSelectMedia={() => setShowMediaModal(true)}
                    hasMedia={!!formData.media_url}
                    onContentTypeClick={() => setShowContentTypeModal(true)}
                    contentType={contentType}
                  />
                )}

                {/* Scheduled indicator if already scheduled */}
                {isAlreadyScheduled && scheduledDate && (
                  <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-primary/10 border border-primary/20">
                    <Clock className="w-4 h-4 text-primary" />
                    <span>Scheduled for {scheduledDate.toLocaleDateString()} at {scheduledTime}</span>
                  </div>
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
          <div className="w-[420px] border-l bg-muted/30 p-6 overflow-y-auto flex flex-col">
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

          {/* Third Column - AI Assist Panel */}
          <AIAssistPanel
            open={showAIPanel}
            onClose={() => setShowAIPanel(false)}
            contentType={contentType}
            onContentTypeChange={setContentType}
            onGenerate={handleGenerateIdea}
            onToneAdjust={adjustTone}
            suggestions={suggestions}
            isGenerating={generatingIdea}
            isAdjusting={adjusting}
            currentContent={content}
            onCopySuggestion={handleCopySuggestion}
          />
        </div>

        {/* Footer */}
        <SheetFooter className="px-6 py-4 border-t shrink-0 flex justify-between">
          <div className="flex gap-2">
            {!isPostedContent && (
              <>
                {/* Trash - only for existing items */}
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
                {/* Draft button */}
                <Button
                  variant="outline"
                  onClick={handleDraftClick}
                  disabled={!content.trim() || saving}
                >
                  {saving && isDraftScheduleMode && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Draft
                </Button>
              </>
            )}
          </div>
          {!isPostedContent && (
            <div className="flex gap-2">
              {/* Post Now */}
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
              {/* Schedule with dropdown - show "Schedule" for drafts, "Reschedule" only for already scheduled non-draft posts */}
              <div className="flex">
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsDraftScheduleMode(false);
                    setShowScheduleModal(true);
                  }}
                  disabled={!formData.scheduled_platforms.length}
                  className="rounded-r-none border-r-0"
                >
                  <Clock className="w-4 h-4 mr-2" />
                  {isAlreadyScheduled && !isDraftContent ? "Reschedule" : "Schedule"}
                </Button>
                <DropdownMenu open={showSaveDropdown} onOpenChange={setShowSaveDropdown}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-l-none"
                      disabled={!content.trim()}
                    >
                      <ChevronUp className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem 
                      onClick={handleSaveOnly}
                      disabled={saving}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          )}
        </SheetFooter>

        {/* Pinterest Options Modal */}
        <PinterestMediaOptionsModal
          open={showPinterestOptions}
          onOpenChange={setShowPinterestOptions}
          boardId={formData.pinterest_board_id}
          onBoardChange={(boardId) =>
            setFormData((prev) => ({ ...prev, pinterest_board_id: boardId }))
          }
          linkUrl={formData.link_url}
          onLinkUrlChange={(url) =>
            setFormData((prev) => ({ ...prev, link_url: url }))
          }
        />

        {/* Media Select Modal */}
        <MediaSelectModal
          open={showMediaModal}
          onOpenChange={setShowMediaModal}
          projectId={projectId}
          mediaUrl={formData.media_url}
          mediaType={formData.media_type}
          onMediaChange={(url, type) =>
            setFormData((prev) => ({ ...prev, media_url: url, media_type: type }))
          }
        />

        {/* Schedule Modal */}
        <ScheduleModal
          open={showScheduleModal}
          onOpenChange={(open) => {
            setShowScheduleModal(open);
            if (!open) {
              setIsDraftScheduleMode(false);
            }
          }}
          onSchedule={async (date, time) => {
            if (isDraftScheduleMode) {
              await handleScheduleAsDraft(date, time);
            } else {
              setScheduledDate(date);
              setScheduledTime(time);
              await handleSchedule(date, time);
            }
            setShowScheduleModal(false);
          }}
          isScheduling={isDraftScheduleMode ? saving : isScheduling}
          isReschedule={!isDraftScheduleMode && isAlreadyScheduled}
          initialDate={scheduledDate}
          initialTime={scheduledTime}
        />

        {/* Content Type Modal */}
        <ContentTypeModal
          open={showContentTypeModal}
          onOpenChange={setShowContentTypeModal}
          selectedContentType={contentType}
          onContentTypeChange={setContentType}
        />
      </SheetContent>
    </Sheet>
  );
}
