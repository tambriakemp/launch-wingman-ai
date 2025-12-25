import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Archive, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RelaunchNudgeBannerProps {
  projectId: string;
  projectUpdatedAt: string;
  projectStatus: string;
  relaunchNudgeDismissed: boolean;
  onDismiss: () => void;
  onArchive: () => void;
}

/**
 * A single, optional reminder shown 30-60 days after a project is completed.
 * Shows once only. Dismiss is permanent.
 */
export function RelaunchNudgeBanner({
  projectId,
  projectUpdatedAt,
  projectStatus,
  relaunchNudgeDismissed,
  onDismiss,
  onArchive,
}: RelaunchNudgeBannerProps) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(true);
  const [isDismissing, setIsDismissing] = useState(false);

  // Calculate days since project was last updated (proxy for completion date)
  const daysSinceUpdate = Math.floor(
    (Date.now() - new Date(projectUpdatedAt).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Only show if:
  // - Project is completed
  // - 30+ days have passed
  // - Not already dismissed
  const shouldShow =
    projectStatus === "completed" &&
    daysSinceUpdate >= 30 &&
    !relaunchNudgeDismissed &&
    isVisible;

  if (!shouldShow) {
    return null;
  }

  const handleDismiss = async () => {
    setIsDismissing(true);
    try {
      const { error } = await supabase
        .from("projects")
        .update({ relaunch_nudge_dismissed: true })
        .eq("id", projectId);

      if (error) throw error;

      setIsVisible(false);
      onDismiss();
    } catch (err) {
      console.error("Failed to dismiss nudge:", err);
      toast.error("Failed to dismiss");
    } finally {
      setIsDismissing(false);
    }
  };

  const handleRelaunch = () => {
    navigate(`/projects/${projectId}/relaunch`);
  };

  const handleArchive = async () => {
    setIsDismissing(true);
    try {
      // First dismiss the nudge
      await supabase
        .from("projects")
        .update({ relaunch_nudge_dismissed: true })
        .eq("id", projectId);

      setIsVisible(false);
      onArchive();
    } catch (err) {
      console.error("Failed to archive:", err);
      toast.error("Failed to archive project");
    } finally {
      setIsDismissing(false);
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="rounded-lg border border-border/60 bg-muted/30 p-4"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-sm text-foreground">
              Want to revisit or build on this?
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={handleRelaunch}
                className="gap-2"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Relaunch
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleArchive}
                disabled={isDismissing}
                className="gap-2"
              >
                <Archive className="w-3.5 h-3.5" />
                Archive
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleDismiss}
                disabled={isDismissing}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
                Dismiss
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
