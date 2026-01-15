import { useState, useEffect } from "react";
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
  // Content type
  mediaType: "video" | "photo";
  
  // Title (photos only)
  title: string;
  onTitleChange: (value: string) => void;
  
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
  mediaType,
  title,
  onTitleChange,
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
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  // Update privacy to SELF_ONLY if sandbox and current value isn't valid
  useEffect(() => {
    if (creatorInfo?.is_sandbox && privacyLevel !== "SELF_ONLY") {
      onPrivacyChange("SELF_ONLY");
    }
  }, [creatorInfo?.is_sandbox, privacyLevel, onPrivacyChange]);

  // Enforce branded content privacy restriction
  useEffect(() => {
    if (isBrandedContent && privacyLevel === "SELF_ONLY") {
      // Auto-switch to PUBLIC if branded content is selected with private visibility
      onPrivacyChange("PUBLIC_TO_EVERYONE");
    }
  }, [isBrandedContent, privacyLevel, onPrivacyChange]);

  // Get the label feedback text
  const getLabelFeedback = () => {
    if (!discloseContent) return null;
    if (isBrandedContent) return "Paid partnership";
    if (isBrandOrganic) return "Promotional content";
    return null;
  };

  const labelFeedback = getLabelFeedback();

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
        <span className="text-sm">Failed to load TikTok account info</span>
      </div>
    );
  }

  const isSandbox = creatorInfo.is_sandbox;

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
            {isSandbox && (
              <Badge variant="secondary" className="text-xs gap-1">
                <FlaskConical className="w-3 h-3" />
                Sandbox
              </Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground">@{creatorInfo.creator_username}</span>
        </div>
      </div>

      {/* Title field - Photos only */}
      {isPhoto && (
        <div className="space-y-1.5">
          <Label className="text-sm">
            Add a title <span className="text-destructive">*</span>
          </Label>
          <Input
            value={title}
            onChange={(e) => onTitleChange(e.target.value.slice(0, 90))}
            placeholder="Enter title (required for photos)"
            maxLength={90}
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground text-right">{title.length}/90</p>
        </div>
      )}

      {/* Privacy Selector */}
      <TikTokPrivacySelector
        value={privacyLevel}
        onChange={onPrivacyChange}
        privacyOptions={creatorInfo.privacy_level_options}
        isSandbox={isSandbox}
        isBrandedContent={isBrandedContent}
        disabled={disabled}
      />

      {/* Interaction Controls - inline checkboxes */}
      <div className="space-y-2">
        <Label className="text-sm">Allow users to</Label>
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

      {/* Commercial Content Disclosure - Only for production */}
      {!isSandbox && (
        <div className="space-y-3 pt-2 border-t">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Label className="text-sm font-medium">Disclose post content</Label>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Info className="w-4 h-4 text-muted-foreground" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p>Turn this on to disclose that this content promotes goods or services in exchange for something of value. Your video will receive a disclosure label.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Switch
              checked={discloseContent}
              onCheckedChange={onDiscloseContentChange}
              disabled={disabled}
            />
          </div>

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
                  <p>TikTok will automatically add trending music to your photo post.</p>
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
        {isBrandedContent && (
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
