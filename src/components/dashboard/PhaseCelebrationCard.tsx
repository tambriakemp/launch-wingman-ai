import { Link, useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PartyPopper, Sparkles, Rocket, Megaphone, Hammer, PenTool, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Phase, PHASE_LABELS } from "@/types/tasks";
import { APP_LEVEL_LEARN_MORE } from "@/data/taskLearnMoreLinks";

interface PhaseCelebrationCardProps {
  completedPhase: Phase;
  nextPhase?: Phase;
  onDismiss?: () => void;
}

const PHASE_CELEBRATIONS: Record<Phase, {
  icon: React.ElementType;
  title: string;
  message: string;
  color: string;
}> = {
  planning: {
    icon: Sparkles,
    title: "Planning Complete!",
    message: "You've laid the foundation for your launch. Your audience, offer, and funnel are defined. Time to craft your message!",
    color: "text-violet-500",
  },
  messaging: {
    icon: Megaphone,
    title: "Messaging Complete!",
    message: "Your message is crystal clear. You know exactly what to say to connect with your audience. Now let's build!",
    color: "text-blue-500",
  },
  build: {
    icon: Hammer,
    title: "Build Phase Complete!",
    message: "Your offer is live and ready for the world. The hard part is done — now it's time to create content!",
    color: "text-amber-500",
  },
  content: {
    icon: PenTool,
    title: "Content Ready!",
    message: "Your content is planned and ready to go. You're prepared to connect with your audience. Time for pre-launch!",
    color: "text-emerald-500",
  },
  "pre-launch": {
    icon: Sparkles,
    title: "Signal Sent!",
    message: "You've given context. That's the entire goal of pre-launch. Now you're ready to launch!",
    color: "text-cyan-500",
  },
  launch: {
    icon: Rocket,
    title: "Launched!",
    message: "Congratulations! Your launch is live. Now focus on engagement and optimization.",
    color: "text-rose-500",
  },
  "post-launch": {
    icon: PartyPopper,
    title: "All Phases Complete!",
    message: "You've done it! Your entire launch journey is complete. Take a moment to celebrate.",
    color: "text-primary",
  },
};

export const PhaseCelebrationCard = ({
  completedPhase,
  nextPhase,
  onDismiss,
}: PhaseCelebrationCardProps) => {
  const { id: projectId } = useParams();
  const celebration = PHASE_CELEBRATIONS[completedPhase];
  const Icon = celebration.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: -10 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden relative">
        {onDismiss && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        <CardContent className="p-6 pr-12">
          <div className="flex items-start gap-4">
            <motion.div
              initial={{ rotate: -10 }}
              animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className={`p-3 rounded-full bg-primary/10 ${celebration.color}`}
            >
              <Icon className="h-6 w-6" />
            </motion.div>
            
            <div className="space-y-2 flex-1">
              <motion.h3
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="font-semibold text-lg text-foreground"
              >
                {celebration.title}
              </motion.h3>
              
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-sm text-muted-foreground"
              >
                {celebration.message}
              </motion.p>
              
              {nextPhase && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-between pt-1"
                >
                  <p className="text-sm font-medium text-primary">
                    → Next up: {PHASE_LABELS[nextPhase] || nextPhase.charAt(0).toUpperCase() + nextPhase.slice(1)}
                  </p>
                  {projectId && (
                    <Link
                      to={`/projects/${projectId}/library?article=${APP_LEVEL_LEARN_MORE.phaseIntro}`}
                      className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                    >
                      How phases work
                    </Link>
                  )}
                </motion.div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
