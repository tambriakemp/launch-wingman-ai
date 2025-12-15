interface PlanPageHeaderProps {
  title: string;
  description: string;
}

export const PlanPageHeader = ({ title, description }: PlanPageHeaderProps) => {
  return (
    <div className="space-y-1">
      <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
};
