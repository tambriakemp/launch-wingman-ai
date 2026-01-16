import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Instagram, Facebook, Linkedin } from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  startOfWeek,
  endOfWeek,
} from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { CalendarDayPopover } from "./CalendarDayPopover";
import { toast } from "sonner";
import { PHASE_CONFIG } from "@/data/timelineTemplates";

// Custom platform icons
const PinterestIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
  </svg>
);

const TikTokIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.182.408-2.256 1.33-3.022.858-.712 2.05-1.14 3.451-1.238 1.075-.075 2.099.016 3.06.27-.07-.81-.283-1.452-.637-1.916-.457-.599-1.166-.91-2.106-.928-.793.012-1.478.227-2.04.64-.477.35-.807.832-.98 1.433l-2.004-.578c.263-.91.753-1.726 1.46-2.422.975-.96 2.293-1.47 3.808-1.476h.052c1.697.02 3.065.63 3.967 1.766.755.952 1.18 2.238 1.263 3.825.47.226.908.492 1.31.8 1.225.94 2.09 2.197 2.496 3.635.486 1.72.403 4.063-1.576 6.002-1.837 1.8-4.12 2.673-7.394 2.696zM12.59 14.39c-1.152.081-2.029.378-2.537.86-.388.368-.575.798-.543 1.247.03.424.25.81.638 1.115.488.384 1.18.588 2.003.541 1.07-.057 1.9-.455 2.467-1.183.493-.633.794-1.513.894-2.615-.935-.217-1.916-.307-2.922-.237z" />
  </svg>
);

// Platform icon helper
const getPlatformIcon = (platform: string) => {
  const iconClass = "h-3 w-3";
  switch (platform.toLowerCase()) {
    case "instagram":
      return <Instagram className={iconClass} />;
    case "facebook":
      return <Facebook className={iconClass} />;
    case "linkedin":
      return <Linkedin className={iconClass} />;
    case "pinterest":
      return <PinterestIcon className={iconClass} />;
    case "tiktok":
      return <TikTokIcon className={iconClass} />;
    case "threads":
      return <ThreadsIcon className={iconClass} />;
    default:
      return null;
  }
};

// Content type border colors (left border)
const CONTENT_TYPE_BORDER_COLORS: Record<string, string> = {
  general: "border-l-slate-500",
  stories: "border-l-amber-500",
  offer: "border-l-emerald-500",
  "behind-the-scenes": "border-l-cyan-500",
  educational: "border-l-blue-500",
  promotional: "border-l-purple-500",
};

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

interface ContentCalendarViewProps {
  projectId: string;
  onCreatePost: () => void;
  onEditPost: (item: ContentPlannerItem) => void;
  onSchedulePost: (item: ContentPlannerItem) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

// Helper to get excerpt from content or description
const getExcerpt = (item: ContentPlannerItem, maxLength = 100): string => {
  const text = item.content || item.description || "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
};

// Helper to clean title (remove W1D3 style prefixes)
const cleanTitle = (title: string): string => {
  // Remove patterns like "W1D3:", "W2D1:", etc.
  return title.replace(/^W\d+D\d+:\s*/i, "").trim();
};

export const ContentCalendarView = ({
  projectId,
  onCreatePost,
  onEditPost,
  onSchedulePost,
}: ContentCalendarViewProps) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const queryClient = useQueryClient();

  const { data: plannerItems = [] } = useQuery({
    queryKey: ["content-planner", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_planner")
        .select("*")
        .eq("project_id", projectId);
      if (error) throw error;
      return data as ContentPlannerItem[];
    },
  });

  // Get all days to display in the calendar grid
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);
    
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  // Group scheduled items by date
  const itemsByDate = useMemo(() => {
    const map = new Map<string, ContentPlannerItem[]>();
    
    plannerItems.forEach((item) => {
      if (item.scheduled_at) {
        const dateKey = format(new Date(item.scheduled_at), "yyyy-MM-dd");
        const existing = map.get(dateKey) || [];
        map.set(dateKey, [...existing, item]);
      }
    });
    
    return map;
  }, [plannerItems]);

  const handleDeletePost = async (id: string) => {
    try {
      const { error } = await supabase
        .from("content_planner")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
      toast.success("Post removed");
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to remove post");
    }
  };

  const getItemsForDate = (date: Date): ContentPlannerItem[] => {
    const dateKey = format(date, "yyyy-MM-dd");
    return itemsByDate.get(dateKey) || [];
  };

  const navigateMonth = (direction: "prev" | "next") => {
    setCurrentMonth((prev) =>
      direction === "prev" ? subMonths(prev, 1) : addMonths(prev, 1)
    );
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  return (
    <div className="space-y-4">
        {/* Calendar Header */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1 md:gap-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigateMonth("prev")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => navigateMonth("next")}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <h2 className="text-base md:text-lg font-semibold text-foreground ml-1 md:ml-2">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
          </div>
          <Button variant="outline" size="sm" onClick={goToToday} className="h-8">
            Today
          </Button>
        </div>

        {/* Calendar Grid - Horizontal scroll on mobile */}
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <div className="min-w-[600px] md:min-w-0">
              {/* Weekday Headers */}
              <div className="grid grid-cols-7 border-b border-border">
                {WEEKDAYS.map((day) => (
                  <div
                    key={day}
                    className="py-1.5 md:py-2 text-center text-[10px] md:text-xs font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7">
                {calendarDays.map((day, idx) => {
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isToday = isSameDay(day, new Date());
                  const dayItems = getItemsForDate(day);
                  const hasItems = dayItems.length > 0;

                  return (
                    <CalendarDayPopover
                      key={idx}
                      date={day}
                      items={dayItems}
                      onCreatePost={onCreatePost}
                      onEditPost={onEditPost}
                      onSchedulePost={onSchedulePost}
                      onDeletePost={handleDeletePost}
                    >
                      <div
                        className={cn(
                          "min-h-20 md:min-h-32 p-1.5 md:p-2 border-b border-r border-border cursor-pointer transition-colors hover:bg-accent/50",
                          !isCurrentMonth && "bg-muted/30",
                          idx % 7 === 6 && "border-r-0"
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <span
                            className={cn(
                              "text-xs md:text-sm w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full",
                              !isCurrentMonth && "text-muted-foreground",
                              isToday && "bg-primary text-primary-foreground font-semibold"
                            )}
                          >
                            {format(day, "d")}
                          </span>
                        </div>
                        
                        {/* Content Indicators */}
                        {hasItems && (
                          <div className="mt-1 space-y-0.5 md:space-y-1">
                            {dayItems.slice(0, 2).map((item) => {
                              const phaseConfig = PHASE_CONFIG[item.phase as keyof typeof PHASE_CONFIG];
                              const borderColor = CONTENT_TYPE_BORDER_COLORS[item.content_type] || "border-l-slate-500";
                              const scheduledTime = item.scheduled_at 
                                ? format(new Date(item.scheduled_at), "h:mm a")
                                : null;
                              const cleanedTitle = cleanTitle(item.title);
                              
                              return (
                                <div
                                  key={item.id}
                                  className={cn(
                                    "text-[10px] md:text-xs px-1 md:px-1.5 py-0.5 md:py-1.5 rounded-r truncate border-l-2 md:border-l-4 bg-muted/80 dark:bg-muted/60",
                                    borderColor
                                  )}
                                >
                                  {/* Platform icons row - hidden on mobile */}
                                  {item.scheduled_platforms && item.scheduled_platforms.length > 0 && (
                                    <div className="hidden md:flex items-center gap-1 mb-0.5 text-muted-foreground">
                                      {item.scheduled_platforms.map((platform) => (
                                        <span key={platform}>{getPlatformIcon(platform)}</span>
                                      ))}
                                      {scheduledTime && (
                                        <span className="ml-auto text-[10px]">{scheduledTime}</span>
                                      )}
                                    </div>
                                  )}
                                  
                                  {/* Title */}
                                  <span className="truncate block text-foreground font-medium">
                                    {cleanedTitle}
                                  </span>
                                  
                                  {/* Status badge - Posted indicator */}
                                  {(item.status === "posted" || item.status === "completed") && (
                                    <span className="inline-flex items-center gap-0.5 mt-0.5 px-1 py-0 rounded text-[9px] bg-emerald-500/10 text-emerald-600">
                                      <span className="w-1 h-1 rounded-full bg-emerald-500" />
                                      Posted
                                    </span>
                                  )}
                                  
                                  {/* Phase badge - only for launch content, hidden on mobile */}
                                  {phaseConfig && item.status !== "posted" && item.status !== "completed" && (
                                    <span className={cn(
                                      "hidden md:inline-block mt-0.5 px-1 py-0 rounded text-[9px] text-white",
                                      phaseConfig.color
                                    )}>
                                      {phaseConfig.label}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                            {dayItems.length > 2 && (
                              <div className="text-[9px] md:text-[10px] text-muted-foreground pl-1">
                                +{dayItems.length - 2} more
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </CalendarDayPopover>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Legend - Content Types only - Hidden on mobile, scrollable on tablet */}
        <div className="hidden sm:flex items-center gap-2 md:gap-4 text-[10px] md:text-xs text-muted-foreground flex-wrap overflow-x-auto pb-1">
          <span className="font-medium shrink-0">Content Types:</span>
          {Object.entries(CONTENT_TYPE_BORDER_COLORS).map(([type, borderClass]) => (
            <div key={type} className="flex items-center gap-1 md:gap-1.5 shrink-0">
              <div className={cn("w-1 h-3 md:h-4 rounded", borderClass.replace("border-l-", "bg-"))} />
              <span className="capitalize">{type.replace("-", " ")}</span>
            </div>
          ))}
        </div>
    </div>
  );
};