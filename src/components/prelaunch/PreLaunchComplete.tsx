import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useNavigate, useParams } from "react-router-dom";

interface PreLaunchCompleteProps {
  className?: string;
}

export const PreLaunchComplete = ({ className }: PreLaunchCompleteProps) => {
  const navigate = useNavigate();
  const { id: projectId } = useParams();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
      className={cn(
        "flex flex-col items-center justify-center min-h-[60vh] text-center px-4",
        className
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="space-y-8 max-w-lg"
      >
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
          You've given context.
        </h1>
        
        <p className="text-muted-foreground leading-relaxed">
          That's the entire goal of pre-launch.
        </p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
        >
          <Button 
            onClick={() => navigate(`/projects/${projectId}/dashboard`)}
            size="lg"
            className="mt-4"
          >
            Continue to launch
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
