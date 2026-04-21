import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Lock, ChevronDown, LucideIcon, Sparkles, Crown, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFeatureAccess } from "@/hooks/useFeatureAccess";
import { TaskTemplate, ProjectTask, TaskStatus } from "@/types/tasks";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { UpgradeDialog } from "@/components/UpgradeDialog";

// Friendly names for funnel types
const FUNNEL_TYPE_LABELS: Record<string, string> = {
  'content_to_offer': 'Content',
  'freebie_email_offer': 'Freebie',
  'live_training_offer': 'Webinar',
  'application_call': 'Application',
  'membership': 'Membership',
  'challenge': 'Challenge',
  'launch': 'Launch',
};

// Editorial italic one-liners for each phase
const PHASE_SUMMARIES: Record<string, string> = {
  Setup: "Pick the shape of the thing you're launching.",
  Planning: "Clarify who this is for and why it works.",
  Messaging: "Turn what you know into language people feel.",
  Build: "Put the pieces in place — calmly, one by one.",
  Content: "The pieces that bring the launch into the world.",
  "Pre-Launch": "Warm the room before you open the doors.",
  Launch: "Ship it. Then take an afternoon off.",
  "Post-Launch": "Reflect, refine, and rest before the next one.",
};

interface PhaseSectionProps {
  projectId: string;
  label: string;
  icon: LucideIcon;
  tasks: TaskTemplate[];
  prerequisiteTasks?: TaskTemplate[];
  defaultOpen?: boolean;
  isProOnly?: boolean;
  phaseNumber?: number;
}

export const PhaseSection = ({
  projectId,
  label,
  icon: Icon,
  tasks,
  prerequisiteTasks = [],
  defaultOpen = true,
  isProOnly = false,
  phaseNumber,
}: PhaseSectionProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id;
  const { isSubscribed, hasAdminAccess } = useFeatureAccess();
  const hasFullAccess = isSubscribed || hasAdminAccess;
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);

  useEffect(() => {
    const fetchProjectTasks = async () => {
      if (!userId || !projectId) return;

      const { data, error } = await supabase
        .from("project_tasks")
        .select("*")
        .eq("project_id", projectId)
        .eq("user_id", userId);

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
  }, [userId, projectId]);

  const getTaskStatus = (taskId: string): TaskStatus => {
    const projectTask = projectTasks.find(pt => pt.taskId === taskId);
    return projectTask?.status || "not_started";
  };

  // Check if prerequisite phase is complete
  const isPrerequisiteComplete = prerequisiteTasks.length === 0 ||
    prerequisiteTasks.every(t => getTaskStatus(t.taskId) === "completed");

  const areDependenciesCompleted = (task: TaskTemplate): boolean => {
    if (task.dependencies.length === 0) return isPrerequisiteComplete;
    return task.dependencies.every(depId => {
      const status = getTaskStatus(depId);
      return status === "completed";
    });
  };

  const isTaskLocked = (task: TaskTemplate): boolean => {
    if (!isPrerequisiteComplete) return true;
    return !areDependenciesCompleted(task);
  };

  const completedCount = tasks.filter(
    t => getTaskStatus(t.taskId) === "completed"
  ).length;
  const totalCount = tasks.length;
  const pct = totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100);
  const allComplete = totalCount > 0 && completedCount === totalCount;

  const nextBestTaskIndex = tasks.findIndex(t => {
    const status = getTaskStatus(t.taskId);
    return !isTaskLocked(t) && status !== "completed";
  });
  const hasActiveTask = nextBestTaskIndex >= 0;

  const handleTaskClick = (task: TaskTemplate) => {
    if (isTaskLocked(task)) return;
    navigate(task.route.replace(":id", projectId));
  };

  // Status pill text + tone
  const statusInfo = allComplete
    ? { label: "Complete", bg: "bg-moss-100", color: "text-moss-700" }
    : hasActiveTask
      ? { label: "In progress", bg: "bg-clay-200", color: "text-terracotta" }
      : { label: "Upcoming", bg: "bg-ink-100", color: "text-fg-muted" };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-hairline bg-white">
        <div className="flex items-center justify-center py-10">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-terracotta"></div>
        </div>
      </div>
    );
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="rounded-2xl border border-hairline bg-white overflow-hidden"
    >
      <CollapsibleTrigger className="w-full text-left">
        <div className="grid grid-cols-[auto_minmax(0,1fr)_auto_auto_auto] items-center gap-3 sm:gap-5 px-4 sm:px-6 py-4 sm:py-5 hover:bg-paper-100/40 transition-colors">
          {/* Phase icon chip */}
          <div
            className={cn(
              "w-9 h-9 rounded-[10px] inline-flex items-center justify-center shrink-0",
              allComplete ? "bg-moss-100 text-moss-700" : "bg-clay-200 text-terracotta"
            )}
          >
            <Icon className="w-4 h-4" />
          </div>

          {/* Phase title + summary */}
          <div className="min-w-0">
            <div className="flex items-baseline gap-2.5 flex-wrap">
              {phaseNumber !== undefined && (
                <span className="editorial-eyebrow whitespace-nowrap">
                  Phase {phaseNumber}
                </span>
              )}
              <h2 className="font-display text-[20px] sm:text-[22px] font-medium leading-none tracking-[-0.015em] text-ink-900 m-0">
                {label}
              </h2>
              {!isPrerequisiteComplete && (
                <Lock className="w-3.5 h-3.5 text-fg-muted" />
              )}
              {isProOnly && !hasFullAccess && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowUpgradeDialog(true);
                      }}
                      className="hover:scale-110 transition-transform"
                    >
                      <Crown className="w-3.5 h-3.5 text-yellow-500" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Pro feature - Upgrade to access</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
            <div className="font-display italic text-[13px] sm:text-[13.5px] text-fg-secondary mt-1 leading-snug">
              {PHASE_SUMMARIES[label] || ""}
            </div>
          </div>

          {/* Progress bar */}
          <div className="hidden md:flex items-center gap-2.5 min-w-[140px]">
            <div className="flex-1 h-1 bg-paper-300 rounded-full overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all",
                  allComplete ? "bg-moss-500" : "bg-terracotta"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="font-mono text-[11px] text-fg-muted min-w-[34px] text-right">
              {completedCount}/{totalCount}
            </span>
          </div>

          {/* Status pill */}
          <span
            className={cn(
              "hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold tracking-[0.08em] uppercase whitespace-nowrap",
              statusInfo.bg,
              statusInfo.color
            )}
          >
            {statusInfo.label}
          </span>

          {/* Chevron */}
          <ChevronDown
            className={cn(
              "w-4 h-4 text-fg-muted transition-transform shrink-0",
              !isOpen && "-rotate-90"
            )}
          />
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="border-t border-hairline">
          {tasks.map((task, index) => {
            const status = getTaskStatus(task.taskId);
            const locked = isTaskLocked(task);
            const isCompleted = status === "completed";
            const isNextBestTask = !locked && !isCompleted && index === nextBestTaskIndex;

            return (
              <button
                key={task.taskId}
                onClick={() => handleTaskClick(task)}
                disabled={locked}
                className={cn(
                  "w-full grid grid-cols-[28px_1fr_auto] gap-3.5 items-center px-4 sm:px-[18px] py-3 text-left transition-colors",
                  index < tasks.length - 1 && "border-b border-hairline",
                  locked
                    ? "opacity-55 cursor-not-allowed"
                    : "hover:bg-paper-100",
                  isNextBestTask &&
                    "bg-clay-200/35 hover:bg-clay-200/50 border-l-[3px] border-l-terracotta"
                )}
                style={isNextBestTask ? undefined : { borderLeft: "3px solid transparent" }}
              >
                {/* Circle checkbox */}
                <span
                  className={cn(
                    "w-[18px] h-[18px] rounded-full inline-flex items-center justify-center shrink-0 border-[1.5px]",
                    isCompleted
                      ? "bg-moss-500 border-moss-500"
                      : "border-ink-300 bg-transparent"
                  )}
                >
                  {isCompleted && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
                </span>

                {/* Title + tags */}
                <div className="min-w-0 flex items-center gap-2 flex-wrap">
                  <span
                    className={cn(
                      "font-display text-[15px] sm:text-[15.5px] font-medium tracking-[-0.005em] truncate",
                      isCompleted ? "text-fg-muted line-through" : "text-ink-900"
                    )}
                  >
                    {task.title}
                  </span>

                  {task.funnelTypes && task.funnelTypes.length > 0 && !task.funnelTypes.includes('all') && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-plum-100 text-plum-700 text-[10.5px] font-semibold tracking-wide whitespace-nowrap">
                      <Sparkles className="w-2.5 h-2.5" />
                      {FUNNEL_TYPE_LABELS[task.funnelTypes[0]] || task.funnelTypes[0]}
                    </span>
                  )}

                  {locked && <Lock className="w-3 h-3 text-fg-muted" />}
                </div>

                {/* Right cluster: time, "Up next", action */}
                <div className="inline-flex items-center gap-3 sm:gap-3.5 whitespace-nowrap shrink-0">
                  <span className="font-mono text-[11px] text-fg-muted hidden xs:inline">
                    {task.estimatedMinutesMin}–{task.estimatedMinutesMax} min
                  </span>
                  {isNextBestTask && (
                    <span className="hidden sm:inline text-[10.5px] font-semibold tracking-[0.08em] uppercase text-terracotta whitespace-nowrap">
                      Up next
                    </span>
                  )}
                  <span
                    className={cn(
                      "text-[12.5px] font-medium inline-flex items-center gap-1 min-w-[52px] justify-end",
                      isNextBestTask ? "text-terracotta" : "text-fg-muted"
                    )}
                  >
                    {isCompleted ? "Open" : isNextBestTask ? "Start" : "Open"}
                    <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </CollapsibleContent>

      <UpgradeDialog
        open={showUpgradeDialog}
        onOpenChange={setShowUpgradeDialog}
        feature={label}
      />
    </Collapsible>
  );
};
