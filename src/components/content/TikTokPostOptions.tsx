import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Loader2, AlertCircle, Video, FlaskConical } from "lucide-react";
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
  privacyLevel: string;
  onPrivacyChange: (value: string) => void;
  brandContentToggle: boolean;
  onBrandContentChange: (checked: boolean) => void;
  brandOrganicToggle: boolean;
  onBrandOrganicChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function TikTokPostOptions({
  privacyLevel,
  onPrivacyChange,
  brandContentToggle,
  onBrandContentChange,
  brandOrganicToggle,
  onBrandOrganicChange,
  disabled = false,
}: TikTokPostOptionsProps) {
  const { user } = useAuth();

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
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Update privacy to SELF_ONLY if sandbox and current value isn't valid
  useEffect(() => {
    if (creatorInfo?.is_sandbox && privacyLevel !== "SELF_ONLY") {
      onPrivacyChange("SELF_ONLY");
    }
  }, [creatorInfo?.is_sandbox, privacyLevel, onPrivacyChange]);

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
    <div className="space-y-4">
      {/* Creator Info Display */}
      <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
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
              <Badge variant="secondary" className="flex items-center gap-1 text-xs shrink-0">
                <FlaskConical className="w-3 h-3" />
                Sandbox
              </Badge>
            )}
          </div>
          <span className="text-sm text-muted-foreground">@{creatorInfo.creator_username}</span>
        </div>
      </div>

      {/* Sandbox Notice */}
      {isSandbox && creatorInfo.message && (
        <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm">
          {creatorInfo.message}
        </div>
      )}

      {/* Disabled Features Warning */}
      {(creatorInfo.comment_disabled || creatorInfo.duet_disabled || creatorInfo.stitch_disabled) && (
        <div className="flex flex-wrap gap-2">
          {creatorInfo.comment_disabled && (
            <Badge variant="outline" className="text-xs">Comments Disabled</Badge>
          )}
          {creatorInfo.duet_disabled && (
            <Badge variant="outline" className="text-xs">Duet Disabled</Badge>
          )}
          {creatorInfo.stitch_disabled && (
            <Badge variant="outline" className="text-xs">Stitch Disabled</Badge>
          )}
        </div>
      )}

      {/* Privacy Selector */}
      <TikTokPrivacySelector
        value={privacyLevel}
        onChange={onPrivacyChange}
        privacyOptions={creatorInfo.privacy_level_options}
        isSandbox={isSandbox}
        disabled={disabled}
      />

      {/* Brand Content Toggles - Only show for production */}
      {!isSandbox && (
        <div className="space-y-3 pt-2 border-t">
          <Label className="text-sm font-medium">Brand & Promotion</Label>
          
          <div className="flex items-start gap-2">
            <Checkbox
              id="brand-content"
              checked={brandContentToggle}
              onCheckedChange={(checked) => onBrandContentChange(checked === true)}
              disabled={disabled}
            />
            <div className="grid gap-0.5 leading-none">
              <label
                htmlFor="brand-content"
                className="text-sm font-normal cursor-pointer"
              >
                This is a paid partnership
              </label>
              <p className="text-xs text-muted-foreground">
                Turn on if you're paid to promote a brand or product
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="brand-organic"
              checked={brandOrganicToggle}
              onCheckedChange={(checked) => onBrandOrganicChange(checked === true)}
              disabled={disabled}
            />
            <div className="grid gap-0.5 leading-none">
              <label
                htmlFor="brand-organic"
                className="text-sm font-normal cursor-pointer"
              >
                This promotes my own business
              </label>
              <p className="text-xs text-muted-foreground">
                Turn on if you're promoting your own products or services
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
