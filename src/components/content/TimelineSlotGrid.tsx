import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, Pencil, Plus, MoreHorizontal, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface TimelineSlotGridProps {
  projectId: string;
  onWritePost: (item: {
    id: string;
    title: string;
    description: string | null;
    contentType: string;
  }) => void;
}

interface ContentPlannerItem {
  id: string;
  title: string;
  description: string | null;
  content_type: string;
  phase: string;
  day_number: number;
  time_of_day: string;
  status: string;
  content: string | null;
}

const PHASES = [
  { 
    id: "pre-launch-week-1", 
    label: "Pre-Launch: Week 1", 
    description: "Build awareness and engagement",
    color: "bg-blue-500" 
  },
  { 
    id: "pre-launch-week-2", 
    label: "Pre-Launch: Week 2", 
    description: "Deepen connection with your audience",
    color: "bg-violet-500" 
  },
  { 
    id: "pre-launch-week-3", 
    label: "Pre-Launch: Week 3", 
    description: "Create anticipation and desire",
    color: "bg-purple-500" 
  },
  { 
    id: "pre-launch-week-4", 
    label: "Pre-Launch: Week 4", 
    description: "Prime for launch with urgency",
    color: "bg-fuchsia-500" 
  },
  { 
    id: "launch", 
    label: "Launch Week", 
    description: "Open doors and drive enrollment",
    color: "bg-rose-500" 
  },
];

const DAYS = [1, 2, 3, 4, 5, 6, 7];

const CONTENT_TYPE_COLORS: Record<string, string> = {
  general: "bg-slate-500",
  stories: "bg-amber-500",
  offer: "bg-emerald-500",
  "behind-the-scenes": "bg-cyan-500",
};

export const TimelineSlotGrid = ({ projectId, onWritePost }: TimelineSlotGridProps) => {
  const [expandedPhases, setExpandedPhases] = useState<string[]>(["pre-launch-week-1"]);
  const queryClient = useQueryClient();

  const { data: plannerItems = [], isLoading } = useQuery({
    queryKey: ["content-planner", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_planner")
        .select("*")
        .eq("project_id", projectId)
        .order("day_number", { ascending: true });
      if (error) throw error;
      return data as ContentPlannerItem[];
    },
  });

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) =>
      prev.includes(phaseId)
        ? prev.filter((id) => id !== phaseId)
        : [...prev, phaseId]
    );
  };

  const getPhaseItems = (phaseId: string) => {
    return plannerItems.filter((item) => item.phase === phaseId);
  };

  const getDayItems = (phaseId: string, day: number) => {
    return plannerItems.filter(
      (item) => item.phase === phaseId && item.day_number === day
    );
  };

  const getCompletionPercentage = (phaseId: string) => {
    const items = getPhaseItems(phaseId);
    if (items.length === 0) return 0;
    const completed = items.filter((item) => item.status === "completed" || item.status === "draft").length;
    return Math.round((completed / items.length) * 100);
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("content_planner")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
      toast.success("Removed from timeline");
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to remove");
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">Loading your timeline...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-foreground">Launch Content Timeline</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Content you've assigned to specific days. Click edit to write or update your posts.
        </p>
      </div>

      <div className="space-y-3">
        {PHASES.map((phase) => {
          const isExpanded = expandedPhases.includes(phase.id);
          const phaseItems = getPhaseItems(phase.id);
          const completionPercent = getCompletionPercentage(phase.id);

          return (
            <Card key={phase.id} variant="elevated" className="overflow-hidden">
              <div
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-accent/50 transition-colors"
                onClick={() => togglePhase(phase.id)}
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  )}
                  <div className={cn("w-3 h-3 rounded-full", phase.color)} />
                  <div>
                    <h3 className="font-semibold text-foreground">{phase.label}</h3>
                    <p className="text-sm text-muted-foreground">{phase.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{phaseItems.length} items</p>
                    <p className="text-xs text-muted-foreground">{completionPercent}% complete</p>
                  </div>
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${completionPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CardContent className="pt-0 pb-4">
                      {phaseItems.length === 0 ? (
                        <div className="text-center py-8 border border-dashed border-border rounded-lg bg-muted/20">
                          <p className="text-sm text-muted-foreground mb-2">No content for this week yet</p>
                          <p className="text-xs text-muted-foreground">
                            Go to the Ideas tab and click "Turn into a post" on any idea
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {DAYS.map((day) => {
                            const dayItems = getDayItems(phase.id, day);
                            if (dayItems.length === 0) return null;

                            return (
                              <div key={day} className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground pt-3 pb-1">
                                  <span>Day {day}</span>
                                  <div className="flex-1 h-px bg-border" />
                                </div>
                                {dayItems.map((item) => (
                                  <div
                                    key={item.id}
                                    className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/30 transition-colors group"
                                  >
                                    <div 
                                      className={cn(
                                        "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                        CONTENT_TYPE_COLORS[item.content_type] || "bg-slate-500"
                                      )}
                                    >
                                      <span className="text-xs font-bold text-white uppercase">
                                        {item.content_type.charAt(0)}
                                      </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                          <h4 className="font-medium text-foreground text-sm line-clamp-1">
                                            {item.title}
                                          </h4>
                                          {item.description && (
                                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                                              {item.description}
                                            </p>
                                          )}
                                          <div className="flex items-center gap-2 mt-1.5">
                                            <Badge variant="secondary" className="text-xs capitalize">
                                              {item.content_type.replace("-", " ")}
                                            </Badge>
                                            {item.status === "draft" && (
                                              <Badge variant="outline" className="text-xs">
                                                Draft ready
                                              </Badge>
                                            )}
                                          </div>
                                        </div>
                                        <DropdownMenu>
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                              <MoreHorizontal className="w-4 h-4" />
                                            </Button>
                                          </DropdownMenuTrigger>
                                          <DropdownMenuContent align="end">
                                            <DropdownMenuItem
                                              onClick={() =>
                                                onWritePost({
                                                  id: item.id,
                                                  title: item.title,
                                                  description: item.description,
                                                  contentType: item.content_type,
                                                })
                                              }
                                            >
                                              <Pencil className="w-4 h-4 mr-2" />
                                              Write / Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                              className="text-destructive"
                                              onClick={() => handleDelete(item.id)}
                                            >
                                              <Trash2 className="w-4 h-4 mr-2" />
                                              Remove
                                            </DropdownMenuItem>
                                          </DropdownMenuContent>
                                        </DropdownMenu>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>

      {plannerItems.length === 0 && (
        <div className="text-center py-12 border border-dashed border-border rounded-lg bg-muted/10">
          <p className="text-sm text-muted-foreground">
            No content assigned yet. Go to the Ideas tab and click "Turn into a post" on any idea.
          </p>
        </div>
      )}
    </div>
  );
};
