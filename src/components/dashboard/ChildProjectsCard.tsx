import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, ArrowRight } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ChildProject } from "@/hooks/useChildProjects";

interface ChildProjectsCardProps {
  childProjects: ChildProject[];
}

export function ChildProjectsCard({ childProjects }: ChildProjectsCardProps) {
  if (childProjects.length === 0) return null;

  return (
    <Card className="border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-medium flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-muted-foreground" />
          Relaunched as
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {childProjects.map((project) => (
          <Link
            key={project.id}
            to={`/projects/${project.id}`}
            className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-accent/50 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div>
                <p className="text-sm font-medium group-hover:text-primary transition-colors">
                  {project.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Created {formatDistanceToNow(new Date(project.createdAt), { addSuffix: true })}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={project.status === "completed" ? "default" : "secondary"}
                className="text-xs"
              >
                {project.status === "in_progress" ? "In progress" : project.status}
              </Badge>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
