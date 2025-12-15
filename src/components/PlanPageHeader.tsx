import { Link, useParams } from "react-router-dom";
import { ChevronRight, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface PlanPageHeaderProps {
  title: string;
  description: string;
  icon?: LucideIcon;
  breadcrumbs?: BreadcrumbItem[];
}

export const PlanPageHeader = ({ 
  title, 
  description, 
  icon: Icon,
  breadcrumbs = []
}: PlanPageHeaderProps) => {
  const { id: projectId } = useParams();

  const defaultBreadcrumbs: BreadcrumbItem[] = [
    { label: "Funnel", href: `/projects/${projectId}/offer` },
    ...breadcrumbs,
    { label: title }
  ];

  return (
    <div className="space-y-1">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-1.5 text-sm">
        {defaultBreadcrumbs.map((crumb, index) => {
          const isLast = index === defaultBreadcrumbs.length - 1;
          return (
            <span key={index} className="flex items-center gap-1.5">
              {crumb.href && !isLast ? (
                <Link 
                  to={crumb.href}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {crumb.label}
                </Link>
              ) : (
                <span className={cn(
                  isLast ? "text-foreground font-medium" : "text-muted-foreground"
                )}>
                  {crumb.label}
                </span>
              )}
              {!isLast && (
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60" />
              )}
            </span>
          );
        })}
      </nav>

      {/* Title and Description */}
      <div className="flex items-center gap-3 pt-1">
        {Icon && (
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          <p className="text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>
  );
};
