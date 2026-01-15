import { cn } from "@/lib/utils";

// Character limits per platform
const PLATFORM_CHAR_LIMITS: Record<string, number> = {
  threads: 500,
  instagram: 2200,
  facebook: 63206,
  tiktok: 2200,
  pinterest: 500,
};

interface CharacterCounterProps {
  content: string;
  platforms: string[];
  className?: string;
}

export function CharacterCounter({ content, platforms, className }: CharacterCounterProps) {
  const charCount = content.length;
  
  // Find the most restrictive platform limit
  const activeLimits = platforms
    .map((p) => ({ platform: p, limit: PLATFORM_CHAR_LIMITS[p] }))
    .filter((p) => p.limit !== undefined)
    .sort((a, b) => a.limit - b.limit);
  
  const mostRestrictive = activeLimits[0];
  const isOverLimit = mostRestrictive && charCount > mostRestrictive.limit;
  
  // Check if multiple platforms have different limits
  const hasMultipleLimits = activeLimits.length > 1 && 
    activeLimits[0].limit !== activeLimits[activeLimits.length - 1].limit;
  
  if (!mostRestrictive) {
    return (
      <span className={cn("text-xs text-muted-foreground", className)}>
        {charCount} characters
      </span>
    );
  }
  
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <span className={cn(
        "text-xs",
        isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"
      )}>
        {charCount} / {mostRestrictive.limit}
      </span>
      {isOverLimit && (
        <span className="text-xs text-destructive">
          ({charCount - mostRestrictive.limit} over for {getPlatformDisplayName(mostRestrictive.platform)})
        </span>
      )}
      {!isOverLimit && hasMultipleLimits && (
        <span className="text-xs text-muted-foreground/70">
          ({getPlatformDisplayName(mostRestrictive.platform)} limit)
        </span>
      )}
    </div>
  );
}

function getPlatformDisplayName(platform: string): string {
  const names: Record<string, string> = {
    threads: "Threads",
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    pinterest: "Pinterest",
  };
  return names[platform] || platform;
}

export { PLATFORM_CHAR_LIMITS };
