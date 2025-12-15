import { motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface FunnelDiagramProps {
  steps: string[];
  color: string;
  bgColor: string;
  className?: string;
}

export const FunnelDiagram = ({ steps, color, bgColor, className }: FunnelDiagramProps) => {
  if (!steps || steps.length === 0) return null;

  return (
    <div className={cn("flex flex-col items-center gap-2", className)}>
      {steps.map((step, index) => {
        // Calculate width percentage (starts wide, gets narrower)
        const widthPercent = 100 - (index * (50 / steps.length));
        
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="flex flex-col items-center w-full"
          >
            <div
              className={cn(
                "py-3 px-4 rounded-lg text-center font-medium text-sm transition-all",
                bgColor,
                color
              )}
              style={{ width: `${widthPercent}%` }}
            >
              {step}
            </div>
            {index < steps.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.1 + 0.05 }}
                className="my-1"
              >
                <ArrowDown className={cn("w-4 h-4", color)} />
              </motion.div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};
