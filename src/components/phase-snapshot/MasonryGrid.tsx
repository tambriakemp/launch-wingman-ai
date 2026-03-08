import { AccordionBlock } from "./SummaryCard";
import type { SummaryBlock } from "@/hooks/usePhaseSnapshot";
import type { Phase } from "@/types/tasks";

interface AccordionListProps {
  blocks: (SummaryBlock & { phase: Phase })[];
  indexOffset?: number;
}

export function MasonryGrid({ blocks, indexOffset = 0 }: AccordionListProps) {
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
    <div className="border border-border/40 rounded-xl overflow-hidden bg-card">
      {blocks.map((block, i) => (
        <AccordionBlock
          key={block.id}
          label={block.label}
          index={indexOffset + i + 1}
          bullets={block.bullets}
          fullContent={block.fullContent}
          taskRoute={block.taskRoute}
          taskId={block.taskId}
          phase={block.phase}
          contentType={block.contentType}
          structuredContent={block.structuredContent}
          defaultOpen={i === 0}
        />
      ))}
    </div>
  );
}
