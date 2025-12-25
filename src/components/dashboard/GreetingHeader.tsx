import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

interface GreetingHeaderProps {
  firstName?: string | null;
  projectName?: string;
  projectId?: string;
}

const getTimeOfDayGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export const GreetingHeader = ({ firstName, projectName, projectId }: GreetingHeaderProps) => {
  const greeting = getTimeOfDayGreeting();
  const displayName = firstName || "there";

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold text-foreground">
        {greeting}, {displayName} 👋
      </h1>
      {projectName && (
        <div className="space-y-1">
          <p className="text-muted-foreground">
            You're building: <span className="text-foreground font-medium">{projectName}</span>
          </p>
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
