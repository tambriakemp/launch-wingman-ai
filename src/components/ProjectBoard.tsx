import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, isPast, isToday } from "date-fns";
import { MoreHorizontal, Pencil, Trash2, Calendar, Plus, ListTodo, X, Settings, ListChecks, Search, AlertTriangle, RefreshCw, CheckSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { TaskDialog, Task, TASK_LABELS } from "@/components/TaskDialog";
import { DeleteConfirmationDialog } from "@/components/DeleteConfirmationDialog";
import { LoadLaunchTasksDialog } from "@/components/LoadLaunchTasksDialog";
import { FilterPopover } from "@/components/FilterPopover";
import { FUNNEL_CONFIGS } from "@/data/funnelConfigs";
import { AssetChecklist } from "@/components/funnel/AssetChecklist";
import { PhaseSection } from "@/components/PhaseSection";
import { getPlanningTasks, getMessagingTasks, getBuildTasks, getContentTasks, getLaunchTasks, getPostLaunchTasks } from "@/data/taskTemplates";
import { ClipboardList, MessageSquare, Wrench, PenTool, Rocket, Flag } from "lucide-react";

const COLUMNS = [
  { id: "todo", label: "To Do" },
  { id: "blocked", label: "Blocked/Waiting" },
  { id: "in-progress", label: "In Progress" },
  { id: "review", label: "Review" },
  { id: "done", label: "Done" },
];

// Map asset categories to task phases
const ASSET_PHASE_MAP: Record<string, string> = {
  'pages': 'technical',
  'emails': 'emails',
  'content': 'prelaunch',
  'deliverables': 'delivery',
};

// Map asset categories to task labels
const ASSET_LABEL_MAP: Record<string, string[]> = {
  'pages': ['technical'],
  'emails': ['copy'],
  'content': ['creative', 'marketing'],
  'deliverables': ['creative'],
};

interface ProjectBoardProps {
  projectId: string;
  projectType: "launch" | "prelaunch";
}

export const ProjectBoard = ({ projectId, projectType }: ProjectBoardProps) => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Dialog state
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  // Funnel change detection
  const [funnelTypeChanged, setFunnelTypeChanged] = useState(false);
  const [currentFunnelType, setCurrentFunnelType] = useState<string | null>(null);
  const [isRepopulating, setIsRepopulating] = useState(false);
  
  // Checklist view data
  const [offers, setOffers] = useState<any[]>([]);
  const [completedAssets, setCompletedAssets] = useState<Set<string>>(new Set());

  const fetchTasks = useCallback(async () => {
    if (!projectId) return;
    
    const { data: tasksData, error: tasksError } = await supabase
      .from("tasks")
      .select("*")
      .eq("project_id", projectId)
      .order("position", { ascending: true });

    if (tasksError) {
      console.error("Error fetching tasks:", tasksError);
      toast.error("Failed to load tasks");
      setIsLoading(false);
      return;
    }

    // Fetch subtask counts for all tasks
    const taskIds = tasksData?.map(t => t.id) || [];
    if (taskIds.length > 0) {
      const { data: subtaskCounts, error: subtaskError } = await supabase
        .from("subtasks")
        .select("task_id")
        .in("task_id", taskIds);

      if (!subtaskError && subtaskCounts) {
        const countMap = subtaskCounts.reduce((acc, s) => {
          acc[s.task_id] = (acc[s.task_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        setTasks(tasksData.map(t => ({
          ...t,
          subtask_count: countMap[t.id] || 0
        })));
      } else {
        setTasks(tasksData || []);
      }
    } else {
      setTasks(tasksData || []);
    }
    
    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // Check for funnel type changes and fetch funnel data
  useEffect(() => {
    const checkFunnelAndFetchOffers = async () => {
      if (!projectId) return;

      // Fetch current funnel type
      const { data: funnel } = await supabase
        .from('funnels')
        .select('id, funnel_type')
        .eq('project_id', projectId)
        .maybeSingle();

      // Fetch project snapshot
      const { data: project } = await supabase
        .from('projects')
        .select('funnel_type_snapshot')
        .eq('id', projectId)
        .single();

      if (funnel?.funnel_type) {
        setCurrentFunnelType(funnel.funnel_type);
        
        // Check if funnel type changed
        if (project?.funnel_type_snapshot && funnel.funnel_type !== project.funnel_type_snapshot) {
          setFunnelTypeChanged(true);
        }

        // Fetch offers for checklist view
        const { data: projectOffers } = await supabase
          .from('offers')
          .select('*')
          .eq('funnel_id', funnel.id)
          .order('slot_position');
        
        if (projectOffers) {
          setOffers(projectOffers.map(offer => ({
            id: offer.id,
            slotType: offer.slot_type,
            title: offer.title || '',
            description: offer.description || '',
            offerType: offer.offer_type,
            price: offer.price?.toString() || '',
            priceType: offer.price_type || 'one-time',
            isConfigured: true,
            isSkipped: false,
          })));
        }
      }

      // Fetch asset completions
      const { data: completions } = await supabase
        .from('funnel_asset_completions')
        .select('asset_id, is_completed')
        .eq('project_id', projectId);
      
      if (completions) {
        const completedSet = new Set<string>(
          completions.filter(c => c.is_completed).map(c => c.asset_id)
        );
        setCompletedAssets(completedSet);
      }
    };

    checkFunnelAndFetchOffers();
  }, [projectId]);

  const handleRepopulateTasks = async () => {
    if (!user || !currentFunnelType) return;

    setIsRepopulating(true);
    const config = FUNNEL_CONFIGS[currentFunnelType];
    if (!config) {
      setIsRepopulating(false);
      return;
    }

    // Fetch current offers for this project
    const { data: projectOffers } = await supabase
      .from('offers')
      .select('*')
      .eq('project_id', projectId)
      .order('slot_position');

    // Delete existing tasks
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('project_id', projectId);

    if (deleteError) {
      console.error('Error deleting tasks:', deleteError);
      toast.error('Failed to clear existing tasks');
      setIsRepopulating(false);
      return;
    }

    // Generate new tasks with offer context
    const tasksToInsert = config.assets
      .filter(asset => {
        // Always include non-slot-specific assets
        if (!asset.offerSlotType) return true;
        // Include if there's a configured offer of this slot type
        return projectOffers?.some(offer => 
          offer.slot_type === asset.offerSlotType && offer.title
        );
      })
      .map((asset, index) => {
        // Find related offer for this asset
        const relatedOffer = asset.offerSlotType 
          ? projectOffers?.find(o => o.slot_type === asset.offerSlotType)
          : null;
        
        // Build enhanced description with offer title
        const description = relatedOffer?.title 
          ? `${asset.description} • ${relatedOffer.title}`
          : asset.description;

        return {
          project_id: projectId,
          user_id: user.id,
          title: asset.title,
          description: description,
          column_id: 'todo',
          phase: ASSET_PHASE_MAP[asset.category] || null,
          labels: ASSET_LABEL_MAP[asset.category] || [],
          position: index,
        };
      });

    if (tasksToInsert.length > 0) {
      const { error: insertError } = await supabase.from('tasks').insert(tasksToInsert);
      if (insertError) {
        console.error('Error generating tasks:', insertError);
        toast.error('Failed to generate tasks');
        setIsRepopulating(false);
        return;
      }
    }

    // Update project snapshot
    await supabase
      .from('projects')
      .update({ funnel_type_snapshot: currentFunnelType })
      .eq('id', projectId);

    setFunnelTypeChanged(false);
    setIsRepopulating(false);
    toast.success(`${tasksToInsert.length} tasks generated for new funnel type`);
    fetchTasks();
  };

  const handleDismissFunnelChange = async () => {
    if (!currentFunnelType) return;

    await supabase
      .from('projects')
      .update({ funnel_type_snapshot: currentFunnelType })
      .eq('id', projectId);

    setFunnelTypeChanged(false);
  };

  const handleCreateTask = async (data: { title: string; description: string; due_date: Date | null; column_id: string; labels: string[]; phase: string | null }) => {
    if (!user) return;

    const { error } = await supabase.from("tasks").insert({
      project_id: projectId,
      user_id: user.id,
      title: data.title,
      description: data.description || null,
      due_date: data.due_date ? format(data.due_date, "yyyy-MM-dd") : null,
      column_id: data.column_id,
      labels: data.labels,
      phase: data.phase,
      position: tasks.filter(t => t.column_id === data.column_id).length,
    });

    if (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task");
      throw error;
    }

    toast.success("Task created");
    fetchTasks();
  };

  const handleUpdateTask = async (data: { title: string; description: string; due_date: Date | null; column_id: string; labels: string[]; phase: string | null }) => {
    if (!editingTask) return;

    const { error } = await supabase
      .from("tasks")
      .update({
        title: data.title,
        description: data.description || null,
        due_date: data.due_date ? format(data.due_date, "yyyy-MM-dd") : null,
        column_id: data.column_id,
        labels: data.labels,
        phase: data.phase,
      })
      .eq("id", editingTask.id);

    if (error) {
      console.error("Error updating task:", error);
      toast.error("Failed to update task");
      throw error;
    }

    toast.success("Task updated");
    setEditingTask(null);
    fetchTasks();
  };

  const handleDeleteTask = async () => {
    if (!taskToDelete) return;

    setIsDeleting(true);
    const { error } = await supabase
      .from("tasks")
      .delete()
      .eq("id", taskToDelete.id);

    if (error) {
      console.error("Error deleting task:", error);
      toast.error("Failed to delete task");
    } else {
      toast.success("Task deleted");
      fetchTasks();
    }
    
    setIsDeleting(false);
    setDeleteDialogOpen(false);
    setTaskToDelete(null);
  };

  const handleCardClick = (task: Task, e: React.MouseEvent) => {
    // Don't open dialog if clicking on dropdown menu or grip
    if ((e.target as HTMLElement).closest('[data-no-click]')) return;
    setEditingTask(task);
    setTaskDialogOpen(true);
  };

  const handleDeleteClick = (task: Task) => {
    setTaskToDelete(task);
    setDeleteDialogOpen(true);
  };

  const handleToggleAsset = async (assetId: string) => {
    if (!user) return;

    const isCurrentlyCompleted = completedAssets.has(assetId);
    
    // Optimistic update
    setCompletedAssets(prev => {
      const next = new Set(prev);
      if (isCurrentlyCompleted) {
        next.delete(assetId);
      } else {
        next.add(assetId);
      }
      return next;
    });

    // Persist to database
    if (isCurrentlyCompleted) {
      await supabase
        .from('funnel_asset_completions')
        .delete()
        .eq('project_id', projectId)
        .eq('asset_id', assetId);
    } else {
      await supabase
        .from('funnel_asset_completions')
        .upsert({
          project_id: projectId,
          user_id: user.id,
          asset_id: assetId,
          is_completed: true,
        });
    }
  };


  const clearFilters = () => {
    setSearchQuery("");
    setSelectedLabels([]);
    setSelectedStatus("all");
    setSelectedCategory("all");
  };

  const hasActiveFilters = searchQuery || selectedLabels.length > 0 || selectedStatus !== "all" || selectedCategory !== "all";

  const getLabelInfo = (labelId: string) => {
    return TASK_LABELS.find((l) => l.id === labelId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      {/* Funnel Change Alert */}
      {funnelTypeChanged && (
        <Alert className="mb-4 border-warning bg-warning/10">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertDescription className="flex items-center justify-between">
            <span>
              Your funnel type has changed. Would you like to update your task list to match the new funnel?
            </span>
            <div className="flex gap-2 ml-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDismissFunnelChange}
                disabled={isRepopulating}
              >
                Keep Current Tasks
              </Button>
              <Button 
                size="sm" 
                onClick={handleRepopulateTasks}
                disabled={isRepopulating}
              >
                {isRepopulating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Repopulate Board
                  </>
                )}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        {/* Search & Filters */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-52 h-9 pl-8"
            />
          </div>

          <FilterPopover
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            selectedLabels={selectedLabels}
            onLabelsChange={setSelectedLabels}
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onClear={clearFilters}
          />

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9 text-muted-foreground">
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" className="h-9 w-9">
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuLabel>Board Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <LoadLaunchTasksDialog
                projectId={projectId}
                projectType={projectType}
                onTasksLoaded={fetchTasks}
                taskCount={tasks.length}
                trigger={
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <ListChecks className="w-4 h-4 mr-2" />
                    Load Launch Tasks
                  </DropdownMenuItem>
                }
              />
              {tasks.length > 0 && (
                <LoadLaunchTasksDialog
                  projectId={projectId}
                  projectType={projectType}
                  onTasksLoaded={fetchTasks}
                  taskCount={tasks.length}
                  showDeleteOnly
                  trigger={
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete All Tasks
                    </DropdownMenuItem>
                  }
                />
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button onClick={() => { setEditingTask(null); setTaskDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" />
            Add Task
          </Button>
        </div>
      </div>

      {/* Phase Task Sections */}
      <div className="space-y-4 mb-6">
        <PhaseSection
          projectId={projectId}
          label="Planning"
          icon={ClipboardList}
          tasks={getPlanningTasks()}
        />
        <PhaseSection
          projectId={projectId}
          label="Messaging"
          icon={MessageSquare}
          tasks={getMessagingTasks()}
          prerequisiteTasks={getPlanningTasks()}
        />
        <PhaseSection
          projectId={projectId}
          label="Build"
          icon={Wrench}
          tasks={getBuildTasks()}
          prerequisiteTasks={[...getPlanningTasks(), ...getMessagingTasks()]}
        />

        <PhaseSection
          projectId={projectId}
          label="Content"
          icon={PenTool}
          tasks={getContentTasks()}
          prerequisiteTasks={[...getPlanningTasks(), ...getMessagingTasks(), ...getBuildTasks()]}
        />

        <PhaseSection
          projectId={projectId}
          label="Launch"
          icon={Rocket}
          tasks={getLaunchTasks()}
          prerequisiteTasks={[...getPlanningTasks(), ...getMessagingTasks(), ...getBuildTasks(), ...getContentTasks()]}
        />

        <PhaseSection
          projectId={projectId}
          label="Post-Launch"
          icon={Flag}
          tasks={getPostLaunchTasks()}
          prerequisiteTasks={[...getPlanningTasks(), ...getMessagingTasks(), ...getBuildTasks(), ...getContentTasks(), ...getLaunchTasks()]}
        />
      </div>

      {/* Checklist View */}
      {currentFunnelType ? (
        <AssetChecklist
          funnelType={currentFunnelType}
          offers={offers}
          completedAssets={completedAssets}
          onToggleAsset={handleToggleAsset}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <CheckSquare className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No funnel configured</h3>
          <p className="text-muted-foreground text-sm mb-6 max-w-md">
            Set up your funnel first to see the asset checklist.
          </p>
        </div>
      )}

      {/* Task Dialog */}
      <TaskDialog
        open={taskDialogOpen}
        onOpenChange={(open) => {
          setTaskDialogOpen(open);
          if (!open) setEditingTask(null);
        }}
        onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
        editTask={editingTask}
        onSubtasksChange={fetchTasks}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteTask}
        title="Delete Task"
        description={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        isDeleting={isDeleting}
      />
    </>
  );
};