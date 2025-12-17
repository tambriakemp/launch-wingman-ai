import { Instagram, Facebook, Twitter, Linkedin, User } from "lucide-react";
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
    case "twitter":
      return Twitter;
    case "linkedin":
      return Linkedin;
    case "pinterest":
      return PinterestIcon;
    case "tiktok":
      return TikTokIcon;
    default:
      return null;
  }
};

function PhoneFrame({ children, platform }: { children: React.ReactNode; platform: string }) {
  const platformConfig = getPlatformById(platform);
  const IconComponent = getIconComponent(platform);

  return (
    <div className="relative mx-auto w-[280px]">
      {/* Phone frame */}
      <div className="relative bg-background border-4 border-foreground/20 rounded-[28px] overflow-hidden shadow-xl">
        {/* Status bar */}
        <div
          className="h-7 flex items-center justify-between px-4 text-white text-[9px]"
          style={{ backgroundColor: platformConfig?.color || "#000" }}
        >
          <span>9:41</span>
          <div className="flex items-center gap-1.5">
            {IconComponent && <IconComponent className="w-3.5 h-3.5" />}
            <span className="font-medium">{platformConfig?.name}</span>
          </div>
        </div>

        {/* Content area */}
        <div className="bg-card min-h-[380px] max-h-[380px] overflow-hidden">
          {children}
        </div>

        {/* Home indicator */}
        <div className="h-6 flex items-center justify-center bg-card">
          <div className="w-28 h-1 bg-foreground/20 rounded-full" />
        </div>
      </div>
    </div>
  );
}

function InstagramPreview({ content, mediaUrl, mediaType }: { content: string; mediaUrl: string | null; mediaType: string | null }) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 p-2 border-b border-border">
        <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center">
          <User className="w-3 h-3 text-white" />
        </div>
        <span className="text-[10px] font-medium">your_account</span>
      </div>

      {/* Media */}
      {mediaUrl ? (
        mediaType === "video" ? (
          <video src={mediaUrl} className="w-full aspect-square object-cover bg-black" muted />
        ) : (
          <img src={mediaUrl} alt="" className="w-full aspect-square object-cover" />
        )
      ) : (
        <div className="w-full aspect-square bg-muted flex items-center justify-center">
          <span className="text-[10px] text-muted-foreground">No media</span>
        </div>
      )}

      {/* Caption */}
      <div className="p-2 flex-1 overflow-hidden">
        <p className="text-[8px] line-clamp-3">
          <span className="font-medium">your_account</span>{" "}
          {content || "Your caption here..."}
        </p>
      </div>
    </div>
  );
}

function TwitterPreview({ content, mediaUrl, mediaType }: { content: string; mediaUrl: string | null; mediaType: string | null }) {
  return (
    <div className="p-3">
      {/* Header */}
      <div className="flex gap-2">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold">Your Name</span>
            <span className="text-[9px] text-muted-foreground">@handle</span>
          </div>
          
          {/* Content */}
          <p className="text-[9px] mt-1 line-clamp-4">
            {content || "What's happening?"}
          </p>

          {/* Media */}
          {mediaUrl && (
            <div className="mt-2 rounded-lg overflow-hidden">
              {mediaType === "video" ? (
                <video src={mediaUrl} className="w-full h-20 object-cover bg-black" muted />
              ) : (
                <img src={mediaUrl} alt="" className="w-full h-20 object-cover" />
              )}
            </div>
          )}
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

  return (
    <div className="flex flex-col h-full">
      {/* Pin Image */}
      {mediaUrl ? (
        <div className="relative">
          {mediaType === "video" ? (
            <video src={mediaUrl} className="w-full aspect-[3/4] object-cover bg-black" muted />
          ) : (
            <img src={mediaUrl} alt="" className="w-full aspect-[3/4] object-cover" />
          )}
          {linkUrl && (
            <div className="absolute bottom-2 left-2 right-2">
              <div className="bg-white/90 rounded-full px-2.5 py-1 text-[9px] text-gray-700 truncate flex items-center gap-1">
                <span>🔗</span>
                <span>{getHostname(linkUrl)}</span>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full aspect-[3/4] bg-muted flex items-center justify-center">
          <span className="text-xs text-muted-foreground">Add image</span>
        </div>
      )}

      {/* Pin Title & Description */}
      <div className="p-3 flex-1 overflow-hidden bg-white">
        {title && (
          <h3 className="text-sm font-bold line-clamp-2 text-gray-900 mb-1">
            {title}
          </h3>
        )}
        <p className="text-[11px] text-gray-600 line-clamp-3">
          {content || "Pin description..."}
        </p>
      </div>
    </div>
  );
}

function GenericPreview({ content, mediaUrl, mediaType, platform }: { content: string; mediaUrl: string | null; mediaType: string | null; platform: string }) {
  const platformConfig = getPlatformById(platform);

  return (
    <div className="p-3">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <User className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <p className="text-[10px] font-medium">Your Name</p>
          <p className="text-[8px] text-muted-foreground">{platformConfig?.name}</p>
        </div>
      </div>

      {/* Content */}
      <p className="text-[9px] line-clamp-3 mb-2">
        {content || "Your content here..."}
      </p>

      {/* Media */}
      {mediaUrl && (
        <div className="rounded-lg overflow-hidden">
          {mediaType === "video" ? (
            <video src={mediaUrl} className="w-full h-24 object-cover bg-black" muted />
          ) : (
            <img src={mediaUrl} alt="" className="w-full h-24 object-cover" />
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

  // Show first selected platform's preview
  const activePlatform = platforms[0];

  const renderPreviewContent = () => {
    switch (activePlatform) {
      case "instagram":
        return <InstagramPreview content={content} mediaUrl={mediaUrl} mediaType={mediaType} />;
      case "twitter":
        return <TwitterPreview content={content} mediaUrl={mediaUrl} mediaType={mediaType} />;
      case "pinterest":
        return <PinterestPreview content={content} mediaUrl={mediaUrl} mediaType={mediaType} linkUrl={linkUrl} title={title} />;
      default:
        return <GenericPreview content={content} mediaUrl={mediaUrl} mediaType={mediaType} platform={activePlatform} />;
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span>Preview for:</span>
        <div className="flex gap-1">
          {platforms.map((p) => {
            const IconComponent = getIconComponent(p);
            const config = getPlatformById(p);
            return (
              <div
                key={p}
                className={cn(
                  "w-5 h-5 rounded-full flex items-center justify-center text-white",
                  p === activePlatform ? "ring-2 ring-primary" : "opacity-50"
                )}
                style={{ backgroundColor: config?.color }}
              >
                {IconComponent && <IconComponent className="w-3 h-3" />}
              </div>
            );
          })}
        </div>
      </div>
      
      <PhoneFrame platform={activePlatform}>
        {renderPreviewContent()}
      </PhoneFrame>
    </div>
  );
}
