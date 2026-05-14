import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { format, parseISO, isToday, isTomorrow } from "date-fns";
import { Bell, ArrowRight, Calendar as CalendarIcon, Sparkles, Check, ChevronRight, MessageSquare, Compass, MessageCircle, Hammer, PenTool, Megaphone, Rocket, Kanban, ShoppingBag, BookMarked, BookOpen, ClipboardCheck } from "lucide-react";
import { useHaptics } from "@/hooks/useHaptics";
import { PHASE_LABELS, type Phase, type PhaseStatus } from "@/types/tasks";

const SF = '-apple-system, "SF Pro Text", "SF Pro Display", system-ui, sans-serif';
const SERIF = '"Fraunces", "New York", Georgia, serif';
const TERRACOTTA = "#C65A3E";
const PAPER = "#FBF7F1";
const INK = "#1F1B17";
const INK_60 = "rgba(31,27,23,0.62)";
const INK_40 = "rgba(31,27,23,0.42)";
const HAIRLINE = "rgba(31,27,23,0.10)";

const VISIBLE_PHASES: Phase[] = ["planning", "messaging", "build", "content", "pre-launch", "launch"];
const PHASE_ICONS: Record<Phase, React.ComponentType<any>> = {
  setup: Compass,
  planning: Compass,
  messaging: MessageCircle,
  build: Hammer,
  content: PenTool,
  "pre-launch": Megaphone,
  launch: Rocket,
  "post-launch": Rocket,
};

interface ContentItem {
  id: string;
  title: string;
  content_type: string;
  scheduled_at?: string | null;
}

export interface MobileDashboardProps {
  firstName?: string | null;
  projectName?: string;
  projectState?: string;
  nextBestTask?: {
    title: string;
    whyItMatters: string;
    estimatedTimeRange: string;
    route: string;
  } | null;
  activePhase: Phase;
  phaseStatuses: Record<Phase, PhaseStatus>;
  activePct: number;
  stepIndex: number;
  stepTotal: number;
  dueToday: number;
  upcomingPlanner: number;
  upcomingContent: ContentItem[];
  onStartCheckIn: () => void;
  onStuck: () => void;
  initials?: string;
}

const SectionHeader = ({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) => (
  <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "24px 22px 10px" }}>
    <span style={{ fontFamily: SF, fontSize: 13, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase", color: INK_60 }}>{title}</span>
    {action && (
      <button onClick={onAction} style={{ background: "transparent", border: 0, fontFamily: SF, fontSize: 14, fontWeight: 500, color: TERRACOTTA, letterSpacing: -0.2, cursor: "pointer" }}>{action}</button>
    )}
  </div>
);

const Greeting = ({ firstName, projectName, projectState }: { firstName?: string | null; projectName?: string; projectState?: string }) => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return (
    <div style={{ padding: "4px 22px 2px" }}>
      <div style={{ fontFamily: SF, fontSize: 13, fontWeight: 600, letterSpacing: 0.5, textTransform: "uppercase", color: INK_60 }}>
        {format(new Date(), "EEE · MMM d")}
      </div>
      <h1 style={{ margin: "6px 0 0", fontFamily: SERIF, fontWeight: 400, fontSize: 38, lineHeight: 1.05, letterSpacing: -1.2, color: INK }}>
        {greeting},<br />
        <em style={{ color: TERRACOTTA, fontWeight: 400 }}>{firstName || "friend"}</em>.
      </h1>
      {projectName && (
        <div style={{ marginTop: 10, display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px 5px 8px", borderRadius: 999, background: "rgba(220,229,220,0.7)" }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: "#4F6B52" }} />
          <span style={{ fontFamily: SF, fontSize: 13, fontWeight: 500, color: "#354A38", letterSpacing: -0.1 }}>
            {projectName} · {(projectState || "in progress").replace(/_/g, " ")}
          </span>
        </div>
      )}
    </div>
  );
};

const NextStepHero = ({ task, phaseLabel, stepIndex, stepTotal, onStart }: {
  task: MobileDashboardProps["nextBestTask"];
  phaseLabel: string;
  stepIndex: number;
  stepTotal: number;
  onStart: () => void;
}) => {
  if (!task) return null;
  return (
    <div style={{ margin: "20px 16px 0" }}>
      <div style={{
        borderRadius: 26,
        background: "linear-gradient(155deg, #EFE4D3 0%, #E8D9C6 60%, #DFCCB1 100%)",
        padding: "20px 22px 22px",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 1px 2px rgba(31,27,23,0.06), 0 8px 24px -12px rgba(31,27,23,0.18)",
      }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: "radial-gradient(circle, rgba(198,90,62,0.28), transparent 70%)", pointerEvents: "none" }} />
        <div style={{ width: 36, height: 5, borderRadius: 999, background: "rgba(31,27,23,0.18)", margin: "-4px auto 12px" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: TERRACOTTA }} />
          <span style={{ fontFamily: SF, fontSize: 12, fontWeight: 700, letterSpacing: 0.7, textTransform: "uppercase", color: INK }}>
            Next step · {phaseLabel} · {stepIndex} of {stepTotal}
          </span>
        </div>
        <div style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 28, lineHeight: 1.1, letterSpacing: -0.7, color: INK, marginTop: 14, position: "relative" }}>
          {task.title}
        </div>
        <p style={{ fontFamily: SF, fontSize: 14.5, lineHeight: 1.45, color: "rgba(31,27,23,0.78)", margin: "8px 0 0", position: "relative", letterSpacing: -0.2 }}>
          {task.whyItMatters}
        </p>
        <button
          onClick={onStart}
          style={{
            marginTop: 16, width: "100%",
            background: INK, color: PAPER, border: 0, borderRadius: 14,
            padding: "14px 18px",
            fontFamily: SF, fontSize: 16, fontWeight: 600, letterSpacing: -0.3,
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
            position: "relative", cursor: "pointer",
            boxShadow: "0 1px 0 rgba(255,255,255,0.06) inset, 0 6px 16px -6px rgba(31,27,23,0.4)",
          }}
        >
          Start this step
          <ArrowRight size={17} color={PAPER} strokeWidth={2.2} />
        </button>
        <div style={{ marginTop: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 16, fontFamily: SF, fontSize: 12.5, color: "rgba(31,27,23,0.6)", position: "relative", fontWeight: 500 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <CalendarIcon size={13} strokeWidth={1.8} /> {task.estimatedTimeRange}
          </span>
          <span style={{ width: 3, height: 3, borderRadius: 999, background: "currentColor", opacity: 0.6 }} />
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <Sparkles size={13} strokeWidth={1.8} /> AI helps
          </span>
        </div>
      </div>
    </div>
  );
};

const PhaseCarousel = ({ phaseStatuses, activePhase, activePct }: {
  phaseStatuses: Record<Phase, PhaseStatus>;
  activePhase: Phase;
  activePct: number;
}) => (
  <div>
    <SectionHeader title="Launch timeline" action={`${VISIBLE_PHASES.length} phases`} />
    <div style={{ display: "flex", gap: 10, padding: "4px 16px 8px", overflowX: "auto", scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}>
      {VISIBLE_PHASES.map((ph) => {
        const status = phaseStatuses[ph];
        const isDone = status === "complete";
        const isActive = ph === activePhase && !isDone;
        const Icon = PHASE_ICONS[ph];
        return (
          <div key={ph} style={{
            flexShrink: 0, width: 140, scrollSnapAlign: "start",
            background: isActive ? INK : "#fff",
            color: isActive ? PAPER : INK,
            borderRadius: 18, padding: "14px 14px 16px",
            border: isActive ? 0 : `1px solid ${HAIRLINE}`,
            boxShadow: "0 1px 2px rgba(31,27,23,0.04)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Icon size={16} color={isActive ? TERRACOTTA : isDone ? "#4F6B52" : INK_60} strokeWidth={1.8} />
              {isDone && (
                <div style={{ width: 18, height: 18, borderRadius: 999, background: "#4F6B52", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <Check size={11} color="#fff" strokeWidth={3} />
                </div>
              )}
              {isActive && <span style={{ width: 8, height: 8, borderRadius: 999, background: TERRACOTTA }} />}
            </div>
            <div style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 17, letterSpacing: -0.3, marginTop: 18, lineHeight: 1 }}>
              {PHASE_LABELS[ph]}
            </div>
            <div style={{ marginTop: 12, height: 3, borderRadius: 999, background: isActive ? "rgba(251,247,241,0.18)" : isDone ? "#4F6B52" : "rgba(31,27,23,0.08)", overflow: "hidden" }}>
              {isActive && <div style={{ width: `${activePct}%`, height: "100%", background: TERRACOTTA }} />}
            </div>
          </div>
        );
      })}
    </div>
  </div>
);

const TodayWidget = ({ dueToday, upcomingPlanner, onTap }: { dueToday: number; upcomingPlanner: number; onTap: () => void }) => (
  <div>
    <SectionHeader title="Today" action="Plan ›" onAction={onTap} />
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 16px" }}>
      <button onClick={onTap} style={{ textAlign: "left", border: 0, background: "#fff", borderRadius: 18, padding: "14px 16px 16px", boxShadow: "0 1px 2px rgba(31,27,23,0.04)", cursor: "pointer" }}>
        <div style={{ fontFamily: SF, fontSize: 12, fontWeight: 600, color: INK_60, letterSpacing: -0.1 }}>Due today</div>
        <div style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 44, lineHeight: 1, letterSpacing: -2, color: INK, marginTop: 6 }}>{dueToday}</div>
        <div style={{ fontFamily: SF, fontSize: 12, color: INK_40, marginTop: 4, letterSpacing: -0.1 }}>
          {dueToday === 0 ? "Nothing overdue — breathe." : "Tap to focus."}
        </div>
      </button>
      <button onClick={onTap} style={{ textAlign: "left", border: 0, background: "#fff", borderRadius: 18, padding: "14px 16px 16px", boxShadow: "0 1px 2px rgba(31,27,23,0.04)", cursor: "pointer" }}>
        <div style={{ fontFamily: SF, fontSize: 12, fontWeight: 600, color: INK_60, letterSpacing: -0.1 }}>Upcoming</div>
        <div style={{ fontFamily: SERIF, fontWeight: 400, fontSize: 44, lineHeight: 1, letterSpacing: -2, color: INK, marginTop: 6 }}>{upcomingPlanner}</div>
        <div style={{ fontFamily: SF, fontSize: 12, color: TERRACOTTA, marginTop: 4, fontWeight: 500, letterSpacing: -0.1 }}>On deck →</div>
      </button>
    </div>
  </div>
);

const UpcomingList = ({ items, onTap }: { items: ContentItem[]; onTap: () => void }) => {
  if (items.length === 0) return null;
  return (
    <div>
      <SectionHeader title="Upcoming content" action="Plan ›" onAction={onTap} />
      <div style={{ background: "#fff", borderRadius: 16, margin: "0 16px", boxShadow: "0 1px 2px rgba(31,27,23,0.04)", overflow: "hidden" }}>
        {items.slice(0, 4).map((u, i) => {
          const d = u.scheduled_at ? parseISO(u.scheduled_at) : null;
          const when = !d ? "Soon" : isToday(d) ? "Today" : isTomorrow(d) ? "Tom" : format(d, "EEE");
          const dateStr = d ? format(d, "MMM d") : "";
          return (
            <div key={u.id} onClick={onTap} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", borderTop: i === 0 ? 0 : `0.5px solid ${HAIRLINE}`, cursor: "pointer" }}>
              <div style={{ width: 44, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
                <span style={{ fontFamily: SF, fontSize: 11, fontWeight: 700, color: INK_60, letterSpacing: 0.3, textTransform: "uppercase" }}>{when}</span>
                <span style={{ fontFamily: SF, fontSize: 13, fontWeight: 600, color: INK, letterSpacing: -0.2 }}>{dateStr}</span>
              </div>
              <div style={{ width: 0.5, height: 36, background: HAIRLINE, flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: SF, fontSize: 15, fontWeight: 500, color: INK, letterSpacing: -0.3, lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{u.title}</div>
                <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6, fontFamily: SF, fontSize: 12, color: INK_60, letterSpacing: -0.1 }}>
                  <span style={{ width: 5, height: 5, borderRadius: 999, background: TERRACOTTA }} />
                  {u.content_type || "Content"}
                </div>
              </div>
              <ChevronRight size={16} color={INK_40} strokeWidth={2} />
            </div>
          );
        })}
      </div>
    </div>
  );
};

// Native-only Launch section navigation. On desktop the same destinations
// live in ProjectSidebar; mobile/native hides that sidebar and there's no
// other entry point, so we surface them here.
const ProjectTools = ({
  projectId,
  onNavigate,
}: {
  projectId: string | undefined;
  onNavigate: (href: string) => void;
}) => {
  const tools = [
    { id: "tasks", label: "Launch Tasks", description: "Plan and execute every step", icon: Kanban, href: projectId ? `/projects/${projectId}/tasks` : null },
    { id: "offer", label: "Offer", description: "Shape what you're selling", icon: ShoppingBag, href: projectId ? `/projects/${projectId}/offer` : null },
    { id: "summary", label: "Launch Brief", description: "Project snapshot at a glance", icon: BookMarked, href: projectId ? `/projects/${projectId}/summary` : null },
    { id: "playbook", label: "Playbook", description: "Your launch system", icon: BookOpen, href: "/playbook" },
    { id: "assessments", label: "Assessments", description: "Coach + launch readiness", icon: ClipboardCheck, href: "/assessments" },
  ].filter((t): t is { id: string; label: string; description: string; icon: typeof Kanban; href: string } => t.href !== null);

  if (tools.length === 0) return null;

  return (
    <div>
      <SectionHeader title="Project Tools" />
      <div style={{ background: "#fff", borderRadius: 16, margin: "0 16px", boxShadow: "0 1px 2px rgba(31,27,23,0.04)", overflow: "hidden" }}>
        {tools.map((t, i) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => onNavigate(t.href)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 16px",
                borderTop: i === 0 ? 0 : `0.5px solid ${HAIRLINE}`,
                background: "#fff",
                border: 0,
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 12,
                  flexShrink: 0,
                  background: "rgba(198,90,62,0.10)",
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={18} color={TERRACOTTA} strokeWidth={2} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: SF, fontSize: 15, fontWeight: 600, color: INK, letterSpacing: -0.3, lineHeight: 1.25 }}>
                  {t.label}
                </div>
                <div style={{ fontFamily: SF, fontSize: 12.5, color: INK_60, marginTop: 2, letterSpacing: -0.1 }}>
                  {t.description}
                </div>
              </div>
              <ChevronRight size={16} color={INK_40} strokeWidth={2} />
            </button>
          );
        })}
      </div>
    </div>
  );
};

const CheckInBanner = ({ onStart }: { onStart: () => void }) => (
  <div style={{ margin: "20px 16px 0" }}>
    <div style={{ background: "linear-gradient(135deg, #F8E9C5, #F2D9A8)", borderRadius: 18, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: "rgba(31,27,23,0.08)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
        <MessageSquare size={20} color={INK} strokeWidth={2} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: SERIF, fontWeight: 500, fontSize: 16, letterSpacing: -0.3, color: INK, lineHeight: 1.15 }}>Quick check-in</div>
        <div style={{ fontFamily: SF, fontSize: 12.5, color: "rgba(31,27,23,0.7)", marginTop: 2, letterSpacing: -0.1 }}>Three questions. Keeps momentum honest.</div>
      </div>
      <button onClick={onStart} style={{ background: INK, color: PAPER, border: 0, borderRadius: 999, padding: "8px 14px", fontFamily: SF, fontSize: 13, fontWeight: 600, letterSpacing: -0.2, flexShrink: 0, cursor: "pointer" }}>Start</button>
    </div>
  </div>
);

const AINudge = () => (
  <div style={{ margin: "24px 16px 0" }}>
    <div style={{ background: INK, color: PAPER, borderRadius: 22, padding: "20px 22px 22px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: -30, right: -30, width: 140, height: 140, borderRadius: "50%", background: "radial-gradient(circle, rgba(198,90,62,0.35), transparent 70%)" }} />
      <div style={{ display: "inline-flex", alignItems: "center", gap: 7, position: "relative" }}>
        <Sparkles size={14} color={TERRACOTTA} strokeWidth={2.2} />
        <span style={{ fontFamily: SF, fontSize: 12, fontWeight: 700, color: TERRACOTTA, letterSpacing: 0.6, textTransform: "uppercase" }}>From your AI team</span>
      </div>
      <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 400, fontSize: 19, lineHeight: 1.35, marginTop: 12, letterSpacing: -0.3, position: "relative", color: PAPER }}>
        "Your last titles leaned into curiosity. Try one that names the outcome directly — it tends to land better with this audience."
      </div>
    </div>
  </div>
);

export const MobileDashboard = ({
  firstName, projectName, projectState,
  nextBestTask, activePhase, phaseStatuses, activePct, stepIndex, stepTotal,
  dueToday, upcomingPlanner, upcomingContent,
  onStartCheckIn, onStuck, initials,
}: MobileDashboardProps) => {
  const navigate = useNavigate();
  const { id: projectId } = useParams();
  const { trigger: haptic } = useHaptics();
  const [scrolled, setScrolled] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);

  const navigateWithHaptic = (href: string) => {
    haptic("selection");
    navigate(href);
  };

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const onScroll = () => setScrolled(el.scrollTop > 80);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const phaseLabel = PHASE_LABELS[activePhase];

  return (
    <div className="md:hidden" style={{ position: "fixed", inset: 0, background: PAPER, fontFamily: SF, color: INK, zIndex: 30 }}>
      {/* Sticky nav */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, zIndex: 30,
        paddingTop: "calc(env(safe-area-inset-top) + 4px)", paddingBottom: 4,
        background: scrolled ? "rgba(251,247,241,0.85)" : "transparent",
        backdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
        WebkitBackdropFilter: scrolled ? "blur(20px) saturate(180%)" : "none",
        borderBottom: scrolled ? `0.5px solid ${HAIRLINE}` : "0.5px solid transparent",
        transition: "all 240ms cubic-bezier(0.22, 0.61, 0.36, 1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 16px", height: 36 }}>
          <div style={{ fontFamily: SERIF, fontStyle: "italic", fontWeight: 500, fontSize: 22, letterSpacing: -0.5, color: INK, opacity: scrolled ? 1 : 0, transform: scrolled ? "translateY(0)" : "translateY(6px)", transition: "all 200ms ease-out" }}>
            Today
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ width: 36, height: 36, borderRadius: 999, border: 0, background: scrolled ? "rgba(31,27,23,0.06)" : "rgba(255,255,255,0.5)", display: "inline-flex", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer" }} aria-label="Notifications">
              <Bell size={17} color={INK} strokeWidth={1.8} />
            </button>
            <Link to="/settings" style={{ width: 36, height: 36, borderRadius: 999, background: INK, color: PAPER, display: "inline-flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontWeight: 500, fontSize: 14, letterSpacing: -0.3, textDecoration: "none" }}>
              {initials || (firstName?.[0]?.toUpperCase() ?? "Y")}
            </Link>
          </div>
        </div>
      </div>

      {/* Scroller */}
      <div ref={scrollerRef} style={{
        position: "absolute", inset: 0, overflowY: "auto",
        paddingTop: "calc(env(safe-area-inset-top) + 50px)",
        paddingBottom: "var(--mobile-tabbar-h, 24px)",
        WebkitOverflowScrolling: "touch",
      }}>
        <Greeting firstName={firstName} projectName={projectName} projectState={projectState} />
        <NextStepHero
          task={nextBestTask}
          phaseLabel={phaseLabel}
          stepIndex={stepIndex}
          stepTotal={stepTotal}
          onStart={() => nextBestTask && navigate(nextBestTask.route)}
        />
        <PhaseCarousel phaseStatuses={phaseStatuses} activePhase={activePhase} activePct={activePct} />
        <ProjectTools projectId={projectId} onNavigate={navigateWithHaptic} />
        <TodayWidget dueToday={dueToday} upcomingPlanner={upcomingPlanner} onTap={() => navigate("/planner")} />
        <UpcomingList items={upcomingContent} onTap={() => navigate("/planner")} />
        <CheckInBanner onStart={onStartCheckIn} />
        <AINudge />
        <div style={{ textAlign: "center", padding: "32px 24px 24px" }}>
          <button onClick={onStuck} style={{ background: "transparent", border: 0, fontFamily: SERIF, fontStyle: "italic", fontSize: 15, color: INK_60, cursor: "pointer" }}>
            Feeling stuck?{" "}
            <span style={{ color: TERRACOTTA, borderBottom: `1px solid ${TERRACOTTA}`, paddingBottom: 1 }}>
              Get help with this step →
            </span>
          </button>
        </div>
      </div>

    </div>
  );
};
