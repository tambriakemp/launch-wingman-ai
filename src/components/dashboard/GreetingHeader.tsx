import { Link } from "react-router-dom";
import { format } from "date-fns";
import { ProjectMenu } from "./ProjectMenu";
import { ProjectState, PROJECT_STATE_LABELS } from "@/types/projectLifecycle";

interface GreetingHeaderProps {
  firstName?: string | null;
  projectName?: string;
  projectId?: string;
  projectState?: ProjectState;
  isRelaunch?: boolean;
  parentProjectId?: string | null;
  parentProjectName?: string | null;
  onPause?: () => Promise<boolean>;
  onResume?: () => Promise<boolean>;
  onArchive?: () => Promise<boolean>;
  onMarkComplete?: () => Promise<boolean>;
  onShareUpdate?: () => void;
  onNewPiece?: () => void;
}

const getTimeOfDayGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export const GreetingHeader = ({
  firstName,
  projectName,
  projectId,
  projectState,
  isRelaunch,
  parentProjectId,
  parentProjectName,
  onPause,
  onResume,
  onArchive,
  onMarkComplete,
  onShareUpdate,
  onNewPiece,
}: GreetingHeaderProps) => {
  const greeting = getTimeOfDayGreeting();
  const displayName = firstName || "there";

  return (
    <div
      className="flex items-end justify-between gap-6 flex-wrap pb-7"
      style={{ borderBottom: "1px solid hsl(var(--border-hairline))" }}
    >
      <div className="min-w-0 flex-1" style={{ flexBasis: 420 }}>
        <div
          className="uppercase text-[hsl(var(--fg-muted))]"
          style={{
            fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
            fontSize: 11,
            letterSpacing: "0.14em",
            fontWeight: 600,
          }}
        >
          {format(new Date(), "EEE · MMMM d")}
        </div>
        <h1
          className="text-[hsl(var(--ink-900))] mt-1.5"
          style={{
            fontFamily: '"Playfair Display", Georgia, serif',
            fontWeight: 400,
            fontSize: 48,
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
          }}
        >
          {greeting},{" "}
          <em
            className="not-italic"
            style={{
              fontStyle: "italic",
              fontWeight: 400,
              color: "hsl(var(--terracotta-500))",
            }}
          >
            {displayName}
          </em>
          .
        </h1>
        {projectName && (
          <div
            className="mt-2.5 flex items-center gap-2.5 flex-wrap"
            style={{
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontSize: 13.5,
              color: "hsl(var(--fg-secondary))",
            }}
          >
            <span className="whitespace-nowrap">
              You're building{" "}
              <strong className="text-[hsl(var(--ink-900))] font-semibold">
                {projectName}
              </strong>
            </span>
            {projectState && (
              <span
                className="whitespace-nowrap"
                style={{
                  padding: "2px 10px",
                  borderRadius: 999,
                  background: "hsl(var(--moss-100))",
                  color: "hsl(var(--moss-700))",
                  fontSize: 11.5,
                  fontWeight: 500,
                }}
              >
                {PROJECT_STATE_LABELS[projectState]}
              </span>
            )}
            <span className="text-[hsl(var(--fg-muted))]">·</span>
            {projectId && (
              <Link
                to={`/projects/${projectId}/summary`}
                className="text-[hsl(var(--fg-secondary))] hover:text-[hsl(var(--ink-900))] whitespace-nowrap"
                style={{
                  textDecoration: "none",
                  borderBottom: "1px solid hsl(var(--fg-subtle))",
                }}
              >
                View project summary
              </Link>
            )}
            {isRelaunch && parentProjectId && parentProjectName && (
              <>
                <span className="text-[hsl(var(--fg-muted))]">·</span>
                <Link
                  to={`/projects/${parentProjectId}`}
                  className="text-xs text-muted-foreground hover:text-[hsl(var(--terracotta-500))] transition-colors"
                >
                  Relaunched from: {parentProjectName}
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2.5 shrink-0">
        {onShareUpdate && (
          <button
            onClick={onShareUpdate}
            className="rounded-full transition-colors hover:bg-[hsl(var(--ink-900)/0.04)]"
            style={{
              background: "transparent",
              border: "1px solid hsl(var(--border-default))",
              padding: "8px 14px",
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontSize: 13,
              color: "hsl(var(--ink-900))",
              whiteSpace: "nowrap",
            }}
          >
            Share update
          </button>
        )}
        {onNewPiece && (
          <button
            onClick={onNewPiece}
            className="rounded-full hover:opacity-90 transition-opacity"
            style={{
              background: "hsl(var(--terracotta-500))",
              color: "hsl(var(--paper-50))",
              border: 0,
              padding: "9px 18px",
              fontFamily: '"Plus Jakarta Sans", system-ui, sans-serif',
              fontSize: 13,
              fontWeight: 500,
              whiteSpace: "nowrap",
            }}
          >
            + New piece
          </button>
        )}
        {projectState && onPause && onResume && onArchive && (
          <ProjectMenu
            projectState={projectState}
            onPause={onPause}
            onResume={onResume}
            onArchive={onArchive}
            onMarkComplete={onMarkComplete}
          />
        )}
      </div>
    </div>
  );
};
