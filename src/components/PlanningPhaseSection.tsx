import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Circle, Lock, ChevronRight, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getPlanningTasks } from "@/data/taskTemplates";
import { TaskTemplate, ProjectTask, TaskStatus } from "@/types/tasks";

interface PlanningPhaseSectionProps {
  projectId: string;
}

export const PlanningPhaseSection = ({ projectId }: PlanningPhaseSectionProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  const progressPercent = (completedCount / planningTasks.length) * 100;

  const handleTaskClick = (task: TaskTemplate) => {
    if (isTaskLocked(task)) return;
    const route = task.route.replace(":id", projectId);
    navigate(route);
  };

  const getStatusIcon = (task: TaskTemplate) => {
    const status = getTaskStatus(task.taskId);
    const locked = isTaskLocked(task);

    if (locked) {
      return <Lock className="w-4 h-4 text-muted-foreground/50" />;
    }
    if (status === "completed") {
      return <Check className="w-4 h-4 text-primary" />;
    }
    if (status === "in_progress") {
      return <Sparkles className="w-4 h-4 text-warning animate-pulse" />;
    }
    return <Circle className="w-4 h-4 text-muted-foreground" />;
  };

  const getStatusBadge = (task: TaskTemplate) => {
    const status = getTaskStatus(task.taskId);
    const locked = isTaskLocked(task);

    if (locked) {
      return (
        <Badge variant="outline" className="text-xs text-muted-foreground">
          Locked
        </Badge>
      );
    }
    if (status === "completed") {
      return (
        <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
          Complete
        </Badge>
      );
    }
    if (status === "in_progress") {
      return (
        <Badge className="text-xs bg-warning/10 text-warning border-warning/20">
          In Progress
        </Badge>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg">Planning Phase</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6 border-primary/20 bg-gradient-to-br from-background to-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold">Planning Phase</CardTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Know who this is for, what they want, and how you'll sell it
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            {completedCount} / {planningTasks.length} complete
          </Badge>
        </div>
        <Progress value={progressPercent} className="h-1.5 mt-4" />
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {planningTasks.map((task, index) => {
            const status = getTaskStatus(task.taskId);
            const locked = isTaskLocked(task);

            return (
              <button
                key={task.taskId}
                onClick={() => handleTaskClick(task)}
                disabled={locked}
                className={cn(
                  "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-all",
                  "border border-transparent",
                  locked
                    ? "opacity-50 cursor-not-allowed bg-muted/30"
                    : status === "completed"
                    ? "bg-primary/5 hover:bg-primary/10"
                    : status === "in_progress"
                    ? "bg-warning/5 hover:bg-warning/10 border-warning/20"
                    : "bg-background hover:bg-accent"
                )}
              >
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-background border border-border">
                  {getStatusIcon(task)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "font-medium text-sm",
                        status === "completed" && "text-primary",
                        locked && "text-muted-foreground"
                      )}
                    >
                      {task.title}
                    </span>
                    {getStatusBadge(task)}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock className="w-3 h-3 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">
                      {task.estimatedMinutesMin}–{task.estimatedMinutesMax} min
                    </span>
                  </div>
                </div>
                {!locked && status !== "completed" && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
            );
          })}
        </div>

        {completedCount === planningTasks.length && (
          <div className="mt-4 p-3 rounded-lg bg-primary/10 border border-primary/20">
            <div className="flex items-center gap-2 text-primary">
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">
                Planning complete — time to clarify your messaging
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
