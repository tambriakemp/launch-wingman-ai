import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface LaunchIntroProps {
  onContinue: () => void;
  className?: string;
}

export const LaunchIntro = ({ onContinue, className }: LaunchIntroProps) => {
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
          You're allowed to launch now
        </h1>
        
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>You don't need more content.</p>
          <p>You don't need more clarity.</p>
          <p className="pt-2">
            If one person understands what you're offering, you're ready to share.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.4 }}
        >
          <Button 
            onClick={onContinue}
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
