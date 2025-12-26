import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

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
  { id: "pre-launch-week-1", label: "Pre-Launch: Week 1" },
  { id: "pre-launch-week-2", label: "Pre-Launch: Week 2" },
  { id: "pre-launch-week-3", label: "Pre-Launch: Week 3" },
  { id: "pre-launch-week-4", label: "Pre-Launch: Week 4" },
  { id: "launch", label: "Launch Week" },
];

const DAYS = [1, 2, 3, 4, 5, 6, 7];

export const TimelineSlotGrid = ({ projectId, onWritePost }: TimelineSlotGridProps) => {
  const [openPhases, setOpenPhases] = useState<Set<string>>(new Set(["pre-launch-week-1"]));

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
    setOpenPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  const getItemsForSlot = (phase: string, day: number, timeOfDay: string) => {
    return plannerItems.filter(
      (item) =>
        item.phase === phase &&
        item.day_number === day &&
        item.time_of_day === timeOfDay
    );
  };

  const getPhaseItemCount = (phaseId: string) => {
    return plannerItems.filter((item) => item.phase === phaseId).length;
  };

  if (isLoading) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-muted-foreground">Loading your timeline...</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="mb-4">
        <h2 className="text-lg font-medium text-foreground">My Content Timeline</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Content you've assigned to specific days. Click on a slot to add or edit content.
        </p>
      </div>

      {PHASES.map((phase) => {
        const isOpen = openPhases.has(phase.id);
        const itemCount = getPhaseItemCount(phase.id);

        return (
          <Collapsible
            key={phase.id}
            open={isOpen}
            onOpenChange={() => togglePhase(phase.id)}
          >
            <CollapsibleTrigger asChild>
              <button className="flex items-center gap-2 w-full py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors text-left border border-border/50 bg-card/30">
                {isOpen ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                )}
                <span className="text-sm font-medium text-foreground">
                  {phase.label}
                </span>
                {itemCount > 0 && (
                  <Badge variant="secondary" className="ml-auto text-xs">
                    {itemCount} posts
                  </Badge>
                )}
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent className="mt-2">
              <div className="space-y-2 pl-6">
                {DAYS.map((day) => (
                  <div key={day} className="space-y-1">
                    <div className="text-xs font-medium text-muted-foreground py-1">
                      Day {day}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {["morning", "evening"].map((timeOfDay) => {
                        const slotItems = getItemsForSlot(phase.id, day, timeOfDay);
                        const hasContent = slotItems.length > 0;

                        return (
                          <div
                            key={timeOfDay}
                            className={cn(
                              "rounded-lg border p-3 min-h-[60px] transition-colors",
                              hasContent
                                ? "border-border bg-card"
                                : "border-dashed border-border/50 bg-muted/20 hover:bg-muted/30"
                            )}
                          >
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">
                              {timeOfDay}
                            </div>
                            {hasContent ? (
                              <div className="space-y-2">
                                {slotItems.map((item) => (
                                  <div key={item.id} className="group">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">
                                          {item.title}
                                        </p>
                                        <Badge
                                          variant="outline"
                                          className="text-[10px] mt-1"
                                        >
                                          {item.content_type}
                                        </Badge>
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() =>
                                          onWritePost({
                                            id: item.id,
                                            title: item.title,
                                            description: item.description,
                                            contentType: item.content_type,
                                          })
                                        }
                                      >
                                        <Pencil className="w-3 h-3" />
                                      </Button>
                                    </div>
                                    {item.status === "draft" && (
                                      <p className="text-xs text-muted-foreground mt-1">
                                        Draft ready
                                      </p>
                                    )}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="flex items-center justify-center h-full">
                                <span className="text-xs text-muted-foreground/70">
                                  + Add content
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        );
      })}

      {plannerItems.length === 0 && (
        <div className="text-center py-8 border border-dashed border-border rounded-lg">
          <p className="text-sm text-muted-foreground">
            No content assigned yet. Go to the Ideas tab and click "Add to timeline" on any idea.
          </p>
        </div>
      )}
    </div>
  );
};