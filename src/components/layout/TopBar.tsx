import { Link, useLocation } from "react-router-dom";
import { ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const TopBar = () => {
  const location = useLocation();
  const isAssessmentsActive = location.pathname.startsWith("/assessments");

  return (
    <header className="h-14 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center px-6 sticky top-0 z-40">
      <nav className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className={cn(
            "gap-2",
            isAssessmentsActive && "bg-accent text-accent-foreground"
          )}
        >
          <Link to="/assessments">
            <ClipboardCheck className="w-4 h-4" />
            Assessments
          </Link>
        </Button>
      </nav>
    </header>
  );
};
