import { Instagram, Facebook, Linkedin } from "lucide-react";
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

const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017C1.5 8.416 2.35 5.56 3.995 3.51 5.845 1.205 8.6.024 12.181 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.334-3.023.863-.715 2.023-1.097 3.354-1.103l.123-.001c1.087 0 2.079.254 2.91.734-.012-.503-.064-.982-.153-1.423l2.027-.386c.192 1.011.244 2.218.108 3.58.744.463 1.4 1.045 1.934 1.742.818 1.067 1.237 2.396 1.212 3.842-.025 1.47-.495 2.876-1.36 4.064-1.04 1.426-2.593 2.512-4.616 3.227-1.264.447-2.654.68-4.132.691zm.698-10.2l-.123.001c-.856.008-1.57.236-2.065.66-.456.39-.666.86-.626 1.397.046.624.389 1.098.993 1.373.563.254 1.262.336 1.957.296 1.014-.056 1.766-.406 2.238-1.042.39-.527.615-1.224.68-2.097-.803-.374-1.85-.589-3.054-.589z"/>
  </svg>
);

const getIconComponent = (platformId: string) => {
  switch (platformId) {
    case "instagram":
      return Instagram;
    case "facebook":
      return Facebook;
    case "linkedin":
      return Linkedin;
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

export function PlatformSelector({ selected, onChange }: PlatformSelectorProps) {
  const togglePlatform = (platformId: string) => {
    if (selected.includes(platformId)) {
      onChange(selected.filter((id) => id !== platformId));
    } else {
      onChange([...selected, platformId]);
    }
  };

  const visiblePlatforms = PLATFORMS.filter(p => !p.hidden);

  return (
    <TooltipProvider>
      <div className="flex flex-wrap gap-3">
        {visiblePlatforms.map((platform) => {
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
