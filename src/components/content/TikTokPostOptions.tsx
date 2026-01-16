import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Loader2, AlertCircle, Video, FlaskConical, Info, ExternalLink } from "lucide-react";
import { TikTokPrivacySelector } from "./TikTokPrivacySelector";

interface TikTokCreatorInfo {
  is_sandbox: boolean;
  creator_avatar_url: string | null;
  creator_username: string;
  creator_nickname: string;
  privacy_level_options: string[];
  comment_disabled: boolean;
  duet_disabled: boolean;
  stitch_disabled: boolean;
  max_video_post_duration_sec: number;
  message?: string;
}

interface TikTokPostOptionsProps {
  // Connection status - must be passed from parent
  hasConnection: boolean;
  
  // Content type
  mediaType: "video" | "photo";
  
  // Whether media has been uploaded (controls visibility of options)
  hasMedia: boolean;
  
  // Privacy
  privacyLevel: string;
  onPrivacyChange: (value: string) => void;
  
  // Interaction controls
  allowComment: boolean;
  onAllowCommentChange: (checked: boolean) => void;
  allowDuet: boolean;
  onAllowDuetChange: (checked: boolean) => void;
  allowStitch: boolean;
  onAllowStitchChange: (checked: boolean) => void;
  
  // Content disclosure
  discloseContent: boolean;
  onDiscloseContentChange: (checked: boolean) => void;
  isBrandOrganic: boolean;
  onBrandOrganicChange: (checked: boolean) => void;
  isBrandedContent: boolean;
  onBrandedContentChange: (checked: boolean) => void;
  
  // Auto music (photos only)
  autoAddMusic: boolean;
  onAutoAddMusicChange: (checked: boolean) => void;
  
  disabled?: boolean;
}

export function TikTokPostOptions({
  hasConnection,
  mediaType,
  hasMedia,
  privacyLevel,
  onPrivacyChange,
  allowComment,
  onAllowCommentChange,
  allowDuet,
  onAllowDuetChange,
  allowStitch,
  onAllowStitchChange,
  discloseContent,
  onDiscloseContentChange,
  isBrandOrganic,
  onBrandOrganicChange,
  isBrandedContent,
  onBrandedContentChange,
  autoAddMusic,
  onAutoAddMusicChange,
  disabled = false,
}: TikTokPostOptionsProps) {
  const { user } = useAuth();
  const isPhoto = mediaType === "photo";
  
  // Effective branded content status - only active when discloseContent is also true
  const effectiveBrandedContent = discloseContent && isBrandedContent;

  const { data: creatorInfo, isLoading, error } = useQuery<TikTokCreatorInfo>({
    queryKey: ["tiktok-creator-info", user?.id],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await supabase.functions.invoke("tiktok-creator-info", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.error) {
        throw new Error(response.data?.error || response.error.message);
      }

      return response.data;
    },
    // Only fetch when user exists AND connection exists
    enabled: !!user && hasConnection,
    staleTime: 5 * 60 * 1000,
    retry: 1, // Don't retry too many times on auth errors
  });

  // Update privacy to SELF_ONLY if sandbox and current value isn't valid
  useEffect(() => {
    if (creatorInfo?.is_sandbox && privacyLevel !== "SELF_ONLY") {
      onPrivacyChange("SELF_ONLY");
    }
  }, [creatorInfo?.is_sandbox, privacyLevel, onPrivacyChange]);

  // Enforce branded content privacy restriction - only when disclosure is enabled
  useEffect(() => {
    if (effectiveBrandedContent && privacyLevel === "SELF_ONLY") {
      // Auto-switch to PUBLIC if branded content is selected with private visibility
      onPrivacyChange("PUBLIC_TO_EVERYONE");
    }
  }, [effectiveBrandedContent, privacyLevel, onPrivacyChange]);

  // Get the label feedback text
  const getLabelFeedback = () => {
    if (!discloseContent) return null;
    if (isBrandedContent) return "Paid partnership";
    if (isBrandOrganic) return "Promotional content";
    return null;
  };

  const labelFeedback = getLabelFeedback();

  // Show "not connected" state if no connection
  if (!hasConnection) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-lg border bg-muted/30">
        <AlertCircle className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Please connect your TikTok account in Settings to post.</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-lg border bg-muted/30">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading TikTok account info...</span>
      </div>
    );
  }

  if (error || !creatorInfo) {
    return (
      <div className="flex items-center gap-2 p-4 rounded-lg border bg-destructive/10 text-destructive">
        <AlertCircle className="w-4 h-4" />
        <span className="text-sm">Failed to load TikTok account info. Please try reconnecting in Settings.</span>
      </div>
    );
  }

  // Check if sandbox OR unaudited (only SELF_ONLY privacy available)
  const isSandbox = creatorInfo.is_sandbox;
  const isUnaudited = !isSandbox && 
    creatorInfo.privacy_level_options.length === 1 && 
    creatorInfo.privacy_level_options[0] === "SELF_ONLY";
  const requiresPrivateOnly = isSandbox || isUnaudited;

  // If no media uploaded yet, don't render TikTok options at all
  if (!hasMedia) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-4">
      {/* Creator Info Display */}
      <div className="flex items-center gap-3 pb-3 border-b">
        <Avatar className="h-10 w-10">
          <AvatarImage src={creatorInfo.creator_avatar_url || undefined} />
          <AvatarFallback>
            <Video className="w-5 h-5" />
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{creatorInfo.creator_nickname}</span>
            {requiresPrivateOnly && (
              <Badge variant="secondary" className="text-xs gap-1">
                <FlaskConical className="w-3 h-3" />
                {isSandbox ? "Sandbox" : "Unaudited"}
              </Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground">@{creatorInfo.creator_username}</span>
        </div>
      </div>

      {/* Privacy Selector */}
      <TikTokPrivacySelector
        value={privacyLevel}
        onChange={onPrivacyChange}
        privacyOptions={creatorInfo.privacy_level_options}
        isSandbox={requiresPrivateOnly}
        isBrandedContent={effectiveBrandedContent}
        disabled={disabled}
      />

      {/* Interaction Controls - inline checkboxes */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Label className="text-sm">Allow users to</Label>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Your privacy settings on the TikTok mobile app will control who can comment on, duet, or stitch your post.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <Checkbox
              id="allow-comment"
              checked={allowComment}
              onCheckedChange={(checked) => onAllowCommentChange(checked === true)}
              disabled={disabled || creatorInfo.comment_disabled}
            />
            <label
              htmlFor="allow-comment"
              className={`text-sm cursor-pointer ${creatorInfo.comment_disabled ? "text-muted-foreground line-through" : ""}`}
            >
              Comment
            </label>
          </div>
          
          {/* Duet/Stitch - only for videos */}
          {!isPhoto && (
            <>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="allow-duet"
                  checked={allowDuet}
                  onCheckedChange={(checked) => onAllowDuetChange(checked === true)}
                  disabled={disabled || creatorInfo.duet_disabled}
                />
                <label
                  htmlFor="allow-duet"
                  className={`text-sm cursor-pointer ${creatorInfo.duet_disabled ? "text-muted-foreground line-through" : ""}`}
                >
                  Duet
                </label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="allow-stitch"
                  checked={allowStitch}
                  onCheckedChange={(checked) => onAllowStitchChange(checked === true)}
                  disabled={disabled || creatorInfo.stitch_disabled}
                />
                <label
                  htmlFor="allow-stitch"
                  className={`text-sm cursor-pointer ${creatorInfo.stitch_disabled ? "text-muted-foreground line-through" : ""}`}
                >
                  Stitch
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Commercial Content Disclosure - Only for production, disabled for private posts */}
      {!isSandbox && (
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className={cn(
                "text-sm font-medium",
                privacyLevel === "SELF_ONLY" && "text-muted-foreground"
              )}>Disclose post content</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Turn on to disclose that this post promotes goods or services in exchange for something of value. Your post could promote yourself, a third party, or both. Keep in mind that the visibility of the branded content cannot be private.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch
              checked={privacyLevel === "SELF_ONLY" ? false : discloseContent}
              onCheckedChange={onDiscloseContentChange}
              disabled={disabled || privacyLevel === "SELF_ONLY"}
            />
          </div>
          
          {/* Helper message when privacy is Only Me */}
          {privacyLevel === "SELF_ONLY" && (
            <p className="text-xs text-muted-foreground">
              Content disclosure is not available for private posts. Change visibility to enable this option.
            </p>
          )}

          {/* Sub-options when disclosure is enabled */}
          {discloseContent && (
            <div className="ml-4 space-y-3 pl-4 border-l-2 border-muted">
              {/* Your Brand option */}
              <div className="flex items-start gap-2">
                <Checkbox
                  id="brand-organic"
                  checked={isBrandOrganic}
                  onCheckedChange={(checked) => onBrandOrganicChange(checked === true)}
                  disabled={disabled}
                  className="mt-0.5"
                />
                <div className="grid gap-0.5 leading-none">
                  <label
                    htmlFor="brand-organic"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Your brand
                  </label>
                  <p className="text-xs text-muted-foreground">
                    You are promoting yourself or your own business
                  </p>
                </div>
              </div>

              {/* Branded Content option */}
              <div className="flex items-start gap-2">
                <Checkbox
                  id="brand-content"
                  checked={isBrandedContent}
                  onCheckedChange={(checked) => onBrandedContentChange(checked === true)}
                  disabled={disabled}
                  className="mt-0.5"
                />
                <div className="grid gap-0.5 leading-none">
                  <label
                    htmlFor="brand-content"
                    className="text-sm font-normal cursor-pointer"
                  >
                    Branded content
                  </label>
                  <p className="text-xs text-muted-foreground">
                    You are promoting another brand or a third party
                  </p>
                </div>
              </div>

              {/* Label Feedback */}
              {labelFeedback && (
                <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                  <span className="text-xs text-muted-foreground">
                    Your video will be labeled: <strong>"{labelFeedback}"</strong>
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Auto Add Music - Photos only */}
      {isPhoto && (
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2">
            <Label className="text-sm font-medium">Add recommended music from TikTok</Label>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Info className="w-4 h-4 text-muted-foreground" />
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p>Turning on recommended music will automatically assign music to your photos. Note that you can change the photo music on TikTok if you prefer other music.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          <Switch
            checked={autoAddMusic}
            onCheckedChange={onAutoAddMusicChange}
            disabled={disabled}
          />
        </div>
      )}

      {/* Legal Declarations */}
      <div className="pt-3 border-t space-y-1">
        <p className="text-xs text-muted-foreground">
          By posting, you agree to TikTok's{" "}
          <a
            href="https://www.tiktok.com/legal/music-usage-confirmation"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline inline-flex items-center gap-0.5"
          >
            Music Usage Confirmation
            <ExternalLink className="w-3 h-3" />
          </a>
        </p>
        {effectiveBrandedContent && (
          <p className="text-xs text-muted-foreground">
            and{" "}
            <a
              href="https://www.tiktok.com/legal/bc-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-0.5"
            >
              Branded Content Policy
              <ExternalLink className="w-3 h-3" />
            </a>
          </p>
        )}
      </div>
    </div>
  );
}
