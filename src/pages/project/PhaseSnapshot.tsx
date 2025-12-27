import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { PhaseFilters, PhaseAccordion } from "@/components/phase-snapshot";
import { usePhaseSnapshot } from "@/hooks/usePhaseSnapshot";
import { Phase, PHASES } from "@/types/tasks";
import { Skeleton } from "@/components/ui/skeleton";

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-5 w-96" />
      <div className="flex gap-2 pt-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} className="h-8 w-20 rounded-full" />
        ))}
      </div>
      <div className="space-y-4 pt-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

export default function PhaseSnapshot() {
  const { id } = useParams();
  const [selectedPhase, setSelectedPhase] = useState<"all" | Phase>("all");
  const { data: phases, isLoading, error } = usePhaseSnapshot(id);

  // Filter phases based on selection
  const filteredPhases = useMemo(() => {
    if (!phases) return [];
    if (selectedPhase === "all") return phases;
    return phases.filter(p => p.phase === selectedPhase);
  }, [phases, selectedPhase]);

  // Get all phase keys for default expansion
  const expandedPhases = useMemo(() => {
    return [...PHASES] as string[];
  }, []);

  if (isLoading) {
    return (
      <ProjectLayout>
        <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
          <LoadingSkeleton />
        </div>
      </ProjectLayout>
    );
  }

  if (error || !phases) {
    return (
      <ProjectLayout>
        <div className="max-w-3xl mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Unable to load phase snapshot.</p>
        </div>
      </ProjectLayout>
    );
  }

  return (
    <ProjectLayout>
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Back Link */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <Link
            to={`/projects/${id}/tasks`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tasks
          </Link>
        </motion.div>

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mb-3">
            Phase Snapshot
          </h1>
          <p className="text-muted-foreground leading-relaxed max-w-xl">
            A summary of everything you've defined so far, organized by phase.
          </p>
        </motion.header>

        {/* Phase Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <PhaseFilters
            selectedPhase={selectedPhase}
            onPhaseChange={setSelectedPhase}
          />
        </motion.div>

        {/* Phase Accordion Sections */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <PhaseAccordion
            phases={filteredPhases}
            expandedPhases={expandedPhases}
          />
        </motion.div>

        {/* Reflective Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-12 pt-8 border-t border-border/30 text-center"
        >
          <p className="text-sm text-muted-foreground/70 italic">
            This is what you've built so far. Take a breath — you're further along than you think.
          </p>
        </motion.footer>
      </div>
    </ProjectLayout>
  );
}
