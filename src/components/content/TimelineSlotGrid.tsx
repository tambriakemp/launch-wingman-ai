import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, MoreHorizontal, Trash2, CalendarClock, Clock, CheckCircle2, Crown, Plus, List, CalendarDays } from "lucide-react";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { PostEditorSheet } from "./PostEditorSheet";

import { ContentCalendarView } from "./ContentCalendarView";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { UpgradeDialog } from "@/components/UpgradeDialog";

type ViewMode = "timeline" | "calendar";

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
  scheduled_at: string | null;
  scheduled_platforms: string[] | null;
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
  const { isSubscribed, user } = useAuth();
  const [viewMode, setViewMode] = useState<ViewMode>("timeline");
  const [expandedPhases, setExpandedPhases] = useState<string[]>(["pre-launch-week-1"]);
  const [postEditorOpen, setPostEditorOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentPlannerItem | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
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

  const handleOpenEditor = (item: ContentPlannerItem) => {
    setSelectedItem(item);
    setIsCreateMode(false);
    setPostEditorOpen(true);
  };

  const handleEditorSaved = () => {
    queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
  };

  const handleUnschedule = async (id: string) => {
    try {
      const { error } = await supabase
        .from("content_planner")
        .update({
          scheduled_at: null,
          scheduled_platforms: [],
        })
        .eq("id", id);

      if (error) throw error;

      // Also delete any pending scheduled posts
      await supabase
        .from("scheduled_posts")
        .delete()
        .eq("content_item_id", id)
        .eq("status", "pending");

      queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
      toast.success("Post unscheduled");
    } catch (error) {
      console.error("Error unscheduling:", error);
      toast.error("Failed to unschedule");
    }
  };

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

  const handleDeleteClick = (id: string) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("content_planner")
        .delete()
        .eq("id", itemToDelete);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
      toast.success("Removed from timeline");
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting:", error);
      toast.error("Failed to remove");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCalendarEditPost = (item: ContentPlannerItem) => {
    onWritePost({
      id: item.id,
      title: item.title,
      description: item.description,
      contentType: item.content_type,
    });
  };

  const handleCalendarSchedulePost = (item: ContentPlannerItem) => {
    if (isSubscribed) {
      handleOpenEditor(item);
    } else {
      setShowUpgradeDialog(true);
    }
  };

  const handleCreateNewPost = () => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    if (!isSubscribed) {
      setShowUpgradeDialog(true);
      return;
    }

    // Open the editor in create mode - no DB record created until save/schedule
    setSelectedItem(null);
    setIsCreateMode(true);
    setPostEditorOpen(true);
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
      {/* Header with view toggle and create button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Launch Content Timeline</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {viewMode === "timeline" 
              ? "Content organized by launch phases. Click edit to write or update posts."
              : "View scheduled content on your calendar. Click any day to manage posts."}
          </p>
        </div>
        
        <div className="flex flex-col items-end gap-2">
          <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && setViewMode(v as ViewMode)}>
            <ToggleGroupItem value="timeline" aria-label="Timeline view" className="gap-1.5">
              <List className="w-4 h-4" />
              <span className="hidden sm:inline">Timeline</span>
            </ToggleGroupItem>
            <ToggleGroupItem value="calendar" aria-label="Calendar view" className="gap-1.5">
              <CalendarDays className="w-4 h-4" />
              <span className="hidden sm:inline">Calendar</span>
            </ToggleGroupItem>
          </ToggleGroup>
          
          <Button size="sm" onClick={handleCreateNewPost}>
            <Plus className="w-4 h-4 mr-2" />
            Create Post
          </Button>
        </div>
      </div>

      {/* View Content */}
      {viewMode === "calendar" ? (
        <ContentCalendarView
          projectId={projectId}
          onCreatePost={handleCreateNewPost}
          onEditPost={handleCalendarEditPost}
          onSchedulePost={handleCalendarSchedulePost}
        />
      ) : (
        <>
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
                                            {item.status === "draft" && !item.scheduled_at && (
                                              <Badge variant="outline" className="text-xs">
                                                Draft ready
                                              </Badge>
                                            )}
                                            {item.status === "completed" && item.scheduled_at && (
                                              <Badge className="text-xs bg-primary/10 text-primary border-primary/20 gap-1">
                                                <CheckCircle2 className="w-3 h-3" />
                                                Posted {format(new Date(item.scheduled_at), "MMM d")}
                                              </Badge>
                                            )}
                                            {item.scheduled_at && item.status !== "completed" && (
                                              <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                  <Badge 
                                                    className="text-xs bg-amber-500/10 text-amber-600 border-amber-200 gap-1 cursor-pointer hover:bg-amber-500/20 transition-colors"
                                                  >
                                                    <Clock className="w-3 h-3" />
                                                    Scheduled: {format(new Date(item.scheduled_at), "MMM d, h:mm a")}
                                                  </Badge>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="start">
                                                  <DropdownMenuItem onClick={() => handleOpenEditor(item)}>
                                                    <CalendarClock className="w-4 h-4 mr-2" />
                                                    Reschedule
                                                  </DropdownMenuItem>
                                                  <DropdownMenuSeparator />
                                                  <DropdownMenuItem 
                                                    className="text-destructive"
                                                    onClick={() => handleUnschedule(item.id)}
                                                  >
                                                    <Trash2 className="w-4 h-4 mr-2" />
                                                    Unschedule
                                                  </DropdownMenuItem>
                                                </DropdownMenuContent>
                                              </DropdownMenu>
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
                                          <DropdownMenuContent align="end" className="min-w-[160px]">
                                            <DropdownMenuItem
                                              onClick={() => {
                                                if (item.status === "completed") {
                                                  handleOpenEditor(item);
                                                } else if (isSubscribed) {
                                                  handleOpenEditor(item);
                                                } else {
                                                  setShowUpgradeDialog(true);
                                                }
                                              }}
                                            >
                                              <CalendarClock className="w-4 h-4 mr-2" />
                                              {item.status === "completed" ? "View Posted" : "Schedule / Edit"}
                                              {item.status !== "completed" && !isSubscribed && (
                                                <Crown className="w-3.5 h-3.5 ml-auto text-yellow-500" />
                                              )}
                                            </DropdownMenuItem>
                                            <DropdownMenuSeparator />
                                            <DropdownMenuItem
                                              className="text-destructive"
                                              onClick={() => handleDeleteClick(item.id)}
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

      {plannerItems.length === 0 && viewMode === "timeline" && (
        <div className="text-center py-12 border border-dashed border-border rounded-lg bg-muted/10">
          <p className="text-sm text-muted-foreground mb-3">
            No content assigned yet.
          </p>
          <Button variant="outline" size="sm" onClick={handleCreateNewPost}>
            <Plus className="w-4 h-4 mr-2" />
            Create your first post
          </Button>
        </div>
      )}
      </>
      )}

      {/* Post Editor Sheet */}
      <PostEditorSheet
        open={postEditorOpen}
        onOpenChange={setPostEditorOpen}
        projectId={projectId}
        existingItem={selectedItem}
        isCreateMode={isCreateMode}
        onSaved={handleEditorSaved}
      />

      {/* Upgrade Dialog for scheduling feature */}
      <UpgradeDialog 
        open={showUpgradeDialog} 
        onOpenChange={setShowUpgradeDialog} 
        feature="Social Media Scheduling"
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Remove from Timeline"
        description="Are you sure you want to remove this content from your timeline? This action cannot be undone."
        isDeleting={isDeleting}
      />
    </div>
  );
};
