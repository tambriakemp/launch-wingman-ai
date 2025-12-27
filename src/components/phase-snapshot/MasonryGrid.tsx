import { SummaryCard } from "./SummaryCard";
import type { SummaryBlock } from "@/hooks/usePhaseSnapshot";
import type { Phase } from "@/types/tasks";

interface MasonryGridProps {
  blocks: (SummaryBlock & { phase: Phase })[];
}

export function MasonryGrid({ blocks }: MasonryGridProps) {
  if (blocks.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-muted-foreground italic">
          No content defined for this phase yet.
        </p>
      </div>
    );
  }

  return (
    <div className="columns-1 md:columns-2 gap-5 space-y-5">
      {blocks.map((block) => (
        <div key={block.id} className="break-inside-avoid">
          <SummaryCard
            label={block.label}
            bullets={block.bullets}
            fullContent={block.fullContent}
            taskRoute={block.taskRoute}
            taskId={block.taskId}
            phase={block.phase}
            contentType={block.contentType}
            structuredContent={block.structuredContent}
          />
        </div>
      ))}
    </div>
  );
}
