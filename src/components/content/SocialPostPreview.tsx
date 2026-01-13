import { useState, useEffect } from "react";
import { Instagram, Facebook, User, Heart, MessageCircle, Send, Bookmark, Grid3X3, Film } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPlatformById } from "./platformConfigs";

interface SocialPostPreviewProps {
  platforms: string[];
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  linkUrl?: string;
  title?: string;
}

type InstagramPostType = "feed" | "reel";

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
    default:
      return null;
  }
};

function PhoneFrame({ children, platform, isVertical }: { children: React.ReactNode; platform: string; isVertical?: boolean }) {
  const platformConfig = getPlatformById(platform);
  const IconComponent = getIconComponent(platform);

  return (
    <div className="relative mx-auto w-[320px]">
      {/* Phone frame - realistic device look */}
      <div className="relative bg-black border-[8px] border-foreground/30 rounded-[40px] overflow-hidden shadow-2xl">
        {/* Notch / Dynamic Island */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20" />
        
        {/* Status bar */}
        <div
          className="h-10 flex items-end justify-between px-6 pb-1 text-white text-xs relative z-10"
          style={{ backgroundColor: platformConfig?.color || "#000" }}
        >
          <span className="font-medium">9:41</span>
          <div className="flex items-center gap-1.5">
            {IconComponent && <IconComponent className="w-4 h-4" />}
            <span className="font-semibold">{platformConfig?.name}</span>
          </div>
        </div>

        {/* Content area - explicit height for absolute-positioned children */}
        <div className={cn(
          "bg-card overflow-hidden",
          isVertical ? "h-[560px]" : "h-[520px]"
        )}>
          {children}
        </div>

        {/* Home indicator */}
        <div className="h-8 flex items-center justify-center bg-card">
          <div className="w-28 h-1.5 bg-foreground/30 rounded-full" />
        </div>
      </div>
    </div>
  );
}

// Instagram Post Type Toggle
function InstagramPostTypeToggle({ 
  postType, 
  onPostTypeChange 
}: { 
  postType: InstagramPostType; 
  onPostTypeChange: (type: InstagramPostType) => void;
}) {
  return (
    <div className="flex items-center justify-center gap-2 mb-3">
      <button
        type="button"
        onClick={() => onPostTypeChange("feed")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
          postType === "feed" 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
      >
        <Grid3X3 className="w-4 h-4" />
        Feed
      </button>
      <button
        type="button"
        onClick={() => onPostTypeChange("reel")}
        className={cn(
          "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
          postType === "reel" 
            ? "bg-primary text-primary-foreground" 
            : "bg-muted text-muted-foreground hover:bg-muted/80"
        )}
      >
        <Film className="w-4 h-4" />
        Reel
      </button>
    </div>
  );
}

function InstagramFeedPreview({ content, mediaUrl, mediaType }: { content: string; mediaUrl: string | null; mediaType: string | null }) {
  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center gap-2.5 p-3 border-b border-gray-200">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center">
          <User className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-gray-900">your_account</span>
      </div>

      {/* Media - 1:1 aspect ratio for feed */}
      <div className="relative aspect-square">
        {mediaUrl ? (
          mediaType === "video" ? (
            <video 
              key={mediaUrl}
              src={mediaUrl} 
              className="w-full h-full object-cover" 
              muted 
              loop
              autoPlay
              playsInline
            />
          ) : (
            <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
          )
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center">
            <span className="text-sm text-gray-400">No media</span>
          </div>
        )}
      </div>

      {/* Action icons bar */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-white">
        <div className="flex items-center gap-4">
          <Heart className="w-6 h-6 text-gray-900" strokeWidth={1.5} />
          <MessageCircle className="w-6 h-6 text-gray-900" strokeWidth={1.5} />
          <Send className="w-6 h-6 text-gray-900" strokeWidth={1.5} />
        </div>
        <Bookmark className="w-6 h-6 text-gray-900" strokeWidth={1.5} />
      </div>

      {/* Likes and caption */}
      <div className="px-3 pb-3 bg-white flex-1">
        <p className="text-sm text-gray-900 font-semibold mb-1">1,234 likes</p>
        <p className="text-sm text-gray-900 line-clamp-3">
          <span className="font-semibold">your_account</span>{" "}
          {content || "Your caption here..."}
        </p>
      </div>
    </div>
  );
}

function InstagramReelPreview({ content, mediaUrl, mediaType }: { content: string; mediaUrl: string | null; mediaType: string | null }) {
  return (
    <div className="flex flex-col h-full bg-black relative">
      {/* Full-screen media for reels */}
      <div className="absolute inset-0">
        {mediaUrl ? (
          mediaType === "video" ? (
            <video 
              key={mediaUrl}
              src={mediaUrl} 
              className="w-full h-full object-cover" 
              muted 
              loop
              autoPlay
              playsInline
            />
          ) : (
            <img src={mediaUrl} alt="" className="w-full h-full object-cover" />
          )
        ) : (
          <div className="w-full h-full bg-gray-900 flex items-center justify-center">
            <span className="text-sm text-gray-500">No media</span>
          </div>
        )}
      </div>

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

      {/* Side actions */}
      <div className="absolute right-3 bottom-24 flex flex-col gap-4">
        <div className="flex flex-col items-center">
          <Heart className="w-7 h-7 text-white" strokeWidth={1.5} />
          <span className="text-xs text-white mt-1">17.3K</span>
        </div>
        <div className="flex flex-col items-center">
          <MessageCircle className="w-7 h-7 text-white" strokeWidth={1.5} />
          <span className="text-xs text-white mt-1">1126</span>
        </div>
        <div className="flex flex-col items-center">
          <Send className="w-7 h-7 text-white" strokeWidth={1.5} />
          <span className="text-xs text-white mt-1">568</span>
        </div>
        <div className="flex flex-col items-center">
          <Bookmark className="w-7 h-7 text-white" strokeWidth={1.5} />
        </div>
        {/* Spinning record */}
        <div className="w-8 h-8 rounded-lg border-2 border-white/50 overflow-hidden mt-2">
          <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" />
        </div>
      </div>

      {/* Caption */}
      <div className="absolute bottom-4 left-3 right-16">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center">
            <User className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">your_account</span>
          <button className="px-3 py-1 border border-white/70 rounded text-xs text-white font-medium">
            Follow
          </button>
        </div>
        <p className="text-sm text-white line-clamp-2">
          {content || "Your caption here..."}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-xs text-white/70">♫</span>
          <span className="text-xs text-white">Original audio</span>
        </div>
      </div>
    </div>
  );
}


function PinterestPreview({ content, mediaUrl, mediaType, linkUrl, title }: { content: string; mediaUrl: string | null; mediaType: string | null; linkUrl?: string; title?: string }) {
  const getHostname = (url: string) => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  const isVideo = mediaType === "video";

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Pin Image/Video */}
      {mediaUrl ? (
        <div className={cn("relative", isVideo ? "flex-1" : "")}>
          {isVideo ? (
            <video 
              key={mediaUrl}
              src={mediaUrl} 
              className="w-full h-full object-cover bg-black" 
              muted 
              loop
              autoPlay
              playsInline
            />
          ) : (
            <img src={mediaUrl} alt="" className="w-full aspect-[3/4] object-cover" />
          )}
          {linkUrl && (
            <div className="absolute bottom-3 left-3 right-3">
              <div className="bg-white/90 rounded-full px-3 py-1.5 text-sm text-gray-700 truncate flex items-center gap-2">
                <span>🔗</span>
                <span>{getHostname(linkUrl)}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full aspect-[3/4] bg-muted flex items-center justify-center">
          <span className="text-sm text-muted-foreground">Add image</span>
        </div>
      )}

      {/* Pin Title & Description */}
      <div className={cn("p-3 overflow-hidden bg-white", !isVideo && "flex-1")}>
        {title && (
          <h3 className="text-base font-bold line-clamp-1 text-gray-900 mb-1">
            {title}
          </h3>
        )}
        <p className="text-sm text-gray-600 line-clamp-2">
          {content || "Pin description..."}
        </p>
      </div>
    </div>
  );
}

function TikTokPreview({ content, mediaUrl, mediaType }: { content: string; mediaUrl: string | null; mediaType: string | null }) {
  const [videoError, setVideoError] = useState(false);

  // Reset error state when media changes
  useEffect(() => {
    setVideoError(false);
  }, [mediaUrl]);

  return (
    <div className="flex flex-col h-full bg-black relative">
      {/* Video/Image */}
      {mediaUrl ? (
        videoError ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <TikTokIcon className="w-16 h-16 text-white/50 mx-auto mb-3" />
              <span className="text-sm text-white/50">Preview unavailable</span>
              <span className="text-xs text-white/30 block mt-1">You can still post</span>
            </div>
          </div>
        ) : mediaType === "video" ? (
          <video 
            key={mediaUrl}
            src={mediaUrl} 
            className="w-full h-full object-cover absolute inset-0" 
            muted 
            loop 
            autoPlay 
            playsInline
            preload="metadata"
            onError={() => setVideoError(true)}
          />
        ) : (
          <img 
            src={mediaUrl} 
            alt="" 
            className="w-full h-full object-cover absolute inset-0" 
            onError={() => setVideoError(true)}
          />
        )
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <TikTokIcon className="w-16 h-16 text-white/50 mx-auto mb-3" />
            <span className="text-sm text-white/50">Video required</span>
          </div>
        </div>
      )}

      {/* Overlay gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />

      {/* Side actions */}
      <div className="absolute right-3 bottom-24 flex flex-col gap-4">
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Heart className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs text-white mt-1">17.3K</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs text-white mt-1">1126</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Bookmark className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs text-white mt-1">2.4K</span>
        </div>
        <div className="flex flex-col items-center">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Send className="w-6 h-6 text-white" />
          </div>
          <span className="text-xs text-white mt-1">568</span>
        </div>
        {/* Spinning record */}
        <div className="w-10 h-10 rounded-full border-2 border-white/30 overflow-hidden animate-spin" style={{ animationDuration: '3s' }}>
          <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
            <div className="w-4 h-4 bg-white/80 rounded-full" />
          </div>
        </div>
      </div>

      {/* Caption */}
      <div className="absolute bottom-4 left-3 right-16">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <span className="text-sm font-semibold text-white">@your_account</span>
          <button className="ml-2 px-4 py-1 border border-pink-500 rounded text-xs text-pink-500 font-medium bg-transparent">
            Follow
          </button>
        </div>
        <p className="text-sm text-white line-clamp-2">
          {content || "Your caption here..."}
        </p>
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-white/70">♫</span>
          <span className="text-sm text-white">Original sound - your_account</span>
        </div>
      </div>
    </div>
  );
}

function GenericPreview({ content, mediaUrl, mediaType, platform }: { content: string; mediaUrl: string | null; mediaType: string | null; platform: string }) {
  const platformConfig = getPlatformById(platform);

  return (
    <div className="p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          <User className="w-6 h-6 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-semibold">Your Name</p>
          <p className="text-xs text-muted-foreground">{platformConfig?.name}</p>
        </div>
      </div>

      {/* Content */}
      <p className="text-sm line-clamp-4 mb-3">
        {content || "Your content here..."}
      </p>

      {/* Media */}
      {mediaUrl && (
        <div className="rounded-lg overflow-hidden flex-1">
          {mediaType === "video" ? (
            <video src={mediaUrl} className="w-full h-full min-h-[200px] object-cover bg-black" muted autoPlay loop playsInline />
          ) : (
            <img src={mediaUrl} alt="" className="w-full h-full min-h-[200px] object-cover" />
          )}
        </div>
      )}
    </div>
  );
}

export function SocialPostPreview({
  platforms,
  content,
  mediaUrl,
  mediaType,
  linkUrl,
  title,
}: SocialPostPreviewProps) {
  const [activePlatform, setActivePlatform] = useState<string>(platforms[0] || "");
  const [instagramPostType, setInstagramPostType] = useState<InstagramPostType>("reel");

  // Reset active platform when platforms change
  useEffect(() => {
    if (platforms.length > 0 && !platforms.includes(activePlatform)) {
      setActivePlatform(platforms[0]);
    } else if (platforms.length > 0 && !activePlatform) {
      setActivePlatform(platforms[0]);
    }
  }, [platforms, activePlatform]);

  if (platforms.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-center p-4">
        <div>
          <p className="text-sm text-muted-foreground">Select a platform above</p>
          <p className="text-xs text-muted-foreground mt-1">to see preview</p>
        </div>
      </div>
    );
  }

  const currentPlatform = activePlatform || platforms[0];
  
  // Determine if vertical aspect ratio should be used
  const isVertical = currentPlatform === "instagram" 
    ? instagramPostType === "reel"
    : currentPlatform === "tiktok" || (currentPlatform === "pinterest" && mediaType === "video");

  const renderPreviewContent = () => {
    switch (currentPlatform) {
      case "instagram":
        return instagramPostType === "feed" 
          ? <InstagramFeedPreview content={content} mediaUrl={mediaUrl} mediaType={mediaType} />
          : <InstagramReelPreview content={content} mediaUrl={mediaUrl} mediaType={mediaType} />;
      case "pinterest":
        return <PinterestPreview content={content} mediaUrl={mediaUrl} mediaType={mediaType} linkUrl={linkUrl} title={title} />;
      case "tiktok":
        return <TikTokPreview content={content} mediaUrl={mediaUrl} mediaType={mediaType} />;
      default:
        return <GenericPreview content={content} mediaUrl={mediaUrl} mediaType={mediaType} platform={currentPlatform} />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
        <span>Preview for:</span>
        <div className="flex gap-2">
          {platforms.map((p) => {
            const IconComponent = getIconComponent(p);
            const config = getPlatformById(p);
            return (
              <button
                key={p}
                type="button"
                onClick={() => setActivePlatform(p)}
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-white cursor-pointer transition-all",
                  p === currentPlatform ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "opacity-50 hover:opacity-75"
                )}
                style={{ backgroundColor: config?.color }}
              >
                {IconComponent && <IconComponent className="w-4 h-4" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Show Instagram post type toggle when Instagram is selected */}
      {currentPlatform === "instagram" && (
        <InstagramPostTypeToggle 
          postType={instagramPostType} 
          onPostTypeChange={setInstagramPostType} 
        />
      )}
      
      <PhoneFrame 
        platform={currentPlatform} 
        isVertical={isVertical}
      >
        {renderPreviewContent()}
      </PhoneFrame>
    </div>
  );
}
