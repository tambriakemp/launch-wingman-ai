import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Circle, Lock, ChevronRight, ChevronDown, ClipboardList } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getPlanningTasks } from "@/data/taskTemplates";
import { TaskTemplate, ProjectTask, TaskStatus } from "@/types/tasks";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface PlanningPhaseSectionProps {
  projectId: string;
}

export const PlanningPhaseSection = ({ projectId }: PlanningPhaseSectionProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(true);

  const planningTasks = getPlanningTasks();

  useEffect(() => {
    const fetchProjectTasks = async () => {
      if (!user || !projectId) return;

      const { data, error } = await supabase
        .from("project_tasks")
        .select("*")
        .eq("project_id", projectId)
        .eq("user_id", user.id);

      if (error) {
        console.error("Error fetching project tasks:", error);
      } else {
        const mapped: ProjectTask[] = (data || []).map(t => ({
          id: t.id,
          projectId: t.project_id,
          taskId: t.task_id,
          status: t.status as TaskStatus,
          inputData: t.input_data as Record<string, unknown> | undefined,
          skipReason: t.skip_reason as any,
          startedAt: t.started_at || undefined,
          completedAt: t.completed_at || undefined,
          updatedAt: t.updated_at,
          createdAt: t.created_at,
        }));
        setProjectTasks(mapped);
      }
      setIsLoading(false);
    };

    fetchProjectTasks();
  }, [user, projectId]);

  const getTaskStatus = (taskId: string): TaskStatus => {
    const projectTask = projectTasks.find(pt => pt.taskId === taskId);
    return projectTask?.status || "not_started";
  };

  const areDependenciesCompleted = (task: TaskTemplate): boolean => {
    if (task.dependencies.length === 0) return true;
    return task.dependencies.every(depId => {
      const status = getTaskStatus(depId);
      return status === "completed";
    });
  };

  const isTaskLocked = (task: TaskTemplate): boolean => {
    return !areDependenciesCompleted(task);
  };

  const completedCount = planningTasks.filter(
    t => getTaskStatus(t.taskId) === "completed"
  ).length;

  // Find the next best task for the focus indicator
  const nextBestTaskIndex = planningTasks.findIndex(t => {
    const status = getTaskStatus(t.taskId);
    return !isTaskLocked(t) && status !== "completed";
  });
  
  const allComplete = completedCount === planningTasks.length;

  const handleTaskClick = (task: TaskTemplate) => {
    if (isTaskLocked(task)) return;
    navigate(task.route.replace(":id", projectId));
  };

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-card">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen} className="rounded-lg border bg-card">
      <CollapsibleTrigger className="flex items-center justify-between w-full p-4 hover:bg-muted/50 transition-colors">
        <div className="flex items-center gap-3">
          <ClipboardList className="w-5 h-5 text-muted-foreground" />
          <span className="font-medium">Planning</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {allComplete 
              ? "Complete" 
              : `Step ${nextBestTaskIndex + 1}`
            }
          </span>
          <ChevronDown 
            className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              !isOpen && "-rotate-90"
            )} 
          />
        </div>
      </CollapsibleTrigger>
      
      <CollapsibleContent>
        <div className="border-t">
          {planningTasks.map((task, index) => {
            const status = getTaskStatus(task.taskId);
            const locked = isTaskLocked(task);
            const isCompleted = status === "completed";
            
            // Find if this is the next best task (first unlocked, not completed)
            const isNextBestTask = !locked && !isCompleted && 
              planningTasks.findIndex(t => {
                const s = getTaskStatus(t.taskId);
                return !isTaskLocked(t) && s !== "completed";
              }) === index;

            return (
              <button
                key={task.taskId}
                onClick={() => handleTaskClick(task)}
                disabled={locked}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors",
                  "border-b last:border-b-0",
                  locked
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:bg-muted/50",
                  isNextBestTask && "bg-primary/5 border-l-2 border-l-primary"
                )}
              >
                {/* Checkbox */}
                <div className="flex-shrink-0">
                  {isCompleted ? (
                    <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                      <Check className="w-3 h-3 text-muted-foreground" />
                    </div>
                  ) : isNextBestTask ? (
                    <div className="w-5 h-5 rounded-full border-2 border-primary" />
                  ) : (
                    <Circle className="w-5 h-5 text-muted-foreground/40" />
                  )}
                </div>

                {/* Title and time */}
                <div className="flex-1 min-w-0 flex items-center gap-2">
                  <span className={cn(
                    "font-medium text-sm",
                    isCompleted && "text-muted-foreground line-through",
                    isNextBestTask && "text-foreground"
                  )}>
                    {task.title}
                  </span>
                  
                  {locked && (
                    <Lock className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  )}
                  
                  <span className={cn(
                    "text-xs text-muted-foreground",
                    isCompleted && "opacity-60"
                  )}>
                    • {task.estimatedMinutesMin}–{task.estimatedMinutesMax} min
                  </span>
                </div>

                {/* CTA for next best task, arrow for other actionable tasks */}
                {isNextBestTask ? (
                  <span className="text-xs font-medium text-primary flex items-center gap-1">
                    Start <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                ) : !locked && !isCompleted ? (
                  <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                ) : null}
              </button>
            );
          })}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};
