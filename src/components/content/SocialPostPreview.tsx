import { useState, useEffect } from "react";
import { Instagram, Facebook, User, Heart, MessageCircle, Send, Bookmark, Grid3X3, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPlatformById } from "./platformConfigs";
import { ThreadsPreview } from "./ThreadsPreview";

interface ThreadPost {
  id: string;
  text: string;
  mediaUrl?: string | null;
  mediaType?: string | null;
}

interface SocialPostPreviewProps {
  platforms: string[];
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  linkUrl?: string;
  title?: string;
  accountNames?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    threads?: string;
    pinterest?: string;
  };
  threadPosts?: ThreadPost[];
}

type InstagramPostType = "photo" | "reel";

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
    case "instagram": return Instagram;
    case "facebook": return Facebook;
    case "pinterest": return PinterestIcon;
    case "tiktok":
    case "tiktok_sandbox": return TikTokIcon;
    case "threads": return ThreadsIcon;
    default: return null;
  }
};

function PhoneFrame({ children, platform, isVertical }: { children: React.ReactNode; platform: string; isVertical?: boolean }) {
  const platformConfig = getPlatformById(platform);
  const IconComponent = getIconComponent(platform);
  return (
    <div className="relative mx-auto w-[320px]">
      <div className="relative bg-black border-[8px] border-foreground/30 rounded-[40px] overflow-hidden shadow-2xl">
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-full z-20" />
        <div className="h-10 flex items-end justify-between px-6 pb-1 text-white text-xs relative z-10" style={{ backgroundColor: platformConfig?.color || "#000" }}>
          <span className="font-medium">9:41</span>
          <div className="flex items-center gap-1.5">
            {IconComponent && <IconComponent className="w-4 h-4" />}
            <span className="font-semibold">{platformConfig?.name}</span>
          </div>
        </div>
        <div className={cn("bg-card overflow-hidden", isVertical ? "h-[560px]" : "h-[520px]")}>{children}</div>
        <div className="h-8 flex items-center justify-center bg-card"><div className="w-28 h-1.5 bg-foreground/30 rounded-full" /></div>
      </div>
    </div>
  );
}

function InstagramPostTypeToggle({ postType, onPostTypeChange }: { postType: InstagramPostType; onPostTypeChange: (type: InstagramPostType) => void }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-3">
      <button type="button" onClick={() => onPostTypeChange("photo")} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all", postType === "photo" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}><Image className="w-4 h-4" />Photo</button>
      <button type="button" onClick={() => onPostTypeChange("reel")} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all", postType === "reel" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80")}><Grid3X3 className="w-4 h-4" />Reel</button>
    </div>
  );
}

function InstagramPhotoPreview({ content, mediaUrl, mediaType, accountName }: { content: string; mediaUrl: string | null; mediaType: string | null; accountName: string }) {
  return (
    <div className="flex flex-col h-full bg-white">
      <div className="flex items-center gap-2.5 p-3 border-b border-gray-200">
        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center"><User className="w-4 h-4 text-white" /></div>
        <span className="text-sm font-semibold text-gray-900">{accountName}</span>
      </div>
      <div className="relative w-full bg-gray-100 flex items-center justify-center" style={{ aspectRatio: '4/5' }}>
        {mediaUrl ? (mediaType === "video" ? <video key={mediaUrl} src={mediaUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline /> : <img src={mediaUrl} alt="" className="w-full h-full object-contain" />) : <div className="w-full h-full flex items-center justify-center"><span className="text-sm text-gray-400">No media</span></div>}
      </div>
      <div className="flex items-center justify-between px-3 py-2 bg-white">
        <div className="flex items-center gap-4"><Heart className="w-6 h-6 text-gray-900" strokeWidth={1.5} /><MessageCircle className="w-6 h-6 text-gray-900" strokeWidth={1.5} /><Send className="w-6 h-6 text-gray-900" strokeWidth={1.5} /></div>
        <Bookmark className="w-6 h-6 text-gray-900" strokeWidth={1.5} />
      </div>
      <div className="px-3 pb-2 bg-white flex-1 overflow-hidden">
        <p className="text-sm text-gray-900 font-semibold mb-1">1,234 likes</p>
        <p className="text-sm text-gray-900 line-clamp-2"><span className="font-semibold">{accountName.replace('@', '')}</span> {content || "Your caption here..."}</p>
      </div>
    </div>
  );
}

function InstagramReelPreview({ content, mediaUrl, mediaType, accountName }: { content: string; mediaUrl: string | null; mediaType: string | null; accountName: string }) {
  return (
    <div className="flex flex-col h-full bg-black relative">
      <div className="absolute inset-0">{mediaUrl ? (mediaType === "video" ? <video key={mediaUrl} src={mediaUrl} className="w-full h-full object-cover" muted loop autoPlay playsInline /> : <img src={mediaUrl} alt="" className="w-full h-full object-cover" />) : <div className="w-full h-full bg-gray-900 flex items-center justify-center"><span className="text-sm text-gray-500">No media</span></div>}</div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
      <div className="absolute right-3 bottom-24 flex flex-col gap-4">
        <div className="flex flex-col items-center"><Heart className="w-7 h-7 text-white" strokeWidth={1.5} /><span className="text-xs text-white mt-1">17.3K</span></div>
        <div className="flex flex-col items-center"><MessageCircle className="w-7 h-7 text-white" strokeWidth={1.5} /><span className="text-xs text-white mt-1">1126</span></div>
        <div className="flex flex-col items-center"><Send className="w-7 h-7 text-white" strokeWidth={1.5} /><span className="text-xs text-white mt-1">568</span></div>
        <div className="flex flex-col items-center"><Bookmark className="w-7 h-7 text-white" strokeWidth={1.5} /></div>
        <div className="w-8 h-8 rounded-lg border-2 border-white/50 overflow-hidden mt-2"><div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500" /></div>
      </div>
      <div className="absolute bottom-4 left-3 right-16">
        <div className="flex items-center gap-2 mb-2"><div className="w-8 h-8 rounded-full bg-gradient-to-tr from-yellow-400 via-pink-500 to-purple-600 flex items-center justify-center"><User className="w-4 h-4 text-white" /></div><span className="text-sm font-semibold text-white">{accountName}</span><button className="px-3 py-1 border border-white/70 rounded text-xs text-white font-medium">Follow</button></div>
        <p className="text-sm text-white line-clamp-2">{content || "Your caption here..."}</p>
        <div className="flex items-center gap-2 mt-2"><span className="text-xs text-white/70">♫</span><span className="text-xs text-white">Original audio</span></div>
      </div>
    </div>
  );
}

function PinterestPreview({ content, mediaUrl, mediaType, linkUrl, title }: { content: string; mediaUrl: string | null; mediaType: string | null; linkUrl?: string; title?: string }) {
  const getHostname = (url: string) => { try { return new URL(url).hostname; } catch { return url; } };
  const isVideo = mediaType === "video";
  return (
    <div className="flex flex-col h-full bg-white">
      {mediaUrl ? (
        <div className={cn("relative bg-gray-100 flex items-center justify-center", isVideo ? "flex-1" : "max-h-[320px]")}>
          {isVideo ? (
            <video key={mediaUrl} src={mediaUrl} className="w-full h-full object-cover bg-black" muted loop autoPlay playsInline />
          ) : (
            <img src={mediaUrl} alt="" className="w-full h-full object-contain" />
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
        <div className="w-full h-[200px] bg-muted flex items-center justify-center">
          <span className="text-sm text-muted-foreground">Add image</span>
        </div>
      )}
      <div className={cn("p-3 overflow-hidden bg-white flex-1")}>
        {title && <h3 className="text-base font-bold line-clamp-1 text-gray-900 mb-1">{title}</h3>}
        <p className="text-sm text-gray-600 line-clamp-2">{content || "Pin description..."}</p>
      </div>
    </div>
  );
}

function TikTokPreview({ content, mediaUrl, mediaType, accountName = "@your_account" }: { content: string; mediaUrl: string | null; mediaType: string | null; accountName?: string }) {
  const [videoError, setVideoError] = useState(false);
  useEffect(() => { setVideoError(false); }, [mediaUrl]);
  return (
    <div className="flex flex-col h-full bg-black relative">
      {mediaUrl ? (videoError ? <div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><TikTokIcon className="w-16 h-16 text-white/50 mx-auto mb-3" /><span className="text-sm text-white/50">Preview unavailable</span></div></div> : mediaType === "video" ? <video key={mediaUrl} src={mediaUrl} className="w-full h-full object-cover absolute inset-0" muted loop autoPlay playsInline preload="metadata" onError={() => setVideoError(true)} /> : <img src={mediaUrl} alt="" className="w-full h-full object-cover absolute inset-0" onError={() => setVideoError(true)} />) : <div className="absolute inset-0 flex items-center justify-center"><div className="text-center"><TikTokIcon className="w-16 h-16 text-white/50 mx-auto mb-3" /><span className="text-sm text-white/50">Video required</span></div></div>}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
      <div className="absolute right-3 bottom-24 flex flex-col gap-4">
        <div className="flex flex-col items-center"><div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><Heart className="w-6 h-6 text-white" /></div><span className="text-xs text-white mt-1">17.3K</span></div>
        <div className="flex flex-col items-center"><div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><MessageCircle className="w-6 h-6 text-white" /></div><span className="text-xs text-white mt-1">1126</span></div>
        <div className="flex flex-col items-center"><div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><Bookmark className="w-6 h-6 text-white" /></div><span className="text-xs text-white mt-1">2.4K</span></div>
        <div className="flex flex-col items-center"><div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center"><Send className="w-6 h-6 text-white" /></div><span className="text-xs text-white mt-1">568</span></div>
        <div className="w-10 h-10 rounded-full border-2 border-white/30 overflow-hidden animate-spin" style={{ animationDuration: '3s' }}><div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center"><div className="w-4 h-4 bg-white/80 rounded-full" /></div></div>
      </div>
      <div className="absolute bottom-4 left-3 right-16">
        <div className="flex items-center gap-2 mb-2"><div className="w-10 h-10 rounded-full bg-white/30 flex items-center justify-center"><User className="w-5 h-5 text-white" /></div><span className="text-sm font-semibold text-white">{accountName}</span><button className="ml-2 px-4 py-1 border border-pink-500 rounded text-xs text-pink-500 font-medium bg-transparent">Follow</button></div>
        <p className="text-sm text-white line-clamp-2">{content || "Your caption here..."}</p>
        <div className="flex items-center gap-2 mt-2"><span className="text-sm text-white/70">♫</span><span className="text-sm text-white">Original sound - {accountName.replace('@', '')}</span></div>
      </div>
    </div>
  );
}

function GenericPreview({ content, mediaUrl, mediaType, platform, accountName = "@your_account" }: { content: string; mediaUrl: string | null; mediaType: string | null; platform: string; accountName?: string }) {
  const platformConfig = getPlatformById(platform);
  return (
    <div className="p-4 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-3"><div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center"><User className="w-6 h-6 text-muted-foreground" /></div><div><p className="text-sm font-semibold">{accountName}</p><p className="text-xs text-muted-foreground">{platformConfig?.name}</p></div></div>
      <p className="text-sm line-clamp-4 mb-3">{content || "Your content here..."}</p>
      {mediaUrl && <div className="rounded-lg overflow-hidden flex-1">{mediaType === "video" ? <video src={mediaUrl} className="w-full h-full min-h-[200px] object-cover bg-black" muted autoPlay loop playsInline /> : <img src={mediaUrl} alt="" className="w-full h-full min-h-[200px] object-cover" />}</div>}
    </div>
  );
}

export function SocialPostPreview({ platforms, content, mediaUrl, mediaType, linkUrl, title, accountNames, threadPosts }: SocialPostPreviewProps) {
  const [activePlatform, setActivePlatform] = useState<string>(platforms[0] || "");
  const [instagramPostType, setInstagramPostType] = useState<InstagramPostType>("reel");

  useEffect(() => {
    if (platforms.length > 0 && !platforms.includes(activePlatform)) setActivePlatform(platforms[0]);
    else if (platforms.length > 0 && !activePlatform) setActivePlatform(platforms[0]);
  }, [platforms, activePlatform]);

  if (platforms.length === 0) return <div className="flex items-center justify-center h-full text-center p-4"><div><p className="text-sm text-muted-foreground">Select a platform above</p><p className="text-xs text-muted-foreground mt-1">to see preview</p></div></div>;

  const currentPlatform = activePlatform || platforms[0];
  const isVertical = currentPlatform === "instagram" ? instagramPostType === "reel" : currentPlatform === "tiktok" || currentPlatform === "threads" || (currentPlatform === "pinterest" && mediaType === "video");
  
  const getAccountName = (platform: string): string => {
    const name = accountNames?.[platform as keyof typeof accountNames];
    if (name) return name.startsWith('@') ? name : `@${name}`;
    return "@your_account";
  };

  const renderPreviewContent = () => {
    const accountName = getAccountName(currentPlatform);
    switch (currentPlatform) {
      case "instagram": return instagramPostType === "photo" ? <InstagramPhotoPreview content={content} mediaUrl={mediaUrl} mediaType={mediaType} accountName={accountName} /> : <InstagramReelPreview content={content} mediaUrl={mediaUrl} mediaType={mediaType} accountName={accountName} />;
      case "threads": return <ThreadsPreview content={content} mediaUrl={mediaUrl} mediaType={mediaType} accountName={accountName.replace('@', '')} threadPosts={threadPosts} />;
      case "pinterest": return <PinterestPreview content={content} mediaUrl={mediaUrl} mediaType={mediaType} linkUrl={linkUrl} title={title} />;
      case "tiktok": return <TikTokPreview content={content} mediaUrl={mediaUrl} mediaType={mediaType} accountName={accountName} />;
      default: return <GenericPreview content={content} mediaUrl={mediaUrl} mediaType={mediaType} platform={currentPlatform} accountName={accountName} />;
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
            return <button key={p} type="button" onClick={() => setActivePlatform(p)} className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white cursor-pointer transition-all", p === currentPlatform ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "opacity-50 hover:opacity-75")} style={{ backgroundColor: config?.color }}>{IconComponent && <IconComponent className="w-4 h-4" />}</button>;
          })}
        </div>
      </div>
      {currentPlatform === "instagram" && <InstagramPostTypeToggle postType={instagramPostType} onPostTypeChange={setInstagramPostType} />}
      <PhoneFrame platform={currentPlatform} isVertical={isVertical}>{renderPreviewContent()}</PhoneFrame>
    </div>
  );
}
