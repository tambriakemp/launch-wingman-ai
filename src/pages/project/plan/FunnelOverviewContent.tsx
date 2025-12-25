import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { isToday, isTomorrow, parseISO } from "date-fns";
import {
  GreetingHeader,
  NextBestTaskCard,
  ProgressSnapshotCard,
  UpcomingContentCard,
  StuckHelpCard,
  StuckHelpDialog,
  DailyMotivationCard,
  PhaseCelebrationCard,
  ProjectCompletedView,
  ProjectPausedView,
  ProjectLaunchedView,
} from "@/components/dashboard";
import { useTaskEngine } from "@/hooks/useTaskEngine";
import { useProjectLifecycle } from "@/hooks/useProjectLifecycle";
import { PHASE_LABELS, PHASES, Phase } from "@/types/tasks";

interface Props {
  projectId: string;
}

const getReassuranceText = (activePhase: string, isComplete: boolean, nextPhase?: string): string => {
  if (!isComplete) {
    const phaseMessages: Record<string, string> = {
      planning: "You're laying the groundwork. Take your time with each piece.",
      messaging: "Now you're crafting your message. This is where your offer starts to take shape.",
      build: "You're building the assets for your launch. One step at a time.",
      content: "Content creation time. This is how you'll connect with your audience.",
      launch: "Launch time! You've got this.",
      "post-launch": "Keep the momentum going. Follow up and optimize.",
    };
    return phaseMessages[activePhase] || "You're making progress. Keep going!";
  }
  
  if (nextPhase === "messaging") {
    return "Amazing work! Your planning phase is complete. You're ready to move into messaging.";
  }
  
  if (nextPhase === "build") {
    return "Great progress! Your messaging is ready. Time to build your assets.";
  }
  
  return "Amazing work! You're making great progress.";
};


const FunnelOverviewContent = ({ projectId }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stuckModalOpen, setStuckModalOpen] = useState(false);
  const [celebrationDismissed, setCelebrationDismissed] = useState(false);

  // Use the project lifecycle hook
  const {
    projectState,
    isLoading: lifecycleLoading,
    dashboardViewType,
    resume,
    markCompleted,
    transitionTo,
  } = useProjectLifecycle({ projectId });

  // Use the task engine to get the next best task (only active when state allows)
  const {
    isLoading: taskEngineLoading,
    nextBestTask,
    activePhase,
    phaseStatuses,
  } = useTaskEngine({ projectId });

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch project
  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch upcoming content
  const { data: contentData } = useQuery({
    queryKey: ["upcoming-content", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_planner")
        .select("id, title, content_type, scheduled_at, scheduled_platforms")
        .eq("project_id", projectId)
        .not("scheduled_at", "is", null)
        .gte("scheduled_at", new Date().toISOString().split("T")[0])
        .order("scheduled_at")
        .limit(10);
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  const isLoading = taskEngineLoading || projectLoading || lifecycleLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Handle different dashboard views based on project lifecycle state
  if (dashboardViewType === 'paused') {
    return (
      <ProjectPausedView
        projectName={project?.name}
        onResume={async () => {
          await resume();
        }}
      />
    );
  }

  if (dashboardViewType === 'completed') {
    return (
      <ProjectCompletedView
        projectName={project?.name}
        onRelaunch={async () => {
          // Reset to in_progress to start a new launch cycle
          await transitionTo('in_progress');
        }}
        onNewProject={() => {
          navigate('/app');
        }}
        onPause={async () => {
          await transitionTo('paused');
        }}
      />
    );
  }

  if (dashboardViewType === 'launched') {
    return (
      <ProjectLaunchedView
        projectName={project?.name}
        onContinueToPostLaunch={async () => {
          // Mark as in_progress to continue with post-launch tasks
          await transitionTo('in_progress');
        }}
      />
    );
  }

  // Default tasks view for 'draft' and 'in_progress' states

  // Organize content by day
  const todayContent = (contentData || []).filter((item) => {
    if (!item.scheduled_at) return false;
    return isToday(parseISO(item.scheduled_at));
  });

  const tomorrowContent = (contentData || []).filter((item) => {
    if (!item.scheduled_at) return false;
    return isTomorrow(parseISO(item.scheduled_at));
  });

  const hasContent = todayContent.length > 0 || tomorrowContent.length > 0;

  // Get phase display info
  const currentPhaseLabel = PHASE_LABELS[activePhase] || "Planning";
  const isPhaseComplete = phaseStatuses[activePhase] === "complete";
  
  // Find the most recently completed phase (for celebration)
  // Only show if there's at least one completed phase AND we're not at the end
  const completedPhases = PHASES.filter(p => phaseStatuses[p] === "complete");
  const mostRecentlyCompletedPhase = completedPhases.length > 0 && completedPhases.length < PHASES.length
    ? completedPhases[completedPhases.length - 1] 
    : null;
  
  // Get next phase after the most recently completed phase
  const nextPhaseAfterCompleted = mostRecentlyCompletedPhase 
    ? PHASES[PHASES.indexOf(mostRecentlyCompletedPhase) + 1]
    : undefined;

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6 px-4">
      <GreetingHeader
        firstName={profile?.first_name}
        projectName={project?.name}
      />

      {/* Show celebration card if a phase was recently completed and not dismissed */}
      {mostRecentlyCompletedPhase && !celebrationDismissed && (
        <PhaseCelebrationCard
          completedPhase={mostRecentlyCompletedPhase}
          nextPhase={nextPhaseAfterCompleted}
          onDismiss={() => setCelebrationDismissed(true)}
        />
      )}

      {nextBestTask ? (
        <NextBestTaskCard
          title={nextBestTask.title}
          whyItMatters={nextBestTask.whyItMatters}
          estimatedMinutes={nextBestTask.estimatedTimeRange}
          route={nextBestTask.route}
        />
      ) : (
        <div className="p-6 rounded-lg border border-border bg-card text-center">
          <p className="text-muted-foreground">
            {isPhaseComplete 
              ? "All tasks in this phase are complete! You're ready to move forward."
              : "No tasks available right now. Check back soon!"}
          </p>
        </div>
      )}

      <ProgressSnapshotCard
        currentPhase={currentPhaseLabel}
        isPhaseComplete={isPhaseComplete}
        reassuranceText={getReassuranceText(activePhase, isPhaseComplete, nextPhaseAfterCompleted)}
      />

      {hasContent && (
        <UpcomingContentCard
          today={todayContent}
          tomorrow={tomorrowContent}
          projectId={projectId}
        />
      )}

      <StuckHelpCard onOpenModal={() => setStuckModalOpen(true)} />

      <DailyMotivationCard />

      <StuckHelpDialog
        open={stuckModalOpen}
        onOpenChange={setStuckModalOpen}
        currentTask={{
          title: nextBestTask?.title || "Getting started",
          whyItMatters: nextBestTask?.whyItMatters || "This helps you move forward with your launch.",
        }}
        projectContext={project?.name}
      />
    </div>
  );
};

export default FunnelOverviewContent;