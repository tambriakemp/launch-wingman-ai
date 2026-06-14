import { ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SummaryBlock } from "./SummaryBlock";
import { cn } from "@/lib/utils";
import type { PhaseData } from "@/hooks/usePhaseSnapshot";
import type { Phase } from "@/types/tasks";

interface PhaseAccordionProps {
  phases: PhaseData[];
  expandedPhases: string[];
}

// Phase badge colors
const PHASE_BADGE_COLORS: Record<Phase, string> = {
  planning: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  messaging: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
  build: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  content: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "pre-launch": "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400",
  launch: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  "post-launch": "bg-teal-500/10 text-teal-600 dark:text-teal-400",
};

export function PhaseAccordion({ phases, expandedPhases }: PhaseAccordionProps) {
  return (
    <Accordion type="multiple" defaultValue={expandedPhases} className="space-y-6">
      {phases.map((phase) => (
        <AccordionItem
          key={phase.phase}
          value={phase.phase}
          className="border border-border/40 rounded-2xl bg-card/20 backdrop-blur-sm overflow-hidden shadow-sm"
        >
          <AccordionTrigger className="px-6 py-5 hover:no-underline hover:bg-muted/20 transition-colors [&[data-state=open]>svg]:rotate-180">
            <div className="flex items-center gap-3">
              <span className={cn(
                "px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider",
                PHASE_BADGE_COLORS[phase.phase]
              )}>
                {phase.phaseLabel}
              </span>
              <span className="text-sm text-muted-foreground">
                {phase.blocks.length} {phase.blocks.length === 1 ? "item" : "items"}
              </span>
            </div>
            <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 ml-auto" />
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            {phase.hasContent ? (
              <div className="grid gap-4 pt-2">
                {phase.blocks.map((block) => (
                  <SummaryBlock
                    key={block.id}
                    label={block.label}
                    bullets={block.bullets}
                    fullContent={block.fullContent}
                    taskRoute={block.taskRoute}
                    taskId={block.taskId}
                    phase={phase.phase}
                  />
                ))}
              </div>
            ) : (
              <div className="py-8 text-center">
                <p className="text-sm text-muted-foreground/70 italic">
                  Nothing defined here yet.
                </p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
