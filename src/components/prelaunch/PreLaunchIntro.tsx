import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PreLaunchIntroProps {
  onContinue: () => void;
  className?: string;
}

export const PreLaunchIntro = ({ onContinue, className }: PreLaunchIntroProps) => {
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
          One small signal is enough
        </h1>
        
        <div className="space-y-4 text-muted-foreground leading-relaxed">
          <p>Pre-launch doesn't mean building hype or running a campaign.</p>
          <p>
            It simply means letting people know something is coming — in a small, human way.
          </p>
          <p className="pt-2">
            You're not promoting yet.<br />
            You're just giving context so your launch doesn't feel sudden later.
          </p>
        </div>

        <p className="text-sm text-muted-foreground/80 italic">
          One post, one message, or one moment is enough.
        </p>

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
            Continue
          </Button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
