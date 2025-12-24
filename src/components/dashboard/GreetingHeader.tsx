interface GreetingHeaderProps {
  firstName?: string | null;
  projectName?: string;
}

const getTimeOfDayGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

export const GreetingHeader = ({ firstName, projectName }: GreetingHeaderProps) => {
  const greeting = getTimeOfDayGreeting();
  const displayName = firstName || "there";

  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold text-foreground">
        {greeting}, {displayName} 👋
      </h1>
      {projectName && (
        <p className="text-muted-foreground">
          You're working on: <span className="text-foreground font-medium">{projectName}</span>
        </p>
      )}
    </div>
  );
};
