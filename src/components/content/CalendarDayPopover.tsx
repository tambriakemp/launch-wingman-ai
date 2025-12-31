import { format } from "date-fns";
import { Plus, Pencil, CalendarClock, Trash2, CheckCircle2, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

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

interface CalendarDayPopoverProps {
  date: Date;
  items: ContentPlannerItem[];
  children: React.ReactNode;
  onCreatePost: (date: Date) => void;
  onEditPost: (item: ContentPlannerItem) => void;
  onSchedulePost: (item: ContentPlannerItem) => void;
  onDeletePost: (id: string) => void;
}

const CONTENT_TYPE_COLORS: Record<string, string> = {
  general: "bg-slate-500",
  stories: "bg-amber-500",
  offer: "bg-emerald-500",
  "behind-the-scenes": "bg-cyan-500",
};

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
          <ScrollArea className="max-h-64">
            <div className="p-2 space-y-2">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-2 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors group"
                >
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
                      <div className="flex items-center gap-1.5 mt-1">
                        {item.status === "completed" && item.scheduled_at && (
                          <Badge variant="secondary" className="text-[10px] h-5 gap-1">
                            <CheckCircle2 className="w-2.5 h-2.5" />
                            Posted
                          </Badge>
                        )}
                        {item.scheduled_at && item.status !== "completed" && (
                          <Badge variant="secondary" className="text-[10px] h-5 gap-1 bg-amber-500/10 text-amber-600 border-amber-200">
                            <Clock className="w-2.5 h-2.5" />
                            {format(new Date(item.scheduled_at), "h:mm a")}
                          </Badge>
                        )}
                        {item.scheduled_platforms && item.scheduled_platforms.length > 0 && (
                          <Badge variant="outline" className="text-[10px] h-5">
                            {item.scheduled_platforms.join(", ")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 mt-2 pt-2 border-t border-border">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs flex-1"
                      onClick={() => onEditPost(item)}
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs flex-1"
                      onClick={() => onSchedulePost(item)}
                    >
                      <CalendarClock className="w-3 h-3 mr-1" />
                      Schedule
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
              ))}
            </div>
          </ScrollArea>
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
