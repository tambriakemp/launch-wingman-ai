import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
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
import { CONTENT_TYPE_COLORS } from "./contentTypeColors";
import { PHASE_CONFIG, getPhaseLabel } from "@/data/timelineTemplates";

interface ContentPlannerItem {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  phase: string;
  day_number: number;
  status: string;
  scheduled_at: string | null;
  scheduled_platforms: string[] | null;
}

interface ContentCalendarViewProps {
  projectId: string;
  onCreatePost: () => void;
  onEditPost: (item: ContentPlannerItem) => void;
  onSchedulePost: (item: ContentPlannerItem) => void;
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
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
          <h2 className="text-lg font-semibold text-foreground ml-2">
            {format(currentMonth, "MMMM yyyy")}
          </h2>
        </div>
        <Button variant="outline" size="sm" onClick={goToToday}>
          Today
        </Button>
      </div>

      {/* Calendar Grid */}
      <Card className="overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 border-b border-border">
          {WEEKDAYS.map((day) => (
            <div
              key={day}
              className="py-2 text-center text-xs font-medium text-muted-foreground"
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
                    "min-h-32 p-2 border-b border-r border-border cursor-pointer transition-colors hover:bg-accent/50",
                    !isCurrentMonth && "bg-muted/30",
                    idx % 7 === 6 && "border-r-0"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <span
                      className={cn(
                        "text-sm w-6 h-6 flex items-center justify-center rounded-full",
                        !isCurrentMonth && "text-muted-foreground",
                        isToday && "bg-primary text-primary-foreground font-semibold"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                  </div>
                  
                  {/* Content Indicators */}
                  {hasItems && (
                    <div className="mt-1 space-y-0.5">
                      {dayItems.slice(0, 3).map((item) => {
                        const phaseConfig = PHASE_CONFIG[item.phase as keyof typeof PHASE_CONFIG];
                        const phaseLabel = getPhaseLabel(item.phase, item.day_number);
                        
                        return (
                          <div
                            key={item.id}
                            className={cn(
                              "text-[10px] text-white px-1.5 py-0.5 rounded truncate flex items-center gap-1",
                              CONTENT_TYPE_COLORS[item.content_type] || "bg-slate-500",
                              phaseConfig && `border-l-2 ${phaseConfig.borderColor}`
                            )}
                            title={`${phaseConfig?.fullLabel || ''} - ${item.title}`}
                          >
                            {phaseLabel && (
                              <span className="font-semibold opacity-80">{phaseLabel}</span>
                            )}
                            <span className="truncate">{item.title}</span>
                          </div>
                        );
                      })}
                      {dayItems.length > 3 && (
                        <div className="text-[10px] text-muted-foreground pl-1">
                          +{dayItems.length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CalendarDayPopover>
            );
          })}
        </div>
      </Card>

      {/* Legend */}
      <div className="space-y-2">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="font-medium">Content Types:</span>
          {Object.entries(CONTENT_TYPE_COLORS).map(([type, color]) => (
            <div key={type} className="flex items-center gap-1.5">
              <div className={cn("w-2.5 h-2.5 rounded", color)} />
              <span className="capitalize">{type.replace("-", " ")}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="font-medium">Launch Phases:</span>
          {Object.entries(PHASE_CONFIG).map(([phase, config]) => (
            <div key={phase} className="flex items-center gap-1.5">
              <div className={cn("w-2.5 h-2.5 rounded", config.color)} />
              <span>{config.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
