import { useState } from "react";
import { ChevronRight } from "lucide-react";
import { ViewMoreDialog } from "./ViewMoreDialog";

interface SummaryBlockProps {
  label: string;
  bullets: string[];
  fullContent: string;
  taskRoute: string;
}

export function SummaryBlock({ label, bullets, fullContent, taskRoute }: SummaryBlockProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  const showViewMore = fullContent.length > 150 || bullets.length > 2;

  return (
    <>
      <div className="py-4">
        <h4 className="text-sm font-medium text-foreground mb-2">{label}</h4>
        <ul className="space-y-1.5">
          {bullets.slice(0, 3).map((bullet, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="text-primary/60 mt-0.5">•</span>
              <span className="leading-relaxed">{bullet}</span>
            </li>
          ))}
        </ul>
        {showViewMore && (
          <button
            onClick={() => setDialogOpen(true)}
            className="mt-2 text-sm text-primary/80 hover:text-primary flex items-center gap-1 transition-colors"
          >
            View more
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      <ViewMoreDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={label}
        content={fullContent}
        taskRoute={taskRoute}
      />
    </>
  );
}
