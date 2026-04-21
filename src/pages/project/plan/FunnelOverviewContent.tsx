import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Loader2,
  Check,
  Compass,
  MessageCircle,
  Hammer,
  PenTool,
  Megaphone,
  Rocket,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useState, lazy, Suspense } from "react";
import { isToday, isTomorrow, parseISO, startOfWeek, endOfWeek, format } from "date-fns";
import {
  GreetingHeader,
  NextBestTaskCard,
  UpcomingContentCard,
  ProjectCompletedView,
  ProjectPausedView,
  ProjectLaunchedView,
  AINudgeCard,
} from "@/components/dashboard";
import { CheckInBanner } from "@/components/check-in";
import { useTaskEngine } from "@/hooks/useTaskEngine";
import { useProjectLifecycle } from "@/hooks/useProjectLifecycle";
import { PHASE_LABELS, PHASES, Phase, PhaseStatus } from "@/types/tasks";

// Lazy-loaded heavy dialogs (only mounted on demand)
const CheckInFlow = lazy(() =>
  import("@/components/check-in").then((m) => ({ default: m.CheckInFlow }))
);
const StuckHelpDialog = lazy(() =>
  import("@/components/dashboard/StuckHelpDialog").then((m) => ({ default: m.StuckHelpDialog }))
);

interface Props {
  projectId: string;
}

// Visible phases for the editorial timeline (matches mockup)
const VISIBLE_PHASES: Phase[] = ['planning', 'messaging', 'build', 'content', 'pre-launch', 'launch'];

// Icons per phase (replaces week-number labels)
const PHASE_ICONS: Record<Phase, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  setup: Compass,
  planning: Compass,
  messaging: MessageCircle,
  build: Hammer,
  content: PenTool,
  'pre-launch': Megaphone,
  launch: Rocket,
  'post-launch': Rocket,
};

// ── Editorial Launch Timeline ──
const LaunchTimelineEditorial = ({
  phaseStatuses,
  activePhase,
  activePct,
}: {
  phaseStatuses: Record<Phase, PhaseStatus>;
  activePhase: Phase;
  activePct: number;
}) => {
  return (
    <section
      style={{
        padding: "32px 0",
        borderTop: "1px solid hsl(var(--border-hairline))",
      }}
    >
      <div className="mb-4">
        <div
          className="uppercase"
          style={{
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontSize: 11,
            letterSpacing: "0.14em",
            color: "hsl(var(--terracotta-500))",
            fontWeight: 600,
          }}
        >
          Launch timeline
        </div>
        <div
          className="text-[hsl(var(--ink-900))] mt-1"
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 500,
            fontSize: 22,
            letterSpacing: "-0.01em",
          }}
        >
          {phaseStatuses[activePhase] === 'complete'
            ? `${PHASE_LABELS[activePhase]} complete.`
            : `Halfway through ${PHASE_LABELS[activePhase]}.`}
        </div>
      </div>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${VISIBLE_PHASES.length}, 1fr)` }}
      >
        {VISIBLE_PHASES.map((phase) => {
          const status = phaseStatuses[phase];
          const isDone = status === 'complete';
          const isActive = phase === activePhase && !isDone;
          const PhaseIcon = PHASE_ICONS[phase];
          const iconColor = isActive
            ? "hsl(var(--terracotta-500))"
            : isDone
            ? "hsl(var(--ink-900))"
            : "hsl(var(--fg-muted))";

          return (
            <div
              key={phase}
              className="relative min-w-0"
              style={{
                background: isActive ? "hsl(var(--ink-900))" : "#fff",
                color: isActive ? "hsl(var(--paper-100))" : "hsl(var(--ink-900))",
                border: isActive ? 0 : "1px solid hsl(var(--border-hairline))",
                borderRadius: 12,
                padding: "12px 12px 14px",
              }}
            >
              <div className="flex justify-between items-center gap-1.5">
                <PhaseIcon
                  className="shrink-0"
                  style={{ width: 16, height: 16, color: iconColor }}
                />
                {isDone && (
                  <Check
                    className="shrink-0"
                    style={{ color: "hsl(var(--moss-500))", width: 12, height: 12, strokeWidth: 2.5 }}
                  />
                )}
                {isActive && (
                  <span
                    className="shrink-0"
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: 999,
                      background: "hsl(var(--terracotta-500))",
                    }}
                  />
                )}
              </div>
              <div
                className="truncate mt-2.5"
                style={{
                  fontFamily: '"Playfair Display", Georgia, serif',
                  fontWeight: 500,
                  fontSize: 15,
                  letterSpacing: "-0.01em",
                }}
              >
                {PHASE_LABELS[phase]}
              </div>
              <div
                className="mt-2.5 overflow-hidden"
                style={{
                  height: 3,
                  borderRadius: 999,
                  background: isActive
                    ? "rgba(251,247,241,0.15)"
                    : isDone
                    ? "hsl(var(--moss-500))"
                    : "hsl(var(--paper-200))",
                }}
              >
                {isActive && (
                  <div
                    style={{
                      width: `${activePct}%`,
                      height: "100%",
                      background: "hsl(var(--terracotta-500))",
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

// ── Phase narrative card (left column small card) ──
const PHASE_NARRATIVE: Partial<Record<Phase, { headline: string; copy: string }>> = {
  setup: {
    headline: "You've set the stage.",
    copy: "Workspace ready. Time to start planning the launch.",
  },
  planning: {
    headline: "You've laid the foundation.",
    copy: "Audience, offer, and funnel are defined. Time to craft your message.",
  },
  messaging: {
    headline: "Your voice is finding clarity.",
    copy: "The story is in place. Now we build the assets to share it.",
  },
  build: {
    headline: "The pieces are in place.",
    copy: "Pages and emails are built. Let's create the content that fills them.",
  },
  content: {
    headline: "You have what to say.",
    copy: "Content is ready. Time to warm up the room before launch week.",
  },
  'pre-launch': {
    headline: "The runway is lit.",
    copy: "Anticipation built. Open the doors.",
  },
};

const PhaseCompleteCard = ({ phase }: { phase: Phase }) => {
  const narrative = PHASE_NARRATIVE[phase];
  if (!narrative) return null;
  return (
    <div
      className="bg-white"
      style={{
        border: "1px solid hsl(var(--border-hairline))",
        borderRadius: 14,
        padding: 24,
      }}
    >
      <div
        className="inline-flex items-center gap-1.5 whitespace-nowrap"
        style={{
          padding: "3px 10px",
          background: "hsl(var(--moss-100))",
          borderRadius: 999,
        }}
      >
        <Check
          className="shrink-0"
          style={{ color: "hsl(var(--moss-700))", width: 12, height: 12, strokeWidth: 2.5 }}
        />
        <span
          style={{
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontSize: 11,
            color: "hsl(var(--moss-700))",
            fontWeight: 600,
            letterSpacing: "0.04em",
          }}
        >
          {PHASE_LABELS[phase]} complete
        </span>
      </div>
      <div
        className="text-[hsl(var(--ink-900))] mt-3"
        style={{
          fontFamily: '"Playfair Display", Georgia, serif',
          fontWeight: 500,
          fontSize: 20,
          letterSpacing: "-0.01em",
          lineHeight: 1.25,
        }}
      >
        {narrative.headline}
      </div>
      <p
        className="mt-2 text-[hsl(var(--fg-secondary))] m-0"
        style={{
          fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
          fontSize: 13.5,
          lineHeight: 1.55,
        }}
      >
        {narrative.copy}
      </p>
    </div>
  );
};

// ── Your Launch summary card ──
const YourLaunchCard = ({
  projectName,
  offerTitle,
  funnelLabel,
  launchDate,
}: {
  projectName?: string;
  offerTitle?: string | null;
  funnelLabel?: string | null;
  launchDate?: string | null;
}) => (
  <div
    className="bg-white"
    style={{
      border: "1px solid hsl(var(--border-hairline))",
      borderRadius: 14,
      padding: 24,
    }}
  >
    <div
      className="uppercase text-[hsl(var(--fg-muted))]"
      style={{
        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
        fontSize: 11,
        letterSpacing: "0.14em",
        fontWeight: 600,
      }}
    >
      Your launch
    </div>
    <div
      className="text-[hsl(var(--ink-900))] mt-1.5"
      style={{
        fontFamily: '"Playfair Display", Georgia, serif',
        fontWeight: 500,
        fontSize: 22,
        letterSpacing: "-0.01em",
        lineHeight: 1.2,
      }}
    >
      {projectName || "Your launch"}
    </div>
    <div
      className="mt-3.5 grid gap-1.5"
      style={{
        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
        fontSize: 12.5,
        color: "hsl(var(--fg-secondary))",
      }}
    >
      <div className="flex justify-between gap-3 whitespace-nowrap">
        <span>Offer</span>
        <strong className="text-[hsl(var(--ink-900))] font-medium truncate">
          {offerTitle || "—"}
        </strong>
      </div>
      <div className="flex justify-between gap-3 whitespace-nowrap">
        <span>Funnel</span>
        <strong className="text-[hsl(var(--ink-900))] font-medium truncate">
          {funnelLabel || "—"}
        </strong>
      </div>
      <div className="flex justify-between gap-3 whitespace-nowrap">
        <span>Launch</span>
        <strong style={{ color: "hsl(var(--terracotta-500))", fontWeight: 500 }}>
          {launchDate ? format(parseISO(launchDate), "MMM d") : "Not set"}
        </strong>
      </div>
    </div>
  </div>
);

// ── Today stats card ──
const TodayStatsCard = ({
  dueToday,
  contentThisWeek,
  projectId,
}: {
  dueToday: number;
  contentThisWeek: number;
  projectId: string;
}) => (
  <div
    className="bg-white"
    style={{
      border: "1px solid hsl(var(--border-hairline))",
      borderRadius: 14,
      padding: 20,
    }}
  >
    <div
      className="uppercase"
      style={{
        fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
        fontSize: 11,
        letterSpacing: "0.14em",
        color: "hsl(var(--terracotta-500))",
        fontWeight: 600,
      }}
    >
      Today
    </div>
    <div className="mt-3 grid gap-2.5">
      <div
        className="flex justify-between items-center gap-3"
        style={{ padding: "10px 0", borderBottom: "1px solid hsl(var(--border-hairline))" }}
      >
        <div className="min-w-0">
          <div
            className="text-[hsl(var(--ink-800))] whitespace-nowrap"
            style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: 13 }}
          >
            Due today
          </div>
          <div
            className="text-[hsl(var(--fg-muted))] mt-0.5"
            style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: 11 }}
          >
            {dueToday === 0 ? "Nothing overdue — breathe." : "Tap to see your list."}
          </div>
        </div>
        <Link
          to="/planner"
          className="text-[hsl(var(--ink-900))] hover:opacity-80 transition-opacity"
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 400,
            fontSize: 34,
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          {dueToday}
        </Link>
      </div>
      <div className="flex justify-between items-center gap-3" style={{ padding: "10px 0 0" }}>
        <div className="min-w-0 flex-1">
          <div
            className="text-[hsl(var(--ink-800))] whitespace-nowrap"
            style={{ fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif', fontSize: 13 }}
          >
            Content this week
          </div>
          <Link
            to={`/projects/${projectId}/content`}
            className="hover:opacity-80 transition-opacity whitespace-nowrap"
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontSize: 11,
              color: "hsl(var(--terracotta-500))",
            }}
          >
            Go to Planner →
          </Link>
        </div>
        <div
          className="text-[hsl(var(--ink-900))] shrink-0"
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 400,
            fontSize: 34,
            letterSpacing: "-0.02em",
            lineHeight: 1,
          }}
        >
          {contentThisWeek}
        </div>
      </div>
    </div>
  </div>
);

// ── Helper ──
const FUNNEL_LABEL_SHORT: Record<string, string> = {
  content_to_offer: "Content → Offer",
  freebie_email_offer: "Freebie",
  live_training_offer: "Live training",
  application_call: "Application",
  membership: "Membership",
  challenge: "Challenge",
  launch: "Launch",
};

// --- Main Component ---

const FunnelOverviewContent = ({ projectId }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stuckModalOpen, setStuckModalOpen] = useState(false);
  const [showPostLaunchTasks, setShowPostLaunchTasks] = useState(false);
  const [checkInOpen, setCheckInOpen] = useState(false);

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

  const {
    isLoading: taskEngineLoading,
    nextBestTask,
    activePhase,
    phaseStatuses,
    projectTasks,
    getTaskTemplate,
    selectedFunnelType,
  } = useTaskEngine({ projectId });

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

  const { data: project, isLoading: projectLoading } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*, parent_project:projects!projects_parent_project_id_fkey(id, name)")
        .eq("id", projectId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

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

  const { data: snapshotData } = useQuery({
    queryKey: ["dashboard-snapshot-mini", projectId],
    queryFn: async () => {
      const [offersRes, tasksRes] = await Promise.all([
        supabase
          .from("offers")
          .select("title")
          .eq("project_id", projectId)
          .order("slot_position")
          .limit(1),
        supabase
          .from("project_tasks")
          .select("task_id, input_data")
          .eq("project_id", projectId)
          .eq("status", "completed")
          .in("task_id", ["launch_set_dates"]),
      ]);
      const offer = offersRes.data?.[0] || null;
      const datesTask = tasksRes.data?.find((t) => t.task_id === "launch_set_dates");
      const launchDate = (datesTask?.input_data as any)?.launch_date || null;
      return { offer, launchDate };
    },
    enabled: !!projectId,
  });

  const { data: todayPlannerCount = 0 } = useQuery({
    queryKey: ["today-planner-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString();
      const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59).toISOString();
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

  // Active phase progress %
  const activePhasePct = (() => {
    if (!projectTasks || !getTaskTemplate) return 35;
    const phaseTasks = projectTasks.filter((pt) => {
      const t = getTaskTemplate(pt.taskId);
      return t?.phase === activePhase && !t?.canSkip;
    });
    if (phaseTasks.length === 0) return 0;
    const done = phaseTasks.filter((pt) => pt.status === "completed" || pt.status === "skipped").length;
    return Math.round((done / phaseTasks.length) * 100);
  })();

  // Step index within phase
  const { stepIndex, stepTotal } = (() => {
    if (!projectTasks || !getTaskTemplate) return { stepIndex: 1, stepTotal: 1 };
    const phaseTasks = projectTasks.filter((pt) => {
      const t = getTaskTemplate(pt.taskId);
      return t?.phase === activePhase && !t?.canSkip;
    });
    const completed = phaseTasks.filter((pt) => pt.status === "completed" || pt.status === "skipped").length;
    return { stepIndex: Math.min(completed + 1, phaseTasks.length), stepTotal: phaseTasks.length || 1 };
  })();

  const isLoading = taskEngineLoading || projectLoading || lifecycleLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--terracotta))]" />
      </div>
    );
  }

  const viewKey =
    dashboardViewType === "launched" && showPostLaunchTasks ? "tasks" : dashboardViewType;

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

  const todayContent = (contentData || []).filter(
    (item) => item.scheduled_at && isToday(parseISO(item.scheduled_at))
  );
  const tomorrowContent = (contentData || []).filter(
    (item) => item.scheduled_at && isTomorrow(parseISO(item.scheduled_at))
  );
  const upcomingContent = (contentData || []).filter(
    (item) =>
      item.scheduled_at &&
      !isToday(parseISO(item.scheduled_at)) &&
      !isTomorrow(parseISO(item.scheduled_at))
  );

  const completedPhases = PHASES.filter((p) => phaseStatuses[p] === "complete");
  const mostRecentlyCompletedPhase =
    completedPhases.length > 0 && completedPhases.length < PHASES.length
      ? completedPhases.filter((p) => p !== "setup")[
          completedPhases.filter((p) => p !== "setup").length - 1
        ] ?? null
      : null;
  const nextPhaseAfterCompleted = mostRecentlyCompletedPhase
    ? PHASES[PHASES.indexOf(mostRecentlyCompletedPhase) + 1]
    : undefined;

  const showTimeline = phaseStatuses['setup'] === 'complete' && !!selectedFunnelType;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={viewKey}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
        style={{ maxWidth: 1200, margin: "0 auto", padding: "8px 0 96px" }}
      >
        <GreetingHeader
          firstName={profile?.first_name}
          projectName={project?.name}
          projectId={projectId}
          projectState={projectState}
          isRelaunch={project?.is_relaunch}
          parentProjectId={
            Array.isArray(project?.parent_project)
              ? project.parent_project[0]?.id
              : (project?.parent_project as { id: string; name: string } | null)?.id
          }
          parentProjectName={
            Array.isArray(project?.parent_project)
              ? project.parent_project[0]?.name
              : (project?.parent_project as { id: string; name: string } | null)?.name
          }
          onPause={pause}
          onResume={resume}
          onArchive={archive}
          onMarkComplete={projectState === "launched" ? markCompleted : undefined}
        />

        {showTimeline && (
          <LaunchTimelineEditorial
            phaseStatuses={phaseStatuses}
            activePhase={activePhase}
            activePct={activePhasePct}
          />
        )}

        <Suspense fallback={null}>
          {checkInOpen && <CheckInFlow open={checkInOpen} onOpenChange={setCheckInOpen} />}
        </Suspense>

        {/* Two-column body */}
        <div
          className="grid gap-7 mt-2"
          style={{ gridTemplateColumns: "minmax(0, 1.55fr) minmax(0, 1fr)" }}
        >
          {/* Primary column */}
          <div className="grid gap-6 min-w-0">
            {nextBestTask ? (
              <NextBestTaskCard
                title={nextBestTask.title}
                whyItMatters={nextBestTask.whyItMatters}
                estimatedMinutes={nextBestTask.estimatedTimeRange}
                route={nextBestTask.route}
                phaseLabel={PHASE_LABELS[activePhase]}
                stepIndex={stepIndex}
                stepTotal={stepTotal}
              />
            ) : (
              <div
                className="bg-white text-center"
                style={{
                  border: "1px solid hsl(var(--border-hairline))",
                  borderRadius: 14,
                  padding: 32,
                }}
              >
                <p className="text-muted-foreground">
                  All tasks in this phase are complete. You're ready to move forward.
                </p>
              </div>
            )}

            <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {mostRecentlyCompletedPhase ? (
                <PhaseCompleteCard phase={mostRecentlyCompletedPhase} />
              ) : (
                <div
                  className="bg-white"
                  style={{
                    border: "1px solid hsl(var(--border-hairline))",
                    borderRadius: 14,
                    padding: 24,
                  }}
                >
                  <div
                    className="uppercase text-[hsl(var(--fg-muted))]"
                    style={{
                      fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
                      fontSize: 11,
                      letterSpacing: "0.14em",
                      fontWeight: 600,
                    }}
                  >
                    {PHASE_LABELS[activePhase]} in progress
                  </div>
                  <div
                    className="mt-3"
                    style={{
                      fontFamily: '"Playfair Display", Georgia, serif',
                      fontWeight: 500,
                      fontSize: 20,
                      letterSpacing: "-0.01em",
                      color: "hsl(var(--ink-900))",
                    }}
                  >
                    One quiet step at a time.
                  </div>
                </div>
              )}
              <YourLaunchCard
                projectName={project?.name}
                offerTitle={snapshotData?.offer?.title}
                funnelLabel={
                  selectedFunnelType ? FUNNEL_LABEL_SHORT[selectedFunnelType] || selectedFunnelType : null
                }
                launchDate={snapshotData?.launchDate}
              />
            </div>

            {(todayContent.length + tomorrowContent.length + upcomingContent.length) > 0 && (
              <UpcomingContentCard
                today={todayContent}
                tomorrow={tomorrowContent}
                upcoming={upcomingContent}
                projectId={projectId}
              />
            )}
          </div>

          {/* Secondary column */}
          <div className="grid gap-5 content-start min-w-0">
            <CheckInBanner onStartCheckIn={() => setCheckInOpen(true)} />
            <TodayStatsCard
              dueToday={todayPlannerCount}
              contentThisWeek={contentCount}
              projectId={projectId}
            />
            <AINudgeCard />
          </div>
        </div>

        {/* Stuck footer */}
        <div className="text-center mt-10">
          <button
            onClick={() => setStuckModalOpen(true)}
            className="text-[hsl(var(--fg-muted))] italic hover:text-[hsl(var(--terracotta-500))] transition-colors"
            style={{
              fontFamily: '"Playfair Display", Georgia, serif',
              fontSize: 16,
            }}
          >
            Feeling stuck?{" "}
            <span
              className="not-italic"
              style={{
                color: "hsl(var(--terracotta-500))",
                borderBottom: "1px solid hsl(var(--terracotta-500))",
              }}
            >
              Get help with this step →
            </span>
          </button>
        </div>

        <StuckHelpDialog
          open={stuckModalOpen}
          onOpenChange={setStuckModalOpen}
          currentTask={{
            title: nextBestTask?.title || "Getting started",
            whyItMatters:
              nextBestTask?.whyItMatters || "This helps you move forward with your launch.",
          }}
          projectContext={project?.name}
        />
      </motion.div>
    </AnimatePresence>
  );
};

export default FunnelOverviewContent;
