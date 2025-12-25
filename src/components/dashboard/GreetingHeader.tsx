import { Link } from "react-router-dom";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ProjectMenu } from "./ProjectMenu";
import { ProjectState, PROJECT_STATE_LABELS } from "@/types/projectLifecycle";

interface GreetingHeaderProps {
  firstName?: string | null;
  projectName?: string;
  projectId?: string;
  projectState?: ProjectState;
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
  onPause,
  onResume,
  onArchive,
  onMarkComplete,
}: GreetingHeaderProps) => {
  const greeting = getTimeOfDayGreeting();
  const displayName = firstName || "there";

  return (
    <div className="space-y-1">
      <div className="flex items-start justify-between gap-2">
        <h1 className="text-2xl font-semibold text-foreground">
          {greeting}, {displayName} 👋
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
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-muted-foreground">
              You're building: <span className="text-foreground font-medium">{projectName}</span>
            </p>
            {projectState && (
              <Badge variant="secondary" className="text-xs font-normal">
                {PROJECT_STATE_LABELS[projectState]}
              </Badge>
            )}
          </div>
          {projectId && (
            <Link
              to={`/projects/${projectId}/summary`}
              className="inline-flex items-center gap-1 text-sm text-primary hover:text-primary/80 transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              View Project Summary
            </Link>
          )}
        </div>
      )}
    </div>
  );
};
