import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, PartyPopper, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface ProjectLaunchedViewProps {
  projectName?: string;
  onContinueToPostLaunch?: () => void;
}

export function ProjectLaunchedView({
  projectName,
  onContinueToPostLaunch,
}: ProjectLaunchedViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6 py-8 px-4"
    >
      {/* Celebration Header */}
      <Card className="bg-gradient-to-br from-primary/20 via-background to-accent/10 border-primary/30">
        <CardContent className="pt-8 pb-8 text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center"
          >
            <PartyPopper className="w-10 h-10 text-primary" />
          </motion.div>
          
          <h1 className="text-2xl font-bold mb-2">
            Congratulations! 🎉
          </h1>
          <h2 className="text-xl font-semibold text-primary mb-4">
            Your launch is complete!
          </h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            You did it. {projectName ? `"${projectName}"` : "Your offer"} is out in the world.
            Take a breath — this is a big accomplishment.
          </p>
        </CardContent>
      </Card>

      {/* What's Next */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Rocket className="w-5 h-5 text-primary" />
            What happens next?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground">
            The pressure of launch is over. Now it's time to reflect on the experience
            and decide your next move — without rushing or judging yourself.
          </p>

          <Button
            onClick={onContinueToPostLaunch}
            className="w-full gap-2"
          >
            Continue to Reflection
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Most people never finish a full launch. You just did something remarkable.
      </p>
    </motion.div>
  );
}
