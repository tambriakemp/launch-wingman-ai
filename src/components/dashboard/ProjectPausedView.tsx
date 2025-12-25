import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pause, Play } from "lucide-react";
import { motion } from "framer-motion";

interface ProjectPausedViewProps {
  projectName?: string;
  onResume?: () => void;
}

export function ProjectPausedView({
  projectName,
  onResume,
}: ProjectPausedViewProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-6 py-8 px-4"
    >
      <Card className="bg-card border-muted">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <Pause className="w-8 h-8 text-muted-foreground" />
          </div>
          
          <h1 className="text-2xl font-bold mb-2">
            Project Paused
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            {projectName ? `"${projectName}"` : "This project"} is taking a well-deserved rest.
            When you're ready, pick up right where you left off.
          </p>

          <Button onClick={onResume} className="gap-2">
            <Play className="w-4 h-4" />
            Resume Project
          </Button>
        </CardContent>
      </Card>

      <p className="text-center text-sm text-muted-foreground">
        Taking breaks is part of the process. Your progress is saved and waiting for you.
      </p>
    </motion.div>
  );
}
