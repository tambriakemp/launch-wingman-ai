import { ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SummaryBlock } from "./SummaryBlock";
import type { PhaseData } from "@/hooks/usePhaseSnapshot";

interface PhaseAccordionProps {
  phases: PhaseData[];
  expandedPhases: string[];
}

export function PhaseAccordion({ phases, expandedPhases }: PhaseAccordionProps) {
  return (
    <Accordion type="multiple" defaultValue={expandedPhases} className="space-y-4">
      {phases.map((phase) => (
        <AccordionItem
          key={phase.phase}
          value={phase.phase}
          className="border border-border/40 rounded-xl bg-card/30 backdrop-blur-sm overflow-hidden"
        >
          <AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-muted/20 transition-colors [&[data-state=open]>svg]:rotate-180">
            <span className="text-base font-medium text-foreground">
              {phase.phaseLabel}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ml-auto" />
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-4">
            {phase.hasContent ? (
              <div className="divide-y divide-border/30">
                {phase.blocks.map((block) => (
                  <SummaryBlock
                    key={block.id}
                    label={block.label}
                    bullets={block.bullets}
                    fullContent={block.fullContent}
                    taskRoute={block.taskRoute}
                  />
                ))}
              </div>
            ) : (
              <p className="py-4 text-sm text-muted-foreground/70 italic">
                Nothing defined here yet.
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
