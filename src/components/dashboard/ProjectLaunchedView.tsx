import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, PartyPopper, ArrowRight, RefreshCw, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface ProjectLaunchedViewProps {
  projectName?: string;
  onContinueToPostLaunch?: () => void;
  onMarkComplete?: () => Promise<boolean>;
}

export function ProjectLaunchedView({
  projectName,
  onContinueToPostLaunch,
  onMarkComplete,
}: ProjectLaunchedViewProps) {
  const navigate = useNavigate();
  const { id } = useParams();

  const handleRelaunch = () => {
    if (id) {
      navigate(`/projects/${id}/relaunch`);
    }
  };

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

      {/* Mark Complete - User-controlled completion */}
      {onMarkComplete && (
        <Card className="border-primary/20">
          <CardContent className="pt-4 pb-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between h-auto py-3 px-3"
                >
                  <div className="flex items-center gap-3 text-left">
                    <CheckCircle2 className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Mark this project complete</span>
                  </div>
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Mark project complete?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This closes the loop on this launch.
                    You can always relaunch later.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onMarkComplete}>
                    Mark Complete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}

      {/* Relaunch option */}
      <Card className="border-border/50">
        <CardContent className="pt-4 pb-4">
          <Button
            variant="ghost"
            onClick={handleRelaunch}
            className="w-full justify-between h-auto py-3 px-3 text-muted-foreground hover:text-foreground"
          >
            <div className="flex items-center gap-3 text-left">
              <RefreshCw className="w-4 h-4" />
              <span className="text-sm">Plan a relaunch</span>
            </div>
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
