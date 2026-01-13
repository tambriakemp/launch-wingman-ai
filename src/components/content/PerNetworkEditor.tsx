import { useState } from "react";
import { ChevronDown, ChevronUp, Instagram, Facebook } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PLATFORMS, getPlatformById } from "./platformConfigs";

// Custom icons for platforms not in Lucide
const PinterestIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
  </svg>
);

const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 192 192" fill="currentColor" className={className}>
    <path d="M141.537 88.988a66.667 66.667 0 0 0-2.518-1.143c-1.482-27.307-16.403-42.94-41.457-43.1h-.34c-14.986 0-27.449 6.396-35.12 18.036l13.779 9.452c5.73-8.695 14.724-10.548 21.348-10.548h.229c8.249.053 14.474 2.452 18.503 7.129 2.932 3.405 4.893 8.111 5.864 14.05-7.314-1.243-15.224-1.626-23.68-1.14-23.82 1.371-39.134 15.265-38.105 34.568.522 9.792 5.4 18.216 13.735 23.719 7.047 4.652 16.124 6.927 25.557 6.412 12.458-.68 22.231-5.436 29.049-14.127 5.178-6.6 8.453-15.153 9.899-25.93 5.937 3.583 10.337 8.298 12.767 13.966 4.132 9.635 4.373 25.468-8.546 38.376-11.319 11.308-24.925 16.2-45.488 16.351-22.809-.169-40.06-7.484-51.275-21.742C35.236 139.966 29.808 120.682 29.605 96c.203-24.682 5.63-43.966 16.133-57.317C56.954 24.425 74.204 17.11 97.014 16.94c23.001.173 40.574 7.576 52.232 22.005 5.565 6.882 9.746 15.087 12.508 24.382l15.015-4.065c-3.271-11.017-8.327-20.907-15.171-29.362C146.97 11.794 125.597 3.146 97.064 2.94h-.085c-28.464.207-49.72 8.87-63.196 25.762-12.73 15.962-19.265 38.05-19.482 65.704v1.187c.217 27.654 6.752 49.742 19.482 65.704 13.475 16.892 34.732 25.555 63.196 25.763h.085c24.346-.163 41.608-6.497 55.918-20.531 18.79-18.418 18.362-41.087 12.118-55.65-4.481-10.45-12.896-18.99-24.563-25.091Zm-64.768 44.538c-10.455.57-21.327-4.108-21.872-14.329-.408-7.65 5.41-16.186 25.16-17.323 2.2-.127 4.35-.19 6.451-.19 6.274 0 12.15.513 17.519 1.493-1.994 24.134-15.667 29.764-27.258 30.349Z" />
  </svg>
);

const getIconComponent = (platformId: string) => {
  switch (platformId) {
    case "instagram":
      return Instagram;
    case "facebook":
      return Facebook;
    case "pinterest":
      return PinterestIcon;
    case "tiktok":
      return TikTokIcon;
    case "threads":
      return ThreadsIcon;
    default:
      return null;
  }
};

export interface PerPlatformContent {
  [platformId: string]: {
    title?: string;
    content: string;
  };
}

interface PerNetworkEditorProps {
  selectedPlatforms: string[];
  defaultTitle: string;
  defaultContent: string;
  perPlatformContent: PerPlatformContent;
  onPerPlatformContentChange: (content: PerPlatformContent) => void;
  enabled: boolean;
}

export function PerNetworkEditor({
  selectedPlatforms,
  defaultTitle,
  defaultContent,
  perPlatformContent,
  onPerPlatformContentChange,
  enabled,
}: PerNetworkEditorProps) {
  const [expandedPlatforms, setExpandedPlatforms] = useState<string[]>(selectedPlatforms);

  const toggleExpanded = (platformId: string) => {
    setExpandedPlatforms((prev) =>
      prev.includes(platformId)
        ? prev.filter((id) => id !== platformId)
        : [...prev, platformId]
    );
  };

  const handleContentChange = (platformId: string, field: "title" | "content", value: string) => {
    const currentPlatformContent = perPlatformContent[platformId] || {
      title: defaultTitle,
      content: defaultContent,
    };
    
    onPerPlatformContentChange({
      ...perPlatformContent,
      [platformId]: {
        ...currentPlatformContent,
        [field]: value,
      },
    });
  };

  const getPlatformContent = (platformId: string) => {
    return perPlatformContent[platformId] || {
      title: defaultTitle,
      content: defaultContent,
    };
  };

  const getCharacterLimit = (platformId: string) => {
    const platform = getPlatformById(platformId);
    return platform?.maxCaptionLength || 2200;
  };

  // Don't render anything if not enabled
  if (!enabled || selectedPlatforms.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      <Label className="text-xs font-medium text-muted-foreground">Per-Network Content</Label>
      {selectedPlatforms.map((platformId) => {
        const platform = getPlatformById(platformId);
        if (!platform) return null;

        const IconComponent = getIconComponent(platformId);
        const isExpanded = expandedPlatforms.includes(platformId);
        const platformContent = getPlatformContent(platformId);
        const charLimit = getCharacterLimit(platformId);
        const showTitle = platformId === "pinterest";

        return (
          <div
            key={platformId}
            className="border rounded-lg overflow-hidden"
          >
            {/* Platform Header */}
            <button
              type="button"
              onClick={() => toggleExpanded(platformId)}
              className="w-full flex items-center justify-between p-3 bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white"
                  style={{ backgroundColor: platform.color }}
                >
                  {IconComponent && <IconComponent className="w-4 h-4" />}
                </div>
                <span className="font-medium text-sm">{platform.name}</span>
              </div>
              {isExpanded ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {/* Platform Editor */}
            {isExpanded && (
              <div className="p-4 space-y-3">
                {/* Title (Pinterest only) */}
                {showTitle && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Pin Title</Label>
                    <Input
                      value={platformContent.title || ""}
                      onChange={(e) =>
                        handleContentChange(platformId, "title", e.target.value)
                      }
                      placeholder="Enter pin title..."
                      maxLength={100}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {(platformContent.title || "").length} / 100
                    </p>
                  </div>
                )}

                {/* Content */}
                <div className="space-y-1.5">
                  <Label className="text-xs">
                    {platformId === "pinterest" ? "Description" : "Caption"}
                  </Label>
                  <Textarea
                    value={platformContent.content}
                    onChange={(e) =>
                      handleContentChange(platformId, "content", e.target.value)
                    }
                    placeholder={`Write your ${platform.name} ${
                      platformId === "pinterest" ? "description" : "caption"
                    }...`}
                    className="min-h-[100px] resize-none"
                    maxLength={charLimit}
                  />
                  <p
                    className={cn(
                      "text-xs text-right",
                      platformContent.content.length > charLimit * 0.9
                        ? "text-amber-600"
                        : "text-muted-foreground"
                    )}
                  >
                    {platformContent.content.length} / {charLimit}
                  </p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
