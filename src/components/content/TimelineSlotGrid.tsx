import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronRight, MoreHorizontal, Trash2, CalendarClock, Clock, CheckCircle2, Crown, Plus, Sparkles, Loader2, Eye, Lock, ClipboardList, MessageSquare, ArrowRight } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { PostEditorSheet } from "./PostEditorSheet";
import { SuggestionViewDialog } from "./SuggestionViewDialog";
import { getDayTemplates, TimelineTemplate } from "@/data/timelineTemplates";
import { trackTimelineSuggestion, trackContentGeneration } from "@/lib/analytics";
import { getPlanningTasks, getMessagingTasks } from "@/data/taskTemplates";
import { Link } from "react-router-dom";

import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { UpgradeDialog } from "@/components/UpgradeDialog";
import { CONTENT_TYPE_COLORS, CONTENT_TYPE_LABELS } from "./contentTypeColors";

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

interface GeneratedSuggestion {
  id?: string;
  title: string;
  description: string;
  template_type: string;
  content_type: string;
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

export const TimelineSlotGrid = ({ projectId, onWritePost }: TimelineSlotGridProps) => {
  const { user } = useAuth();
  const { isSubscribed, hasAdminAccess } = useFeatureAccess();
  const hasFullAccess = isSubscribed || hasAdminAccess;
  const [expandedPhases, setExpandedPhases] = useState<string[]>(["pre-launch-week-1"]);
  const [postEditorOpen, setPostEditorOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ContentPlannerItem | null>(null);
  const [isCreateMode, setIsCreateMode] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const queryClient = useQueryClient();
  
  // State for AI-generated suggestions (local state for immediate UI updates)
  const [localSuggestions, setLocalSuggestions] = useState<Record<string, GeneratedSuggestion>>({});
  const [loadingSuggestions, setLoadingSuggestions] = useState<Record<string, boolean>>({});
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  
  // State for creating from suggestion
  const [creatingFromSuggestion, setCreatingFromSuggestion] = useState<string | null>(null);
  
  // State for view dialog
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedSuggestionKey, setSelectedSuggestionKey] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<TimelineTemplate | null>(null);
  
  // State for clear all confirmation dialog
  const [clearAllDialogOpen, setClearAllDialogOpen] = useState(false);
  const [isClearingAll, setIsClearingAll] = useState(false);
  
  // State for creating post from specific slot
  const [createSlotContext, setCreateSlotContext] = useState<{
    phase: string;
    dayNumber: number;
    timeOfDay: string;
  } | null>(null);

  // Fetch project task completion status for phase gate
  const { data: projectTasks = [] } = useQuery({
    queryKey: ["project-tasks-status", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_tasks")
        .select("task_id, status")
        .eq("project_id", projectId);
      if (error) throw error;
      return data;
    },
  });

  // Check if planning and messaging phases are complete
  const planningTaskIds = getPlanningTasks().map(t => t.taskId);
  const messagingTaskIds = getMessagingTasks().map(t => t.taskId);
  
  const completedTaskIds = new Set(
    projectTasks.filter(t => t.status === 'completed').map(t => t.task_id)
  );
  
  const planningComplete = planningTaskIds.every(id => completedTaskIds.has(id));
  const messagingComplete = messagingTaskIds.every(id => completedTaskIds.has(id));
  const phasesComplete = planningComplete && messagingComplete;

  // Fetch existing content planner items
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

  // Fetch persisted suggestions from database
  const { data: dbSuggestions = [] } = useQuery({
    queryKey: ["timeline-suggestions", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timeline_suggestions")
        .select("*")
        .eq("project_id", projectId);
      if (error) throw error;
      return data;
    },
  });

  // Merge DB suggestions with local state
  const suggestions = { ...localSuggestions };
  dbSuggestions.forEach((s: any) => {
    const key = `${s.phase}-${s.day_number}-${s.time_of_day}`;
    if (!suggestions[key]) {
      suggestions[key] = {
        id: s.id,
        title: s.title,
        description: s.description,
        template_type: s.template_type,
        content_type: s.content_type,
      };
    }
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

  // Check if a template slot is already filled by an existing item
  const isSlotFilled = (phaseId: string, dayNumber: number, timeOfDay: string) => {
    return plannerItems.some(
      item => item.phase === phaseId && 
              item.day_number === dayNumber && 
              item.time_of_day === timeOfDay
    );
  };

  // Get suggestion key for tracking state
  const getSuggestionKey = (template: TimelineTemplate) => {
    return `${template.phase}-${template.day_number}-${template.time_of_day}`;
  };

  // Generate AI suggestion for a single template and save to DB
  const generateSuggestion = async (template: TimelineTemplate) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }
    
    const key = getSuggestionKey(template);
    setLoadingSuggestions(prev => ({ ...prev, [key]: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke('generate-timeline-suggestions', {
        body: { projectId, template }
      });
      
      if (error) throw error;
      
      // Save to database (upsert)
      const { error: dbError } = await supabase
        .from("timeline_suggestions")
        .upsert({
          project_id: projectId,
          user_id: user.id,
          phase: template.phase,
          day_number: template.day_number,
          time_of_day: template.time_of_day,
          template_type: data.template_type,
          content_type: data.content_type,
          title: data.title,
          description: data.description,
        }, { onConflict: 'project_id,phase,day_number,time_of_day' });
      
      if (dbError) {
        console.error("Error saving suggestion to DB:", dbError);
      }
      
      // Update local state for immediate UI feedback
      setLocalSuggestions(prev => ({ ...prev, [key]: data }));
      
      // Track GA event
      trackTimelineSuggestion('generate');
      
      // Refresh DB suggestions
      queryClient.invalidateQueries({ queryKey: ["timeline-suggestions", projectId] });
    } catch (error) {
      console.error("Error generating suggestion:", error);
      toast.error("Failed to generate suggestion");
    } finally {
      setLoadingSuggestions(prev => ({ ...prev, [key]: false }));
    }
  };

  // Generate suggestions for all empty slots across ALL phases
  const generateAllIdeas = async () => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    // Collect all empty templates across all phases
    const allEmptyTemplates: TimelineTemplate[] = [];
    
    for (const phase of PHASES) {
      const days = phase.id === "launch" ? [1, 2, 3, 4] : DAYS;
      for (const day of days) {
        const dayTemplates = getDayTemplates(phase.id, day);
        const emptyTemplates = dayTemplates.filter(
          t => !isSlotFilled(phase.id, t.day_number, t.time_of_day) && 
               !suggestions[getSuggestionKey(t)]
        );
        allEmptyTemplates.push(...emptyTemplates);
      }
    }
    
    if (allEmptyTemplates.length === 0) {
      toast.info("All slots already have suggestions or content");
      return;
    }
    
    setIsGeneratingAll(true);
    
    try {
      // Generate in batches of 3 for better UX
      let generatedCount = 0;
      for (let i = 0; i < allEmptyTemplates.length; i += 3) {
        const batch = allEmptyTemplates.slice(i, i + 3);
        await Promise.all(batch.map(t => generateSuggestion(t)));
        generatedCount += batch.length;
      }
      toast.success(`Generated ${generatedCount} ideas across all phases`);
    } catch (error) {
      console.error("Error generating all suggestions:", error);
      toast.error("Failed to generate some suggestions");
    } finally {
      setIsGeneratingAll(false);
    }
  };

  // Create a post from a suggestion
  const createFromSuggestion = async (template: TimelineTemplate, suggestion: GeneratedSuggestion) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }
    
    const key = getSuggestionKey(template);
    setCreatingFromSuggestion(key);
    
    try {
      const { error } = await supabase
        .from("content_planner")
        .insert({
          project_id: projectId,
          user_id: user.id,
          phase: template.phase,
          day_number: template.day_number,
          time_of_day: template.time_of_day,
          content_type: suggestion.content_type,
          title: suggestion.title,
          description: suggestion.description,
          status: "planned",
        });
      
      if (error) throw error;
      
      // Delete the suggestion from DB since it's now a real item
      await supabase
        .from("timeline_suggestions")
        .delete()
        .eq("project_id", projectId)
        .eq("phase", template.phase)
        .eq("day_number", template.day_number)
        .eq("time_of_day", template.time_of_day);
      
      // Clear local state
      setLocalSuggestions(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      
      // Close view dialog if open
      setViewDialogOpen(false);
      
      // Track GA event
      trackTimelineSuggestion('accept');
      trackContentGeneration(suggestion.content_type);
      
      queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
      queryClient.invalidateQueries({ queryKey: ["timeline-suggestions", projectId] });
      toast.success("Added to timeline");
    } catch (error) {
      console.error("Error creating from suggestion:", error);
      toast.error("Failed to create post");
    } finally {
      setCreatingFromSuggestion(null);
    }
  };

  const getCompletionPercentage = (phaseId: string) => {
    const items = getPhaseItems(phaseId);
    const templates = getDayTemplates(phaseId, 1)
      .concat(getDayTemplates(phaseId, 2))
      .concat(getDayTemplates(phaseId, 3))
      .concat(getDayTemplates(phaseId, 4))
      .concat(getDayTemplates(phaseId, 5))
      .concat(getDayTemplates(phaseId, 6))
      .concat(getDayTemplates(phaseId, 7));
    
    if (templates.length === 0) return 0;
    const filled = items.length;
    return Math.round((filled / templates.length) * 100);
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

    if (!hasFullAccess) {
      setShowUpgradeDialog(true);
      return;
    }

    // Open the editor in create mode - no DB record created until save/schedule
    setSelectedItem(null);
    setIsCreateMode(true);
    setCreateSlotContext(null);
    setPostEditorOpen(true);
  };

  // Create post from a specific slot (auto-assigns to that slot)
  const handleCreatePostFromSlot = (template: TimelineTemplate) => {
    if (!user) {
      toast.error("You must be logged in");
      return;
    }

    if (!hasFullAccess) {
      setShowUpgradeDialog(true);
      return;
    }

    setCreateSlotContext({
      phase: template.phase,
      dayNumber: template.day_number,
      timeOfDay: template.time_of_day,
    });
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

  // Phase gate: require planning and messaging to be complete
  if (!phasesComplete) {
    const planningProgress = planningTaskIds.filter(id => completedTaskIds.has(id)).length;
    const messagingProgress = messagingTaskIds.filter(id => completedTaskIds.has(id)).length;

    return (
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Launch Content Timeline</h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI-suggested content slots for your launch. Generate ideas or add your own.
          </p>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-4">
              <Lock className="w-7 h-7 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Complete Planning & Messaging First
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mb-6">
              Your launch content will be personalized based on your audience, messaging, and offer. 
              Complete these phases to unlock your timeline.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-sm">
              <div className="flex-1 p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <ClipboardList className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Planning</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all",
                        planningComplete ? "bg-green-500" : "bg-primary"
                      )}
                      style={{ width: `${(planningProgress / planningTaskIds.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {planningProgress}/{planningTaskIds.length}
                  </span>
                </div>
              </div>

              <div className="flex-1 p-4 rounded-lg border bg-card">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Messaging</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full transition-all",
                        messagingComplete ? "bg-green-500" : "bg-primary"
                      )}
                      style={{ width: `${(messagingProgress / messagingTaskIds.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {messagingProgress}/{messagingTaskIds.length}
                  </span>
                </div>
              </div>
            </div>

            <Button asChild className="mt-6">
              <Link to={`/projects/${projectId}/tasks`}>
                Go to Tasks
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Generate All Ideas button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Launch Content Timeline</h2>
          <p className="text-sm text-muted-foreground mt-1">
            AI-suggested content slots for your launch. Generate ideas or add your own.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {(Object.keys(suggestions).length > 0 || plannerItems.some(item => item.status !== "completed")) && (
            <Button 
              size="sm" 
              variant="outline"
              onClick={() => setClearAllDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          )}
          <Button
            size="sm" 
            onClick={generateAllIdeas}
            disabled={isGeneratingAll}
          >
            {isGeneratingAll ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate All Ideas
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Timeline Content */}
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
                      <div className="space-y-1">
                        {(phase.id === "launch" ? [1, 2, 3, 4] : DAYS).map((day) => {
                          const dayItems = getDayItems(phase.id, day);
                          const dayTemplates = getDayTemplates(phase.id, day);
                          
                          // Skip days with no templates (e.g., days 5-7 for launch phase)
                          if (dayTemplates.length === 0 && dayItems.length === 0) return null;

                          return (
                            <div key={day} className="space-y-2">
                              <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground pt-3 pb-1">
                                <span>Day {day}</span>
                                <div className="flex-1 h-px bg-border" />
                              </div>
                              
                              {/* Existing items */}
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
                                          <Badge
                                            variant="secondary"
                                            className={cn(
                                              "text-xs text-white",
                                              CONTENT_TYPE_COLORS[item.content_type] || "bg-slate-500"
                                            )}
                                          >
                                            {CONTENT_TYPE_LABELS[item.content_type] || item.content_type.replace(/-/g, " ")}
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
                                            {item.status !== "completed" && !hasFullAccess && (
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
                              
                              {/* Suggested slots (unfilled templates) */}
                              {dayTemplates
                                .filter(t => !isSlotFilled(phase.id, t.day_number, t.time_of_day))
                                .map((template) => {
                                  const key = getSuggestionKey(template);
                                  const suggestion = suggestions[key];
                                  const isLoading = loadingSuggestions[key];
                                  const isCreating = creatingFromSuggestion === key;
                                  
                                  return (
                                    <div
                                      key={key}
                                      className={cn(
                                        "flex items-start gap-3 p-3 rounded-lg border-2 border-dashed transition-colors",
                                        suggestion 
                                          ? "border-primary/40 bg-primary/5" 
                                          : "border-border/60 bg-muted/20"
                                      )}
                                    >
                                      <div 
                                        className={cn(
                                          "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0",
                                          suggestion 
                                            ? CONTENT_TYPE_COLORS[suggestion.content_type] || "bg-slate-500"
                                            : "bg-muted"
                                        )}
                                      >
                                        {isLoading ? (
                                          <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                                        ) : (
                                          <Sparkles className={cn(
                                            "w-4 h-4",
                                            suggestion ? "text-white" : "text-muted-foreground"
                                          )} />
                                        )}
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1 min-w-0">
                                            {suggestion ? (
                                              <>
                                                <h4 className="font-medium text-foreground text-sm line-clamp-2">
                                                  {suggestion.title}
                                                </h4>
                                                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                                  {suggestion.description}
                                                </p>
                                              </>
                                            ) : (
                                              <>
                                                <h4 className="font-medium text-muted-foreground text-sm">
                                                  {template.title_template}
                                                </h4>
                                                <p className="text-xs text-muted-foreground/70 line-clamp-1 mt-0.5">
                                                  {template.time_of_day} • {template.template_type.replace(/-/g, ' ')}
                                                </p>
                                              </>
                                            )}
                                            <div className="flex items-center gap-2 mt-2">
                                              <Badge 
                                                variant="outline" 
                                                className={cn(
                                                  "text-xs",
                                                  suggestion && "border-primary/30 text-primary"
                                                )}
                                              >
                                                {suggestion ? "AI Generated" : "Suggested"}
                                              </Badge>
                                              <Badge
                                                variant="secondary"
                                                className={cn(
                                                  "text-xs text-white",
                                                  CONTENT_TYPE_COLORS[template.content_type] || "bg-slate-500"
                                                )}
                                              >
                                                {CONTENT_TYPE_LABELS[template.content_type] || template.content_type.replace(/-/g, " ")}
                                              </Badge>
                                            </div>
                                          </div>
                                          <div className="flex gap-1">
                                            {suggestion ? (
                                              <>
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => {
                                                    setSelectedSuggestionKey(key);
                                                    setSelectedTemplate(template);
                                                    setViewDialogOpen(true);
                                                  }}
                                                  className="h-8 px-2"
                                                  title="View full suggestion"
                                                >
                                                  <Eye className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button
                                                  variant="default"
                                                  size="sm"
                                                  onClick={() => createFromSuggestion(template, suggestion)}
                                                  disabled={isCreating}
                                                  className="h-8"
                                                >
                                                  {isCreating ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                  ) : (
                                                    <>
                                                      <Plus className="w-3.5 h-3.5 mr-1" />
                                                      Add
                                                    </>
                                                  )}
                                                </Button>
                                                <DropdownMenu>
                                                  <DropdownMenuTrigger asChild>
                                                    <Button
                                                      variant="ghost"
                                                      size="icon"
                                                      className="h-8 w-8"
                                                    >
                                                      <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                  </DropdownMenuTrigger>
                                                  <DropdownMenuContent align="end" className="min-w-[160px]">
                                                    <DropdownMenuItem onClick={() => handleCreatePostFromSlot(template)}>
                                                      <Plus className="w-4 h-4 mr-2" />
                                                      Create Post
                                                      {!hasFullAccess && (
                                                        <Crown className="w-3.5 h-3.5 ml-auto text-yellow-500" />
                                                      )}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem 
                                                      onClick={() => generateSuggestion(template)}
                                                      disabled={isLoading}
                                                    >
                                                      <Sparkles className="w-4 h-4 mr-2" />
                                                      Regenerate Idea
                                                    </DropdownMenuItem>
                                                  </DropdownMenuContent>
                                                </DropdownMenu>
                                              </>
                                            ) : (
                                              <>
                                                <Button
                                                  variant="outline"
                                                  size="sm"
                                                  onClick={() => generateSuggestion(template)}
                                                  disabled={isLoading}
                                                  className="h-8"
                                                >
                                                  {isLoading ? (
                                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                  ) : (
                                                    <>
                                                      <Sparkles className="w-3.5 h-3.5 mr-1" />
                                                      Generate
                                                    </>
                                                  )}
                                                </Button>
                                                <DropdownMenu>
                                                  <DropdownMenuTrigger asChild>
                                                    <Button
                                                      variant="ghost"
                                                      size="icon"
                                                      className="h-8 w-8"
                                                    >
                                                      <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                  </DropdownMenuTrigger>
                                                  <DropdownMenuContent align="end" className="min-w-[160px]">
                                                    <DropdownMenuItem onClick={() => handleCreatePostFromSlot(template)}>
                                                      <Plus className="w-4 h-4 mr-2" />
                                                      Create Post
                                                      {!hasFullAccess && (
                                                        <Crown className="w-3.5 h-3.5 ml-auto text-yellow-500" />
                                                      )}
                                                    </DropdownMenuItem>
                                                  </DropdownMenuContent>
                                                </DropdownMenu>
                                              </>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })}
                            </div>
                          );
                        })}
                      </div>
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
          <p className="text-sm text-muted-foreground mb-3">
            No content assigned yet.
          </p>
          <Button variant="outline" size="sm" onClick={handleCreateNewPost}>
            <Plus className="w-4 h-4 mr-2" />
            Create your first post
          </Button>
        </div>
      )}

      {/* Post Editor Sheet */}
      <PostEditorSheet
        open={postEditorOpen}
        onOpenChange={(open) => {
          setPostEditorOpen(open);
          if (!open) setCreateSlotContext(null);
        }}
        projectId={projectId}
        existingItem={selectedItem}
        isCreateMode={isCreateMode}
        slotContext={createSlotContext}
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

      {/* Clear All Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={clearAllDialogOpen}
        onOpenChange={setClearAllDialogOpen}
        onConfirm={async () => {
          if (!user) return;
          setIsClearingAll(true);
          try {
            // Delete all suggestions
            const { error: suggestionsError } = await supabase
              .from("timeline_suggestions")
              .delete()
              .eq("project_id", projectId);
            
            if (suggestionsError) throw suggestionsError;
            
            // Delete all non-posted content planner items
            const { error: plannerError } = await supabase
              .from("content_planner")
              .delete()
              .eq("project_id", projectId)
              .neq("status", "completed");
            
            if (plannerError) throw plannerError;
            
            setLocalSuggestions({});
            queryClient.invalidateQueries({ queryKey: ["timeline-suggestions", projectId] });
            queryClient.invalidateQueries({ queryKey: ["content-planner", projectId] });
            toast.success("Timeline cleared");
            setClearAllDialogOpen(false);
          } catch (error) {
            console.error("Error clearing timeline:", error);
            toast.error("Failed to clear timeline");
          } finally {
            setIsClearingAll(false);
          }
        }}
        title="Clear All Content"
        description="This will remove all AI suggestions and all posts that haven't been published yet. Posted content will not be affected. This action cannot be undone."
        isDeleting={isClearingAll}
      />

      {/* Suggestion View Dialog */}
      <SuggestionViewDialog
        open={viewDialogOpen}
        onOpenChange={setViewDialogOpen}
        suggestion={selectedSuggestionKey ? suggestions[selectedSuggestionKey] : null}
        templateInfo={selectedTemplate ? {
          phase: selectedTemplate.phase,
          day_number: selectedTemplate.day_number,
          time_of_day: selectedTemplate.time_of_day,
        } : undefined}
        onAdd={() => {
          if (selectedTemplate && selectedSuggestionKey && suggestions[selectedSuggestionKey]) {
            createFromSuggestion(selectedTemplate, suggestions[selectedSuggestionKey]);
          }
        }}
        onRegenerate={() => {
          if (selectedTemplate) {
            generateSuggestion(selectedTemplate);
          }
        }}
        isAdding={creatingFromSuggestion === selectedSuggestionKey}
        isRegenerating={selectedSuggestionKey ? loadingSuggestions[selectedSuggestionKey] : false}
      />
    </div>
  );
};
