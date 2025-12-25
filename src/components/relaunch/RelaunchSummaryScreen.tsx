import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Rocket, Check, RefreshCw, Loader2 } from "lucide-react";
import { RelaunchSection } from "./RelaunchSelectionScreen";

interface RelaunchSummaryScreenProps {
  projectName: string;
  keptSections: RelaunchSection[];
  revisitSections: RelaunchSection[];
  isCreating: boolean;
  onConfirm: () => void;
  onBack: () => void;
}

const SECTION_LABELS: Record<RelaunchSection, string> = {
  target_audience: "Target audience",
  core_problem: "Core problem",
  dream_outcome: "Dream outcome",
  offer_format: "Offer format",
  messaging: "Messaging",
  funnel_path: "Funnel path",
  content_direction: "Content direction",
  launch_window: "Launch window",
};

export function RelaunchSummaryScreen({
  projectName,
  keptSections,
  revisitSections,
  isCreating,
  onConfirm,
  onBack,
}: RelaunchSummaryScreenProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-xl mx-auto py-12 px-4 space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold text-foreground">
          Relaunch Summary
        </h1>
        <p className="text-muted-foreground">
          Here's how your relaunch will be set up
        </p>
      </div>

      {/* Project name preview */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Rocket className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">New project name</p>
              <p className="font-medium text-foreground">
                {projectName} — Relaunch
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What's staying the same */}
      {keptSections.length > 0 && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              What's staying the same
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {keptSections.map((section) => (
                <li
                  key={section}
                  className="text-sm text-foreground flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                  {SECTION_LABELS[section]}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* What you'll revisit */}
      {revisitSections.length > 0 && (
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-medium flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
              What you'll revisit
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {revisitSections.map((section) => (
                <li
                  key={section}
                  className="text-sm text-foreground flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60" />
                  {SECTION_LABELS[section]}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Helper copy */}
      <p className="text-center text-sm text-muted-foreground">
        You can adjust any of this later.
      </p>

      {/* CTAs */}
      <div className="flex items-center justify-between pt-4">
        <Button variant="ghost" onClick={onBack} disabled={isCreating} className="gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        <Button onClick={onConfirm} disabled={isCreating} className="gap-2">
          {isCreating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating...
            </>
          ) : (
            <>
              Create relaunch project
              <Rocket className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </motion.div>
  );
}
