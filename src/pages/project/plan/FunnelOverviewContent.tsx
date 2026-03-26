import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useState, useEffect } from "react";
import { isToday, isTomorrow, parseISO, startOfWeek, endOfWeek } from "date-fns";
import { getFunnelConfig } from "@/lib/funnelUtils";
import {
  GreetingHeader,
  NextBestTaskCard,
  UpcomingContentCard,
  StuckHelpDialog,
  PhaseCelebrationCard,
  ProjectCompletedView,
  ProjectPausedView,
  ProjectLaunchedView,
} from "@/components/dashboard";
import { CheckInBanner, CheckInFlow } from "@/components/check-in";
import { MemoryReviewBanner } from "@/components/relaunch";
import { useTaskEngine } from "@/hooks/useTaskEngine";
import { useProjectLifecycle } from "@/hooks/useProjectLifecycle";
import { PHASE_LABELS, PHASES, Phase, PhaseStatus } from "@/types/tasks";

interface Props {
  projectId: string;
}

// --- Inline Components ---

const PHASE_WEEK_ESTIMATES: Partial<Record<Phase, { weeks: number; label: string }>> = {
  planning: { weeks: 1, label: 'Planning' },
  messaging: { weeks: 1, label: 'Messaging' },
  build: { weeks: 2, label: 'Build' },
  content: { weeks: 1, label: 'Content' },
  'pre-launch': { weeks: 1, label: 'Pre-Launch' },
  launch: { weeks: 1, label: 'Launch' },
  'post-launch': { weeks: 1, label: 'Post-Launch' },
};

const LaunchTimelineInline = ({
  phaseStatuses,
  activePhase,
  funnelType,
}: {
  phaseStatuses: Record<Phase, PhaseStatus>;
  activePhase: Phase;
  funnelType: string | null;
}) => {
  if (!funnelType) return null;

  const visiblePhases: Phase[] = ['planning', 'messaging', 'build', 'content', 'pre-launch', 'launch'];
  let weekCursor = 1;

  const funnelConfig = getFunnelConfig(funnelType);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Launch Timeline
        </p>
        {funnelConfig?.typicalSetupTime && (
          <span className="text-[10px] text-muted-foreground">
            ~{funnelConfig.typicalSetupTime} total
          </span>
        )}
      </div>
      <div className="flex items-start gap-1 overflow-x-auto">
        {visiblePhases.map((phase) => {
          const est = PHASE_WEEK_ESTIMATES[phase];
          if (!est) return null;
          const status = phaseStatuses[phase];
          const isComplete = status === 'complete';
          const isActive = phase === activePhase;
          const startWeek = weekCursor;
          const endWeek = weekCursor + est.weeks - 1;
          weekCursor += est.weeks;

          return (
            <div key={phase} className="flex-1 min-w-0 text-center">
              <div className={`h-1.5 rounded-full mb-1 ${isComplete ? 'bg-primary' : isActive ? 'bg-primary/40' : 'bg-border'}`} />
              <p className={`text-[10px] leading-tight truncate ${isActive ? 'text-primary font-semibold' : isComplete ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {est.label}
              </p>
              <p className="text-[9px] text-muted-foreground/60">
                {startWeek === endWeek ? `Wk ${startWeek}` : `Wk ${startWeek}–${endWeek}`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const PhaseProgressRail = ({
  phases,
  phaseStatuses,
  activePhase,
  projectTasks,
  getTaskTemplate,
}: {
  phases: readonly Phase[];
  phaseStatuses: Record<Phase, PhaseStatus>;
  activePhase: Phase;
  projectTasks: { taskId: string; status: string }[];
  getTaskTemplate: (taskId: string) => { phase: Phase; canSkip: boolean } | undefined;
}) => {
  const getPhaseCounts = (phase: Phase) => {
    const phaseTasks = projectTasks.filter(pt => {
      const template = getTaskTemplate(pt.taskId);
      return template?.phase === phase && !template?.canSkip;
    });
    const completed = phaseTasks.filter(pt =>
      pt.status === "completed" || pt.status === "skipped"
    ).length;
    return { completed, total: phaseTasks.length };
  };
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between overflow-x-auto gap-0">
        {phases.map((phase, index) => {
          const status = phaseStatuses[phase];
          const isComplete = status === "complete";
          const isActive = phase === activePhase;
          const { completed, total } = getPhaseCounts(phase);
          const showCount = total > 0 && !isComplete;
          return (
            <div key={phase} className="flex items-center flex-1 min-w-0 last:flex-none">
              <div className="flex flex-col items-center gap-1 min-w-0">
                <div className="flex items-center justify-center w-6 h-6">
                  {isComplete ? (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  ) : (
                    <Circle className={`w-5 h-5 ${isActive ? "text-primary fill-primary/20" : "text-muted-foreground/40"}`} />
                  )}
                </div>
                <span className={`text-[10px] leading-tight text-center whitespace-nowrap hidden sm:block ${isActive ? "text-primary font-semibold" : isComplete ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {PHASE_LABELS[phase] || phase}
                </span>
                <span className={`text-[9px] leading-tight text-center block sm:hidden truncate max-w-[32px] ${isComplete ? "text-primary font-semibold" : isActive ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                  {(PHASE_LABELS[phase] || phase).split(" ")[0]}
                </span>
                {showCount && (
                  <span className={`text-[9px] leading-none tabular-nums ${isActive ? "text-primary" : "text-muted-foreground/50"}`}>
                    {completed}/{total}
                  </span>
                )}
              </div>
              {index < phases.length - 1 && (
                <div className={`flex-1 h-px mx-1.5 mt-[-12px] ${isComplete ? "bg-primary" : "bg-border"}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const LaunchSnapshotCard = ({ projectId }: { projectId: string }) => {
  const { data: snapshotData } = useQuery({
    queryKey: ["dashboard-snapshot", projectId],
    queryFn: async () => {
      const [offersRes, snapshotRes, tasksRes] = await Promise.all([
        supabase
          .from("offers")
          .select("title, price, price_type")
          .eq("project_id", projectId)
          .order("slot_position")
          .limit(1),
        supabase
          .from("launch_snapshots")
          .select(
            "email_list_size, instagram_followers, facebook_followers, tiktok_followers"
          )
          .eq("project_id", projectId)
          .eq("snapshot_type", "starting")
          .maybeSingle(),
        supabase
          .from("project_tasks")
          .select("task_id, input_data")
          .eq("project_id", projectId)
          .eq("status", "completed")
          .in("task_id", [
            "planning_define_audience",
            "messaging_transformation_statement",
            "launch_set_dates",
          ]),
      ]);

      const offer = offersRes.data?.[0] || null;
      const snapshot = snapshotRes.data || null;
      const tasks = tasksRes.data || [];

      const transformTask = tasks.find(
        (t) => t.task_id === "messaging_transformation_statement"
      );
      const datesTask = tasks.find((t) => t.task_id === "launch_set_dates");

      const transformation =
        (transformTask?.input_data as any)?.transformation_statement || null;
      const launchDate =
        (datesTask?.input_data as any)?.launch_date || null;

      const totalFollowers =
        (snapshot?.instagram_followers || 0) +
        (snapshot?.facebook_followers || 0) +
        (snapshot?.tiktok_followers || 0);

      return {
        offer,
        snapshot,
        transformation,
        launchDate,
        totalFollowers,
      };
    },
    enabled: !!projectId,
  });

  const items = [
    snapshotData?.offer && {
      label: "Offer",
      value: snapshotData.offer.title || "Untitled Offer",
      sub: snapshotData.offer.price
        ? `$${snapshotData.offer.price.toLocaleString()}${
            snapshotData.offer.price_type === "recurring" ? "/mo" : ""
          }`
        : null,
    },
    snapshotData?.launchDate && {
      label: "Launch Date",
      value: new Date(snapshotData.launchDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
      sub: null,
    },
    snapshotData?.snapshot?.email_list_size && {
      label: "Email List",
      value: snapshotData.snapshot.email_list_size.toLocaleString(),
      sub: "starting",
    },
    snapshotData?.totalFollowers &&
      snapshotData.totalFollowers > 0 && {
        label: "Social Followers",
        value: snapshotData.totalFollowers.toLocaleString(),
        sub: "starting",
      },
  ].filter(Boolean) as { label: string; value: string; sub: string | null }[];

  if (items.length === 0 && !snapshotData?.transformation) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
        Your Launch
      </p>
      {snapshotData?.transformation && (
        <p className="text-sm text-foreground/80 italic leading-relaxed">
          "
          {snapshotData.transformation.length > 100
            ? snapshotData.transformation.slice(0, 100) + "..."
            : snapshotData.transformation}
          "
        </p>
      )}
      {items.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {items.map((item, i) => (
            <div key={i} className="space-y-0.5">
              <p className="text-[11px] text-muted-foreground">{item.label}</p>
              <p className="text-sm font-medium text-foreground">
                {item.value}
              </p>
              {item.sub && (
                <p className="text-[10px] text-muted-foreground">{item.sub}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// --- Helpers ---

const getReassuranceText = (
  activePhase: string,
  isComplete: boolean,
  nextPhase?: string
): string => {
  if (!isComplete) {
    const phaseMessages: Record<string, string> = {
      planning:
        "You're laying the groundwork. Take your time with each piece.",
      messaging:
        "Now you're crafting your message. This is where your offer starts to take shape.",
      build: "You're building the assets for your launch. One step at a time.",
      content:
        "Content creation time. This is how you'll connect with your audience.",
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

// --- Main Component ---

const FunnelOverviewContent = ({ projectId }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stuckModalOpen, setStuckModalOpen] = useState(false);
  const [showPostLaunchTasks, setShowPostLaunchTasks] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);

  const [dismissedPhases, setDismissedPhases] = useState<string[]>([]);

  useEffect(() => {
    const loadDismissed = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from("profiles")
        .select("dismissed_celebrations")
        .eq("user_id", user.id)
        .single();

      if (data?.dismissed_celebrations) {
        const celebrations = data.dismissed_celebrations as Record<
          string,
          boolean
        >;
        const dismissed = Object.keys(celebrations)
          .filter(
            (key) => key.startsWith(projectId) && celebrations[key]
          )
          .map((key) => key.replace(`${projectId}_`, ""));
        setDismissedPhases(dismissed);
      }
    };
    loadDismissed();
  }, [user?.id, projectId]);

  const handleDismissCelebration = async (phase: string) => {
    const updated = [...dismissedPhases, phase];
    setDismissedPhases(updated);

    if (!user?.id) return;
    const { data: profileData } = await supabase
      .from("profiles")
      .select("dismissed_celebrations")
      .eq("user_id", user.id)
      .single();

    const existing =
      (profileData?.dismissed_celebrations as Record<string, boolean>) || {};
    existing[`${projectId}_${phase}`] = true;

    await supabase
      .from("profiles")
      .update({ dismissed_celebrations: existing })
      .eq("user_id", user.id);
  };

  // Use the project lifecycle hook
  const {
    projectState,
    isLoading: lifecycleLoading,
    dashboardViewType,
    resume,
    pause,
    archive,
    markCompleted,
    transitionTo,
  } = useProjectLifecycle({ projectId });

  // Use the task engine to get the next best task (only active when state allows)
  const {
    isLoading: taskEngineLoading,
    nextBestTask,
    activePhase,
    phaseStatuses,
    projectTasks,
    getTaskTemplate,
    selectedFunnelType,
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
        .select(
          "*, parent_project:projects!projects_parent_project_id_fkey(id, name)"
        )
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

  // Fetch today's planner task count
  const { data: todayPlannerCount = 0 } = useQuery({
    queryKey: ["today-planner-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const today = new Date();
      const startOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate()
      ).toISOString();
      const endOfDay = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        23,
        59,
        59
      ).toISOString();
      const { count } = await supabase
        .from("tasks")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("task_scope", "planner")
        .neq("column_id", "done")
        .gte("due_at", startOfDay)
        .lte("due_at", endOfDay);
      return count || 0;
    },
    enabled: !!user?.id,
  });

  // Content this week count
  const contentCount = (() => {
    if (!contentData) return 0;
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    return contentData.filter((item) => {
      if (!item.scheduled_at) return false;
      const d = parseISO(item.scheduled_at);
      return d >= weekStart && d <= weekEnd;
    }).length;
  })();

  const isLoading = taskEngineLoading || projectLoading || lifecycleLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Determine the view key for animation
  const viewKey =
    dashboardViewType === "launched" && showPostLaunchTasks
      ? "tasks"
      : dashboardViewType;

  // Handle different dashboard views based on project lifecycle state
  if (dashboardViewType === "paused") {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="paused"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <ProjectPausedView
            projectName={project?.name}
            onResume={async () => {
              await resume();
            }}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  if (dashboardViewType === "completed") {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="completed"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <ProjectCompletedView
            projectName={project?.name}
            onRelaunch={async () => {
              await transitionTo("in_progress");
            }}
            onNewProject={() => {
              localStorage.removeItem("lastProjectInfo");
              navigate("/app?new=1");
            }}
            onPause={async () => {
              await transitionTo("paused");
            }}
          />
        </motion.div>
      </AnimatePresence>
    );
  }

  if (dashboardViewType === "launched" && !showPostLaunchTasks) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key="launched"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          <ProjectLaunchedView
            projectName={project?.name}
            onContinueToPostLaunch={() => {
              setShowPostLaunchTasks(true);
            }}
            onMarkComplete={markCompleted}
          />
        </motion.div>
      </AnimatePresence>
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
  const isPhaseComplete = phaseStatuses[activePhase] === "complete";

  // Find the most recently completed phase (for celebration)
  const completedPhases = PHASES.filter(
    (p) => phaseStatuses[p] === "complete"
  );
  const mostRecentlyCompletedPhase =
    completedPhases.length > 0 && completedPhases.length < PHASES.length
      ? completedPhases.filter(p => p !== 'setup')[completedPhases.filter(p => p !== 'setup').length - 1] ?? null
      : null;

  // Get next phase after the most recently completed phase
  const nextPhaseAfterCompleted = mostRecentlyCompletedPhase
    ? PHASES[PHASES.indexOf(mostRecentlyCompletedPhase) + 1]
    : undefined;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        className="max-w-2xl mx-auto space-y-5 py-6 px-4"
      >
        {/* Memory Review Banner */}
        <MemoryReviewBanner projectId={projectId} />

        {/* Check-in banner */}
        <CheckInBanner onStartCheckIn={() => setCheckInOpen(true)} />

        <GreetingHeader
          firstName={profile?.first_name}
          projectName={project?.name}
          projectId={projectId}
          projectState={projectState}
          isRelaunch={project?.is_relaunch}
          parentProjectId={
            Array.isArray(project?.parent_project)
              ? project.parent_project[0]?.id
              : (
                  project?.parent_project as {
                    id: string;
                    name: string;
                  } | null
                )?.id
          }
          parentProjectName={
            Array.isArray(project?.parent_project)
              ? project.parent_project[0]?.name
              : (
                  project?.parent_project as {
                    id: string;
                    name: string;
                  } | null
                )?.name
          }
          onPause={pause}
          onResume={resume}
          onArchive={archive}
          onMarkComplete={
            projectState === "launched" ? markCompleted : undefined
          }
        />

        {/* Phase Progress Rail */}
        <PhaseProgressRail
          phases={PHASES.filter(p => p !== 'setup')}
          phaseStatuses={phaseStatuses}
          activePhase={activePhase}
          projectTasks={projectTasks}
          getTaskTemplate={getTaskTemplate}
        />

        {/* Launch Timeline */}
        {phaseStatuses['setup'] === 'complete' && (
          <LaunchTimelineInline
            phaseStatuses={phaseStatuses}
            activePhase={activePhase}
            funnelType={selectedFunnelType}
          />
        )}

        {/* Phase celebration */}
        {mostRecentlyCompletedPhase &&
          !dismissedPhases.includes(mostRecentlyCompletedPhase) && (
            <PhaseCelebrationCard
              completedPhase={mostRecentlyCompletedPhase}
              nextPhase={nextPhaseAfterCompleted}
              onDismiss={() =>
                handleDismissCelebration(mostRecentlyCompletedPhase)
              }
            />
          )}

        {/* Check-in flow dialog */}
        <CheckInFlow open={checkInOpen} onOpenChange={setCheckInOpen} />

        {/* Next Best Task - hero card */}
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

        {/* Today — slim 2-column grid */}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Today
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1">
              <p className="text-[11px] text-muted-foreground">Due Today</p>
              <p
                className={`text-2xl font-semibold ${
                  todayPlannerCount > 0
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {todayPlannerCount}
              </p>
              {todayPlannerCount > 0 && (
                <Link
                  to="/planner"
                  className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
                >
                  View <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
            <div className="rounded-xl border border-border bg-card p-4 flex flex-col gap-1">
              <p className="text-[11px] text-muted-foreground">
                Content This Week
              </p>
              <p className="text-2xl font-semibold text-foreground">
                {contentCount}
              </p>
              <Link
                to={`/projects/${projectId}/content`}
                className="text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1"
              >
                Planner <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* Launch Snapshot */}
        <LaunchSnapshotCard projectId={projectId} />

        {/* Upcoming content */}
        {hasContent && (
          <UpcomingContentCard
            today={todayContent}
            tomorrow={tomorrowContent}
            projectId={projectId}
          />
        )}

        {/* Subtle stuck help link */}
        <div className="text-center py-2">
          <button
            onClick={() => setStuckModalOpen(true)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
          >
            Feeling stuck? Get help with this step →
          </button>
        </div>

        <StuckHelpDialog
          open={stuckModalOpen}
          onOpenChange={setStuckModalOpen}
          currentTask={{
            title: nextBestTask?.title || "Getting started",
            whyItMatters:
              nextBestTask?.whyItMatters ||
              "This helps you move forward with your launch.",
          }}
          projectContext={project?.name}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default FunnelOverviewContent;
