import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ProjectLineageNode } from "@/hooks/useProjectLineage";
import { formatDistanceToNow } from "date-fns";

interface ProjectLineageViewProps {
  root: ProjectLineageNode;
  currentProjectId: string;
}

function LineageNode({ node, depth = 0 }: { node: ProjectLineageNode; depth?: number }) {
  return (
    <div className="relative">
      {/* Connector line */}
      {depth > 0 && (
        <div className="absolute left-0 top-0 w-4 h-4 border-l-2 border-b-2 border-border rounded-bl-lg -translate-y-2" />
      )}
      
      <Link
        to={`/projects/${node.id}`}
        className={cn(
          "block p-3 rounded-lg border transition-colors",
          depth > 0 && "ml-6",
          node.isCurrent 
            ? "border-primary bg-primary/5" 
            : "border-border/50 hover:bg-accent/50"
        )}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className={cn(
                "text-sm font-medium truncate",
                node.isCurrent && "text-primary"
              )}>
                {node.name}
              </p>
              {node.isCurrent && (
                <Badge variant="outline" className="text-xs shrink-0">
                  Current
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(node.createdAt), { addSuffix: true })}
            </p>
          </div>
          <Badge 
            variant={node.status === "completed" ? "default" : "secondary"}
            className="text-xs shrink-0"
          >
            {node.status === "in_progress" ? "Active" : node.status}
          </Badge>
        </div>
      </Link>

      {/* Children */}
      {node.children.length > 0 && (
        <div className="mt-2 space-y-2 relative">
          {/* Vertical connector line for multiple children */}
          {node.children.length > 1 && (
            <div 
              className="absolute left-3 top-0 w-0.5 bg-border"
              style={{ height: `calc(100% - 1rem)` }}
            />
          )}
          {node.children.map((child) => (
            <LineageNode key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ProjectLineageView({ root }: ProjectLineageViewProps) {
  return (
    <div className="space-y-2">
      <LineageNode node={root} />
    </div>
  );
}
