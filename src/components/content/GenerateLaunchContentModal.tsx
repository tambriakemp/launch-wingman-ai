import { useState } from "react";
import { format, addDays } from "date-fns";
import { CalendarIcon, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { TIMELINE_TEMPLATES, TimelineTemplate, mapTemplatesToDates } from "@/data/timelineTemplates";
import { trackTimelineSuggestion, trackContentGeneration } from "@/lib/analytics";

interface GenerateLaunchContentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
}

const PHASE_COLORS: Record<string, string> = {
  "pre-launch-week-1": "bg-blue-500",
  "pre-launch-week-2": "bg-violet-500",
  "pre-launch-week-3": "bg-purple-500",
  "pre-launch-week-4": "bg-fuchsia-500",
  "launch": "bg-rose-500",
};

export const GenerateLaunchContentModal = ({
  open,
  onOpenChange,
  projectId,
}: GenerateLaunchContentModalProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Check for existing launch content
  const { data: existingContent = [] } = useQuery({
    queryKey: ["content-planner-launch", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_planner")
        .select("id, phase, status")
        .eq("project_id", projectId)
        .in("phase", [
          "pre-launch-week-1",
          "pre-launch-week-2",
          "pre-launch-week-3",
          "pre-launch-week-4",
          "launch",
        ]);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const hasExistingContent = existingContent.length > 0;
  const nonCompletedCount = existingContent.filter(
    (c) => c.status !== "completed" && c.status !== "posted"
  ).length;

  // Calculate timeline dates
  const getTimelinePreview = () => {
    if (!selectedDate) return null;
    const prelaunchEnd = addDays(selectedDate, 27); // 4 weeks = 28 days
    const launchStart = addDays(selectedDate, 28);
    const launchEnd = addDays(selectedDate, 31); // 4 days of launch
    return {
      prelaunchStart: selectedDate,
      prelaunchEnd,
      launchStart,
      launchEnd,
    };
  };

  const timeline = getTimelinePreview();

  const handleGenerate = async () => {
    if (!user || !selectedDate) return;

    setIsGenerating(true);

    try {
      // If there's existing non-completed content, delete it first
      if (nonCompletedCount > 0) {
        const idsToDelete = existingContent
          .filter((c) => c.status !== "completed" && c.status !== "posted")
          .map((c) => c.id);

        const { error: deleteError } = await supabase
          .from("content_planner")
          .delete()
          .in("id", idsToDelete);

        if (deleteError) throw deleteError;
      }

      // Delete existing suggestions
      await supabase
        .from("timeline_suggestions")
        .delete()
        .eq("project_id", projectId);

      // Get all templates and map to dates
      const templatesWithDates = mapTemplatesToDates(selectedDate);
      setProgress({ current: 0, total: templatesWithDates.length });

      // Generate suggestions and create content items in batches
      let generatedCount = 0;

      for (let i = 0; i < templatesWithDates.length; i += 3) {
        const batch = templatesWithDates.slice(i, i + 3);

        await Promise.all(
          batch.map(async (item) => {
            try {
              // Generate AI suggestion
              const { data, error } = await supabase.functions.invoke(
                "generate-timeline-suggestions",
                {
                  body: { projectId, template: item.template },
                }
              );

              if (error) throw error;

              // Create content planner item with scheduled date
              const scheduledAt = new Date(item.date);
              scheduledAt.setHours(
                item.template.time_of_day === "morning" ? 9 : 18,
                0,
                0,
                0
              );

              const { error: insertError } = await supabase
                .from("content_planner")
                .insert({
                  project_id: projectId,
                  user_id: user.id,
                  phase: item.template.phase,
                  day_number: item.template.day_number,
                  time_of_day: item.template.time_of_day,
                  content_type: data.content_type,
                  title: data.title,
                  description: data.description,
                  status: "planned",
                  scheduled_at: scheduledAt.toISOString(),
                });

              if (insertError) throw insertError;

              generatedCount++;
              trackTimelineSuggestion("generate");
              trackContentGeneration(data.content_type);
            } catch (err) {
              console.error("Error generating item:", err);
            }
          })
        );

        setProgress((prev) => ({
          ...prev,
          current: Math.min(i + 3, templatesWithDates.length),
        }));
      }

      queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
      queryClient.invalidateQueries({ queryKey: ["timeline-suggestions", projectId] });

      toast.success(`Generated ${generatedCount} content ideas on your calendar!`);
      onOpenChange(false);
    } catch (error) {
      console.error("Error generating content:", error);
      toast.error("Failed to generate content. Please try again.");
    } finally {
      setIsGenerating(false);
      setProgress({ current: 0, total: 0 });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Generate Launch Content
          </DialogTitle>
          <DialogDescription>
            Plan 5 weeks of strategic content for your launch. AI will generate
            personalized ideas based on your project details.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Date Picker */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              When does your pre-launch start?
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !selectedDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, "MMMM d, yyyy")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Timeline Preview */}
          {timeline && (
            <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
              <h4 className="text-sm font-medium text-foreground">
                Timeline Preview
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-muted-foreground">Pre-Launch:</span>
                  <span className="text-foreground">
                    {format(timeline.prelaunchStart, "MMM d")} -{" "}
                    {format(timeline.prelaunchEnd, "MMM d")}
                  </span>
                  <span className="text-muted-foreground">(4 weeks)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <span className="text-muted-foreground">Launch Week:</span>
                  <span className="text-foreground">
                    {format(timeline.launchStart, "MMM d")} -{" "}
                    {format(timeline.launchEnd, "MMM d")}
                  </span>
                  <span className="text-muted-foreground">(4 days)</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                ~{TIMELINE_TEMPLATES.length} content ideas will be generated
              </p>
            </div>
          )}

          {/* Existing Content Warning */}
          {hasExistingContent && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  You have {existingContent.length} existing launch content items
                </p>
                <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                  {nonCompletedCount > 0
                    ? `${nonCompletedCount} planned/draft items will be replaced. Posted content will be kept.`
                    : "All items are posted and will be kept."}
                </p>
              </div>
            </div>
          )}

          {/* Progress */}
          {isGenerating && progress.total > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Generating ideas...</span>
                <span className="font-medium">
                  {progress.current} / {progress.total}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{
                    width: `${(progress.current / progress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isGenerating}
          >
            Cancel
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={!selectedDate || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate All Ideas
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
