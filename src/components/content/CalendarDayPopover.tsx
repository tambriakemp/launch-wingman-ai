import { format } from "date-fns";
import { Plus, CalendarClock, Trash2, CheckCircle2, Clock, Instagram, Facebook } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// Custom platform icons
const PinterestIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
  </svg>
);

const TikTokIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

const ThreadsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.59 12c.025 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.332-3.023.899-.746 2.153-1.159 3.531-1.159.293 0 .594.013.903.04l.019-.002c-.079-1.092-.232-1.753-.544-2.256-.366-.587-.997-.881-1.878-.876-.89.005-1.606.291-2.127.849l-1.383-1.586c.979-.997 2.293-1.523 3.798-1.523.006 0 .012 0 .018 0 1.683.02 2.956.584 3.785 1.676.726.956.97 2.18 1.05 3.783a7.758 7.758 0 0 1 2.534 1.074c1.186.724 2.08 1.672 2.589 2.747.734 1.551.825 4.075-1.263 6.116-1.876 1.832-4.175 2.632-7.453 2.654zm-.636-9.926c-.876 0-1.627.19-2.121.535-.478.334-.703.756-.67 1.257.032.487.288.905.765 1.245.55.392 1.28.582 2.105.548.959-.052 1.683-.393 2.152-1.013.406-.536.626-1.28.636-2.207a8.39 8.39 0 0 0-2.867-.365z"/>
  </svg>
);

const getPlatformIcon = (platform: string) => {
  switch (platform.toLowerCase()) {
    case 'instagram':
      return <Instagram className="w-3.5 h-3.5" />;
    case 'pinterest':
      return <PinterestIcon />;
    case 'facebook':
      return <Facebook className="w-3.5 h-3.5" />;
    case 'tiktok':
    case 'tiktok_sandbox':
      return <TikTokIcon />;
    case 'threads':
      return <ThreadsIcon />;
    default:
      return null;
  }
};
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { CONTENT_TYPE_COLORS } from "./contentTypeColors";
import { PHASE_CONFIG, getPhaseLabel } from "@/data/timelineTemplates";

interface ContentPlannerItem {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  content_type: string;
  phase: string;
  day_number: number;
  status: string;
  scheduled_at: string | null;
  scheduled_platforms: string[] | null;
  media_url: string | null;
  media_type: string | null;
}

// Helper to get excerpt from content or description
const getExcerpt = (item: ContentPlannerItem, maxLength = 80): string => {
  const text = item.content || item.description || "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
};

interface CalendarDayPopoverProps {
  date: Date;
  items: ContentPlannerItem[];
  children: React.ReactNode;
  onCreatePost: (date: Date) => void;
  onEditPost: (item: ContentPlannerItem) => void;
  onSchedulePost: (item: ContentPlannerItem) => void;
  onDeletePost: (id: string) => void;
}

export const CalendarDayPopover = ({
  date,
  items,
  children,
  onCreatePost,
  onEditPost,
  onSchedulePost,
  onDeletePost,
}: CalendarDayPopoverProps) => {
  return (
    <Popover>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b border-border">
          <h3 className="font-semibold text-foreground">
            {format(date, "EEEE, MMMM d")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {items.length} {items.length === 1 ? "post" : "posts"} scheduled
          </p>
        </div>

        {items.length > 0 ? (
          <div className="max-h-72 overflow-y-auto">
            <div className="p-2 space-y-2">
              {items.map((item) => {
                const phaseConfig = PHASE_CONFIG[item.phase as keyof typeof PHASE_CONFIG];
                const phaseLabel = getPhaseLabel(item.phase, item.day_number);
                
                return (
                <div
                  key={item.id}
                  className={cn(
                    "p-2 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors group",
                    phaseConfig && `border-l-4 ${phaseConfig.borderColor}`
                  )}
                >
                  {/* Media preview */}
                  {item.media_url && (
                    <div className="mb-2 rounded overflow-hidden">
                      {item.media_type?.startsWith("video") ? (
                        <video 
                          src={item.media_url} 
                          className="w-full h-20 object-cover"
                          muted
                        />
                      ) : (
                        <img 
                          src={item.media_url} 
                          alt=""
                          className="w-full h-20 object-cover"
                        />
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-start gap-2">
                    <div
                      className={cn(
                        "w-6 h-6 rounded flex items-center justify-center flex-shrink-0 mt-0.5",
                        CONTENT_TYPE_COLORS[item.content_type] || "bg-slate-500"
                      )}
                    >
                      <span className="text-[10px] font-bold text-white uppercase">
                        {item.content_type.charAt(0)}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground line-clamp-1">
                        {item.title}
                      </h4>
                      
                      {/* Content excerpt */}
                      {getExcerpt(item) && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {getExcerpt(item)}
                        </p>
                      )}
                      
                      <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
                        {phaseLabel && (
                          <Badge 
                            variant="secondary" 
                            className={cn(
                              "text-[10px] h-5 text-white",
                              phaseConfig?.color
                            )}
                          >
                            {phaseConfig?.fullLabel}
                          </Badge>
                        )}
                        {(item.status === "completed" || item.status === "posted") && item.scheduled_at && (
                          <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Posted
                          </Badge>
                        )}
                        {item.scheduled_at && item.status !== "completed" && item.status !== "posted" && (
                          <Badge variant="secondary" className="text-[10px] h-5 gap-1 bg-amber-500/10 text-amber-600 border-amber-200">
                            <Clock className="w-2.5 h-2.5" />
                            {format(new Date(item.scheduled_at), "h:mm a")}
                          </Badge>
                        )}
                        {item.scheduled_platforms && item.scheduled_platforms.length > 0 && (
                          <div className="flex items-center gap-1">
                            {item.scheduled_platforms.map((platform) => (
                              <span key={platform} className="text-muted-foreground" title={platform}>
                                {getPlatformIcon(platform)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs flex-1"
                      onClick={() => onSchedulePost(item)}
                    >
                      <CalendarClock className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs text-destructive hover:text-destructive"
                      onClick={() => onDeletePost(item.id)}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              No posts scheduled for this day
            </p>
          </div>
        )}

        <div className="p-2 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => onCreatePost(date)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Post
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};
