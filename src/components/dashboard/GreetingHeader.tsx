import { Link } from "react-router-dom";
import { FileText, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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
}: GreetingHeaderProps) => {
  const greeting = getTimeOfDayGreeting();
  const displayName = firstName || "there";

  return (
    <div className="space-y-2">
      <div className="flex items-start justify-between gap-2">
        <h1
          className="text-3xl md:text-4xl font-medium text-foreground leading-tight"
          style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
        >
          {greeting},{" "}
          <span className="italic text-[hsl(var(--terracotta))]">
            {displayName}
          </span>
          .
        </h1>
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
      {projectName && (
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-muted-foreground">
              You're building:{" "}
              <span className="text-foreground font-medium">{projectName}</span>
            </p>
            {projectState && (
              <Badge
                variant="outline"
                className="text-xs font-normal bg-[hsl(var(--paper-100))] border-[hsl(var(--hairline))] text-foreground"
              >
                {PROJECT_STATE_LABELS[projectState]}
              </Badge>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            {projectId && (
              <Link
                to={`/projects/${projectId}/summary`}
                className="inline-flex items-center gap-1 text-sm text-[hsl(var(--terracotta))] hover:opacity-80 transition-opacity border-b border-[hsl(var(--hairline))]"
              >
                <FileText className="w-3.5 h-3.5" />
                View Project Summary
              </Link>
            )}
            {isRelaunch && parentProjectId && parentProjectName && (
              <Link
                to={`/projects/${parentProjectId}`}
                className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-[hsl(var(--terracotta))] transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Relaunched from: {parentProjectName}
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
