import { Card, CardContent } from "@/components/ui/card";
import { PartyPopper, Sparkles, Rocket, Megaphone, Hammer, PenTool } from "lucide-react";
import { motion } from "framer-motion";
import { Phase } from "@/types/tasks";

interface PhaseCelebrationCardProps {
  completedPhase: Phase;
  nextPhase?: Phase;
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
    message: "Your content is planned and ready to go. You're prepared to connect with your audience. Launch time!",
    color: "text-emerald-500",
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
}: PhaseCelebrationCardProps) => {
  const celebration = PHASE_CELEBRATIONS[completedPhase];
  const Icon = celebration.icon;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent overflow-hidden">
        <CardContent className="p-6">
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
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm font-medium text-primary pt-1"
                >
                  → Next up: {nextPhase.charAt(0).toUpperCase() + nextPhase.slice(1)} Phase
                </motion.p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
