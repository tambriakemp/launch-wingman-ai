import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Instagram, Facebook, Linkedin, Clock } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  isSameDay,
  isToday as isDateToday,
} from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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

const getPlatformColor = (platform: string): string => {
  switch (platform.toLowerCase()) {
    case "instagram": return "#E4405F";
    case "facebook": return "#1877F2";
    case "linkedin": return "#0A66C2";
    case "pinterest": return "#E60023";
    case "tiktok": return "#000000";
    case "threads": return "#000000";
    default: return "hsl(var(--muted-foreground))";
  }
};

const getPlatformName = (platform: string): string => {
  switch (platform.toLowerCase()) {
    case "instagram": return "Instagram";
    case "facebook": return "Facebook";
    case "linkedin": return "LinkedIn";
    case "pinterest": return "Pinterest";
    case "tiktok": return "TikTok";
    case "threads": return "Threads";
    default: return platform;
  }
};

interface ContentPlannerItem {
  id: string;
  title: string;
  description: string | null;
  content: string | null;
  content_type: string;
  phase: string;
  day_number: number;
  time_of_day: string;
  status: string;
  scheduled_at: string | null;
  scheduled_platforms: string[] | null;
  media_url: string | null;
  media_type: string | null;
}

interface ContentWeeklyViewProps {
  projectId: string | null;
  onCreatePost: () => void;
  onEditPost: (item: ContentPlannerItem) => void;
  onSchedulePost: (item: ContentPlannerItem) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const HOUR_HEIGHT = 60; // px per hour row

const formatHour = (hour: number): string => {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
};

export const ContentWeeklyView = ({
  projectId,
  onCreatePost,
  onEditPost,
  onSchedulePost,
}: ContentWeeklyViewProps) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 0 })
  );
  const scrollRef = useRef<HTMLDivElement>(null);
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

  const weekDays = useMemo(() => {
    const weekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: currentWeekStart, end: weekEnd });
  }, [currentWeekStart]);

  // Group items by date+hour
  const itemsByDateHour = useMemo(() => {
    const map = new Map<string, ContentPlannerItem[]>();
    plannerItems.forEach((item) => {
      if (item.scheduled_at) {
        const d = new Date(item.scheduled_at);
        const dateKey = format(d, "yyyy-MM-dd");
        const hour = d.getHours();
        const key = `${dateKey}-${hour}`;
        const existing = map.get(key) || [];
        map.set(key, [...existing, item]);
      }
    });
    return map;
  }, [plannerItems]);

  // Auto-scroll to 8 AM on mount
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 8 * HOUR_HEIGHT;
    }
  }, []);

  const navigateWeek = (direction: "prev" | "next") => {
    setCurrentWeekStart((prev) =>
      direction === "prev" ? subWeeks(prev, 1) : addWeeks(prev, 1)
    );
  };

  const goToToday = () => {
    setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }));
  };

  const weekLabel = format(currentWeekStart, "MMMM yyyy");

  return (
    <div className="flex flex-col h-full p-3">
      <div className="flex flex-col flex-1 overflow-hidden rounded-xl border border-border bg-card">
      {/* Compact header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-foreground">{weekLabel}</h2>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateWeek("prev")}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={goToToday}>
              Today
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateWeek("next")}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Day headers row */}
      <div className="flex border-b border-border bg-card shrink-0">
        {/* Time column spacer */}
        <div className="w-16 shrink-0 border-r border-border" />
        {/* Day columns */}
        {weekDays.map((day, idx) => {
          const today = isDateToday(day);
          return (
            <div
              key={idx}
              className={cn(
                "flex-1 min-w-[100px] text-center py-2 border-r border-border last:border-r-0"
              )}
            >
              <div className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
                {format(day, "EEE")}
              </div>
              <div
                className={cn(
                  "text-sm font-semibold mt-0.5 inline-flex items-center justify-center",
                  today && "bg-primary text-primary-foreground rounded-full w-7 h-7"
                )}
              >
                {format(day, "d")}
              </div>
            </div>
          );
        })}
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <div className="flex" style={{ height: HOURS.length * HOUR_HEIGHT }}>
          {/* Time labels column */}
          <div className="w-16 shrink-0 border-r border-border relative">
            {HOURS.map((hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0 flex items-start justify-end pr-2"
                style={{ top: hour * HOUR_HEIGHT + 2 }}
              >
                <span className="text-xs text-muted-foreground">{formatHour(hour)}</span>
              </div>
            ))}
          </div>

          {/* Day columns grid */}
          {weekDays.map((day, dayIdx) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const today = isDateToday(day);

            return (
              <div
                key={dayIdx}
                className={cn(
                  "flex-1 min-w-[100px] relative border-r border-border last:border-r-0",
                  today && "bg-primary/5"
                )}
              >
                {/* Hour grid lines */}
                {HOURS.map((hour) => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-t border-border/50"
                    style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}
                  />
                ))}

                {/* Posts */}
                {HOURS.map((hour) => {
                  const key = `${dateKey}-${hour}`;
                  const items = itemsByDateHour.get(key) || [];
                  if (items.length === 0) return null;

                  const maxShow = 2;
                  const visible = items.slice(0, maxShow);
                  const overflow = items.length - maxShow;

                  return (
                    <div
                      key={hour}
                      className="absolute left-0.5 right-0.5 flex flex-col gap-0.5 z-10"
                      style={{ top: hour * HOUR_HEIGHT + 2 }}
                    >
                      {visible.map((item) => (
                        <PostChip key={item.id} item={item} onClick={() => onEditPost(item)} />
                      ))}
                      {overflow > 0 && (
                        <span className="text-[10px] text-muted-foreground pl-1">
                          +{overflow} more
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      </div>
    </div>
  );
};

// Compact post chip for time grid
const PostChip = ({
  item,
  onClick,
}: {
  item: ContentPlannerItem;
  onClick: () => void;
}) => {
  const platform = item.scheduled_platforms?.[0];
  const color = platform ? getPlatformColor(platform) : "hsl(var(--muted-foreground))";
  const label = item.title || (platform ? `${getPlatformName(platform)} Post` : "Post");

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] cursor-pointer truncate hover:opacity-80 transition-opacity border"
      style={{
        backgroundColor: `${color}15`,
        borderColor: `${color}40`,
        color: color,
      }}
    >
      {platform && getPlatformIcon(platform)}
      <span className="truncate font-medium">{label}</span>
      {item.scheduled_platforms && item.scheduled_platforms.length > 1 && (
        <span className="text-[9px] opacity-70">+{item.scheduled_platforms.length - 1}</span>
      )}
    </div>
  );
};
