import { CheckCircle2, FileText, Rocket, ListTodo } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { differenceInDays, parseISO } from "date-fns";

interface ProjectQuickStatsProps {
  taskStats: { completed: number; total: number };
  contentStats: { ready: number; total: number };
  launchDate: string | null;
}

export const ProjectQuickStats = ({
  taskStats,
  contentStats,
  launchDate,
}: ProjectQuickStatsProps) => {
  const daysUntilLaunch = launchDate
    ? differenceInDays(parseISO(launchDate), new Date())
    : null;

  const stats = [
    {
      label: "Tasks",
      value: `${taskStats.completed}/${taskStats.total}`,
      sublabel: "complete",
      icon: ListTodo,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: "Content",
      value: `${contentStats.ready}/${contentStats.total}`,
      sublabel: "ready",
      icon: FileText,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
    },
    ...(daysUntilLaunch !== null
      ? [
          {
            label: "Launch",
            value: daysUntilLaunch > 0 ? `${daysUntilLaunch}` : "Today!",
            sublabel: daysUntilLaunch > 0 ? "days" : "",
            icon: Rocket,
            color: daysUntilLaunch <= 7 ? "text-warning" : "text-info",
            bgColor: daysUntilLaunch <= 7 ? "bg-warning/10" : "bg-info/10",
          },
        ]
      : []),
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="bg-card/50 border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
              <stat.icon className={`w-5 h-5 ${stat.color}`} />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-xl font-semibold text-foreground">{stat.value}</span>
                {stat.sublabel && (
                  <span className="text-xs text-muted-foreground">{stat.sublabel}</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
