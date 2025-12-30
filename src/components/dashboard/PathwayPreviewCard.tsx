import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, 
  Check, 
  MapPin, 
  Lock,
  Compass,
  MessageSquare,
  Hammer,
  Palette,
  Rocket,
  BarChart3
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Phase, PHASES, PHASE_LABELS, PhaseStatus } from "@/types/tasks";
import { cn } from "@/lib/utils";

interface PathwayPreviewCardProps {
  activePhase: Phase;
  phaseStatuses: Record<Phase, PhaseStatus>;
  defaultExpanded?: boolean;
}

// Phase icons mapping
const PHASE_ICONS: Record<Phase, React.ComponentType<{ className?: string }>> = {
  planning: Compass,
  messaging: MessageSquare,
  build: Hammer,
  content: Palette,
  launch: Rocket,
  "post-launch": BarChart3,
};

// Reassurance messages for future phases
const PHASE_REASSURANCE: Record<Phase, string> = {
  planning: "Define your audience and offer foundation",
  messaging: "You won't craft messaging until planning is solid",
  build: "Building comes after your message is clear",
  content: "Content creation starts when your offer is ready",
  launch: "Launch only when everything is in place",
  "post-launch": "Reflection and optimization come last",
};

export function PathwayPreviewCard({
  activePhase,
  phaseStatuses,
  defaultExpanded = false,
}: PathwayPreviewCardProps) {
  const [isOpen, setIsOpen] = useState(defaultExpanded);

  const currentPhaseIndex = PHASES.indexOf(activePhase);
  const currentPhaseLabel = PHASE_LABELS[activePhase];

  const getPhaseState = (phase: Phase): 'complete' | 'current' | 'future' => {
    if (phaseStatuses[phase] === 'complete') return 'complete';
    if (phase === activePhase) return 'current';
    return 'future';
  };

  return (
    <Card className="overflow-hidden bg-muted/30">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <button
            className="w-full p-4 flex items-center justify-between hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-lg"
            aria-expanded={isOpen}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">Your Journey</p>
                <p className="text-xs text-muted-foreground">
                  You are here: <span className="text-foreground font-medium">{currentPhaseLabel}</span>
                </p>
              </div>
            </div>
            <motion.div
              animate={{ rotate: isOpen ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </motion.div>
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-4 px-4">
            <div className="relative ml-4">
              {/* Vertical connecting line */}
              <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />

              <AnimatePresence>
                {PHASES.map((phase, index) => {
                  const state = getPhaseState(phase);
                  const Icon = PHASE_ICONS[phase];
                  const isLast = index === PHASES.length - 1;

                  return (
                    <motion.div
                      key={phase}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.2 }}
                      className={cn(
                        "relative flex items-start gap-3 pb-4",
                        isLast && "pb-0"
                      )}
                    >
                      {/* Phase indicator */}
                      <div
                        className={cn(
                          "relative z-10 flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all",
                          state === 'complete' && "bg-green-500/20 border-green-500 text-green-600",
                          state === 'current' && "bg-primary/20 border-primary text-primary ring-2 ring-primary/20",
                          state === 'future' && "bg-muted border-border text-muted-foreground"
                        )}
                      >
                        {state === 'complete' && <Check className="w-3 h-3" />}
                        {state === 'current' && (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                            className="w-2 h-2 rounded-full bg-primary"
                          />
                        )}
                        {state === 'future' && <Lock className="w-2.5 h-2.5" />}
                      </div>

                      {/* Phase content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center gap-2">
                          <Icon className={cn(
                            "w-3.5 h-3.5",
                            state === 'complete' && "text-green-600",
                            state === 'current' && "text-primary",
                            state === 'future' && "text-muted-foreground"
                          )} />
                          <span className={cn(
                            "text-sm font-medium",
                            state === 'complete' && "text-green-600",
                            state === 'current' && "text-foreground",
                            state === 'future' && "text-muted-foreground"
                          )}>
                            {PHASE_LABELS[phase]}
                          </span>
                          {state === 'current' && (
                            <span className="text-[10px] uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded-full font-medium">
                              Now
                            </span>
                          )}
                        </div>
                        
                        {/* Reassurance message for future phases */}
                        {state === 'future' && (
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {PHASE_REASSURANCE[phase]}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}
