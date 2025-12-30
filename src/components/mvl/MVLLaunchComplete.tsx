import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MVLLaunchCompleteProps {
  className?: string;
}

export const MVLLaunchComplete = ({ className }: MVLLaunchCompleteProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-4",
        className
      )}
    >
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="space-y-4 max-w-md"
      >
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
          You launched.
        </h1>
        
        <div className="space-y-2 text-muted-foreground">
          <p>A minimum viable launch counts.</p>
          <p>You don't need to do anything else right now.</p>
        </div>
      </motion.div>
    </motion.div>
  );
};
