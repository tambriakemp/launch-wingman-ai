import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { PhaseFilters } from "@/components/phase-snapshot/PhaseFilters";
import { MasonryGrid } from "@/components/phase-snapshot/MasonryGrid";
import { ExportSnapshotButton } from "@/components/phase-snapshot/ExportSnapshotButton";
import { usePhaseSnapshot } from "@/hooks/usePhaseSnapshot";
import { Phase, PHASES, PHASE_LABELS } from "@/types/tasks";
import { Skeleton } from "@/components/ui/skeleton";

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-5 w-96" />
      <div className="flex gap-2 pt-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-full" />
        ))}
      </div>
      <div className="columns-1 md:columns-2 gap-5 space-y-5 pt-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-40 w-full rounded-xl break-inside-avoid" />
        ))}
      </div>
    </div>
  );
}

export default function PhaseSnapshot() {
  const { id } = useParams();
  const [selectedPhase, setSelectedPhase] = useState<Phase | "all">("all");
  const { data: phases, isLoading, error } = usePhaseSnapshot(id);

  // Get all blocks for selected phase with phase info attached
  const filteredBlocks = useMemo(() => {
    if (!phases) return [];
    if (selectedPhase === "all") {
      return phases.flatMap(p =>
        p.blocks.map(block => ({ ...block, phase: p.phase }))
      );
    }
    const phaseData = phases.find(p => p.phase === selectedPhase);
    if (!phaseData) return [];
    return phaseData.blocks.map(block => ({
      ...block,
      phase: selectedPhase
    }));
  }, [phases, selectedPhase]);

  if (isLoading) {
    return (
      <ProjectLayout>
        <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
          <LoadingSkeleton />
        </div>
      </ProjectLayout>
    );
  }

  if (error || !phases) {
    return (
      <ProjectLayout>
        <div className="max-w-5xl mx-auto px-4 py-12 text-center">
          <p className="text-muted-foreground">Unable to load launch brief.</p>
        </div>
      </ProjectLayout>
    );
  }

  return (
    <ProjectLayout>
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">
        {/* Back Link */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-8"
        >
          <Link
            to={`/projects/${id}/dashboard`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </motion.div>

        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight mb-3">
                Launch Brief
              </h1>
              <p className="text-muted-foreground leading-relaxed max-w-xl">
                Everything you've built, organized by phase. Your complete launch picture.
              </p>
            </div>
            <ExportSnapshotButton phases={phases} />
          </div>
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

        {/* Masonry Grid of Cards */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {selectedPhase === "all" ? (
            <div className="space-y-10">
              {phases.filter(p => p.hasContent).map(phaseData => (
                <div key={phaseData.phase}>
                  <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                    {phaseData.phaseLabel}
                  </h2>
                  <MasonryGrid blocks={phaseData.blocks.map(b => ({ ...b, phase: phaseData.phase }))} />
                </div>
              ))}
            </div>
          ) : (
            <MasonryGrid blocks={filteredBlocks} />
          )}
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
