import { useState, useCallback, useEffect } from "react";
import { format, parseISO } from "date-fns";
import { Calendar, Rocket, FileText, Pencil, MoreHorizontal } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { LaunchCalendarEventDialog } from "@/components/LaunchCalendarEventDialog";

interface LaunchEvent {
  id: string;
  title: string;
  event_type: string;
  content_creation_start: string | null;
  prelaunch_start: string | null;
  enrollment_opens: string | null;
  enrollment_closes: string | null;
  program_delivery_start: string | null;
  program_delivery_end: string | null;
  rest_period_start: string | null;
  rest_period_end: string | null;
  program_weeks?: number | null;
  rest_weeks?: number | null;
}

interface LaunchTimelineProps {
  projectId: string;
  projectType: "launch" | "prelaunch";
}

export const LaunchTimeline = ({ projectId, projectType }: LaunchTimelineProps) => {
  const [launchEvents, setLaunchEvents] = useState<LaunchEvent[]>([]);
  const [editingEvent, setEditingEvent] = useState<LaunchEvent | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const fetchLaunchEvents = useCallback(async () => {
    if (!projectId) return;

    const { data, error } = await supabase
      .from("launch_events")
      .select("*")
      .eq("project_id", projectId)
      .order("prelaunch_start", { ascending: true });

    if (error) {
      console.error("Error fetching launch events:", error);
    } else {
      setLaunchEvents(data || []);
    }
  }, [projectId]);

  useEffect(() => {
    fetchLaunchEvents();
  }, [fetchLaunchEvents]);

  const handleEditEvent = (event: LaunchEvent) => {
    setEditingEvent(event);
    setEditDialogOpen(true);
  };

  if (launchEvents.length === 0) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card variant="elevated">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {projectType === "prelaunch" ? "Pre-Launch" : "Launch"} Timeline
                  </CardTitle>
                  <CardDescription>{launchEvents[0]?.title}</CardDescription>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleEditEvent(launchEvents[0])}>
                    <Pencil className="w-4 h-4 mr-2" />
                    Edit Dates
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {launchEvents[0]?.prelaunch_start && (
                <div className="p-3 rounded-lg bg-accent/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Rocket className="w-4 h-4" />
                    <span className="text-xs font-medium">Prelaunch Starts</span>
                  </div>
                  <p className="font-semibold text-foreground">
                    {format(parseISO(launchEvents[0].prelaunch_start), "MMM d, yyyy")}
                  </p>
                </div>
              )}
              {launchEvents[0]?.enrollment_opens && (
                <div className="p-3 rounded-lg bg-accent/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Rocket className="w-4 h-4" />
                    <span className="text-xs font-medium">Enrollment Opens</span>
                  </div>
                  <p className="font-semibold text-foreground">
                    {format(parseISO(launchEvents[0].enrollment_opens), "MMM d, yyyy")}
                  </p>
                </div>
              )}
              {launchEvents[0]?.enrollment_closes && (
                <div className="p-3 rounded-lg bg-accent/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <Calendar className="w-4 h-4" />
                    <span className="text-xs font-medium">Enrollment Closes</span>
                  </div>
                  <p className="font-semibold text-foreground">
                    {format(parseISO(launchEvents[0].enrollment_closes), "MMM d, yyyy")}
                  </p>
                </div>
              )}
              {launchEvents[0]?.program_delivery_start && (
                <div className="p-3 rounded-lg bg-accent/50">
                  <div className="flex items-center gap-2 text-muted-foreground mb-1">
                    <FileText className="w-4 h-4" />
                    <span className="text-xs font-medium">Program Starts</span>
                  </div>
                  <p className="font-semibold text-foreground">
                    {format(parseISO(launchEvents[0].program_delivery_start), "MMM d, yyyy")}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Edit Event Dialog */}
      {editingEvent && (
        <LaunchCalendarEventDialog
          projectId={projectId}
          projectType={projectType}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          editEvent={editingEvent}
          onEventAdded={fetchLaunchEvents}
        />
      )}
    </>
  );
};
