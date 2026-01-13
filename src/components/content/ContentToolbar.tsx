import { Layers, ImagePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Pinterest icon
const PinterestIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
  </svg>
);

interface ContentToolbarProps {
  customizePerNetwork: boolean;
  onCustomizeToggle: () => void;
  showPinterestOption: boolean;
  onPinterestClick: () => void;
  pinterestHasWarning?: boolean;
  showMultiplePlatforms: boolean;
  onSelectMedia: () => void;
  hasMedia?: boolean;
}

export function ContentToolbar({
  customizePerNetwork,
  onCustomizeToggle,
  showPinterestOption,
  onPinterestClick,
  pinterestHasWarning,
  showMultiplePlatforms,
  onSelectMedia,
  hasMedia,
}: ContentToolbarProps) {
  return (
    <TooltipProvider>
      <div className="flex items-center gap-1 pt-2">
        {/* Customize per network icon - always visible */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onCustomizeToggle}
              disabled={!showMultiplePlatforms}
              className={cn(
                "h-8 w-8 p-0",
                customizePerNetwork && "bg-primary/10 text-primary",
                !showMultiplePlatforms && "opacity-40"
              )}
            >
              <Layers className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">
              {!showMultiplePlatforms
                ? "Select multiple platforms to customize"
                : customizePerNetwork
                ? "Disable per-network customization"
                : "Customize content per network"}
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Pinterest settings icon - always visible */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onPinterestClick}
              disabled={!showPinterestOption}
              className={cn(
                "h-8 w-8 p-0 relative",
                showPinterestOption && pinterestHasWarning && "text-amber-600",
                !showPinterestOption && "opacity-40"
              )}
            >
              <PinterestIcon className="w-4 h-4" />
              {showPinterestOption && pinterestHasWarning && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-500 rounded-full" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">
              {showPinterestOption
                ? "Pinterest board & link settings"
                : "Select Pinterest to configure"}
            </p>
          </TooltipContent>
        </Tooltip>

        {/* Select Media icon - always visible */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onSelectMedia}
              className={cn(
                "h-8 w-8 p-0",
                hasMedia && "bg-primary/10 text-primary"
              )}
            >
              <ImagePlus className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            <p className="text-xs">Select media</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
