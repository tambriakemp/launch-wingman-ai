import { Instagram, Facebook, Twitter, Linkedin } from "lucide-react";
import { cn } from "@/lib/utils";
import { PLATFORMS } from "./platformConfigs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface PlatformSelectorProps {
  selected: string[];
  onChange: (platforms: string[]) => void;
}

// Custom icons for platforms not in Lucide
const PinterestIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
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

export function PlatformSelector({ selected, onChange }: PlatformSelectorProps) {
  const togglePlatform = (platformId: string) => {
    if (selected.includes(platformId)) {
      onChange(selected.filter((id) => id !== platformId));
    } else {
      onChange([...selected, platformId]);
    }
  };

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-3">
        {PLATFORMS.map((platform) => {
          const isSelected = selected.includes(platform.id);
          const IconComponent = getIconComponent(platform.id);

          return (
            <Tooltip key={platform.id}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => togglePlatform(platform.id)}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 border-2",
                    isSelected
                      ? "text-white border-transparent shadow-lg scale-110"
                      : "bg-muted text-muted-foreground border-transparent hover:border-border hover:bg-accent"
                  )}
                  style={isSelected ? { backgroundColor: platform.color } : {}}
                >
                  {IconComponent && <IconComponent className="w-5 h-5" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{platform.name}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
