import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Rocket, ArrowRight, RefreshCw, FolderPlus } from "lucide-react";
import { motion } from "framer-motion";
import { useChildProjects } from "@/hooks/useChildProjects";
import { ChildProjectsCard } from "./ChildProjectsCard";

interface ProjectCompletedViewProps {
  projectName?: string;
  onRelaunch?: () => void;
  onNewProject?: () => void;
  onPause?: () => void;
}

export function ProjectCompletedView({
  projectName,
  onRelaunch,
  onNewProject,
  onPause,
}: ProjectCompletedViewProps) {
  const navigate = useNavigate();
  const { id } = useParams();

  // Fetch child projects (relaunches from this project)
  const { data: childProjects = [] } = useChildProjects(id);

  const handleRelaunch = () => {
    if (onRelaunch) {
      onRelaunch();
    } else if (id) {
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
      <Card className="bg-gradient-to-br from-primary/10 via-background to-accent/10 border-primary/20">
        <CardContent className="pt-8 pb-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center"
          >
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </motion.div>
          
          <h1 className="text-2xl font-bold mb-2">
            Your launch journey is complete
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            You did it. {projectName ? `"${projectName}"` : "Your project"} has reached its destination.
            Take a moment to celebrate this accomplishment.
          </p>
        </CardContent>
      </Card>

      {/* What's Next Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">What would you like to do next?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button
            variant="outline"
            className="w-full justify-between h-auto py-4 px-4"
            onClick={handleRelaunch}
          >
            <div className="flex items-center gap-3 text-left min-w-0">
              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                <RefreshCw className="w-4 h-4 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-medium break-words">Relaunch this project</p>
                <p className="text-sm text-muted-foreground break-words">
                  Reuse what still fits, revisit what needs attention
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </Button>

          <Button
            variant="outline"
            className="w-full justify-between h-auto py-4 px-4"
            onClick={onNewProject}
          >
            <div className="flex items-center gap-3 text-left min-w-0">
              <div className="p-2 rounded-lg bg-accent/10 shrink-0">
                <FolderPlus className="w-4 h-4 text-accent-foreground" />
              </div>
              <div className="min-w-0">
                <p className="font-medium break-words">Start a new project</p>
                <p className="text-sm text-muted-foreground break-words">
                  Create a fresh launch with a new offer
                </p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </Button>

          <Button
            variant="ghost"
            className="w-full justify-center text-muted-foreground"
            onClick={onPause}
          >
            Take a break and come back later
          </Button>
        </CardContent>
      </Card>

      {/* Child Projects (Relaunches from this project) */}
      {childProjects.length > 0 && (
        <ChildProjectsCard childProjects={childProjects} />
      )}

      {/* Encouragement */}
      <p className="text-center text-sm text-muted-foreground">
        Completing a launch is a significant achievement. 
        Whatever you choose next, you've proven you can do this.
      </p>
    </motion.div>
  );
}
