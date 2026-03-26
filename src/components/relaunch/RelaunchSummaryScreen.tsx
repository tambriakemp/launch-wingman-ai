import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Rocket, Check, RefreshCw, Loader2, Sparkles } from "lucide-react";
import { RelaunchSection } from "./RelaunchSelectionScreen";

interface RelaunchSummaryScreenProps {
  projectName: string;
  keptSections: RelaunchSection[];
  revisitSections: RelaunchSection[];
  isCreating: boolean;
  onConfirm: () => void;
  onBack: () => void;
  skipMemory?: boolean;
  previousLaunchLearnings?: {
    whatWorked: string[];
    feltChallenging: string | null;
    whatToChange: string | null;
    revenue: string | null;
    buyers: string | null;
  } | null;
}

const SECTION_LABELS: Record<RelaunchSection, string> = {
  target_audience: "Target audience",
  core_problem: "Core problem",
  dream_outcome: "Dream outcome",
  offer_format: "Offer format",
  branding: "Brand assets",
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
  skipMemory = false,
  previousLaunchLearnings,
}: RelaunchSummaryScreenProps) {
  // Fresh start mode - skip all memory
  if (skipMemory) {
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
            Fresh Start
          </h1>
          <p className="text-muted-foreground">
            Starting clean without past project data
          </p>
        </div>

        {/* Project name preview */}
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">New project name</p>
                <p className="font-medium text-foreground">
                  {projectName} — Fresh Start
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardContent className="pt-6 text-center">
            <p className="text-sm text-muted-foreground">
              You'll start with a blank slate and define everything fresh.
            </p>
          </CardContent>
        </Card>

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
                Start fresh
                <Sparkles className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </motion.div>
    );
  }

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

      {/* Post-launch learnings */}
      {previousLaunchLearnings && (
        previousLaunchLearnings.whatWorked.length > 0 ||
        previousLaunchLearnings.feltChallenging ||
        previousLaunchLearnings.whatToChange ||
        previousLaunchLearnings.revenue ||
        previousLaunchLearnings.buyers
      ) && (
        <Card className="border-amber-200/50 bg-amber-50/30 dark:border-amber-900/30 dark:bg-amber-950/10">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
              From your last launch
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {previousLaunchLearnings.whatWorked.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">What worked</p>
                <ul className="space-y-1">
                  {previousLaunchLearnings.whatWorked.map((item, i) => (
                    <li key={i} className="text-xs text-foreground/80 flex items-start gap-1.5">
                      <span className="text-primary mt-0.5">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {previousLaunchLearnings.whatToChange && (
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1">What to change next time</p>
                <p className="text-xs text-foreground/80">{previousLaunchLearnings.whatToChange}</p>
              </div>
            )}
            {(previousLaunchLearnings.revenue || previousLaunchLearnings.buyers) && (
              <div className="flex gap-4">
                {previousLaunchLearnings.buyers && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Buyers</p>
                    <p className="text-sm font-semibold text-foreground">{previousLaunchLearnings.buyers}</p>
                  </div>
                )}
                {previousLaunchLearnings.revenue && (
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Revenue</p>
                    <p className="text-sm font-semibold text-foreground">${previousLaunchLearnings.revenue}</p>
                  </div>
                )}
              </div>
            )}
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
