import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface MVLCalloutProps {
  variant: "planning" | "transformation" | "launch-intro" | "launch-complete";
  className?: string;
}

const MVL_COPY = {
  planning: {
    headline: "This is enough to launch.",
    body: "You're not creating a final version — you're creating a starting point.\nClear is better than complete.",
  },
  transformation: {
    headline: null,
    body: "You're not locking this in forever.\nThis version just needs to be clear enough to share.",
  },
  "launch-intro": {
    headline: "This is a minimum viable launch.",
    body: "You're not trying to get it perfect.\nYou're just letting people know this exists.\n\nSharing once is enough.\nShowing up imperfectly is enough.",
    cta: "Continue to launch",
  },
  "launch-complete": {
    headline: "You launched.",
    body: "A minimum viable launch counts.\nYou don't need to do anything else right now.",
  },
};

export const MVLCallout = ({ variant, className }: MVLCalloutProps) => {
  const copy = MVL_COPY[variant];

  // Transformation variant is inline/subtle
  if (variant === "transformation") {
    return (
      <motion.p
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className={cn(
          "text-sm text-muted-foreground whitespace-pre-line",
          className
        )}
      >
        {copy.body}
      </motion.p>
    );
  }

  // Launch intro is full-width centered
  if (variant === "launch-intro") {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "text-center py-8 space-y-6",
          className
        )}
      >
        <h2 className="text-xl font-medium text-foreground">
          {copy.headline}
        </h2>
        <p className="text-muted-foreground whitespace-pre-line leading-relaxed max-w-md mx-auto">
          {copy.body}
        </p>
      </motion.div>
    );
  }

  // Launch complete is confirmation state
  if (variant === "launch-complete") {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className={cn(
          "text-center py-6 space-y-3",
          className
        )}
      >
        <h2 className="text-xl font-medium text-foreground">
          {copy.headline}
        </h2>
        <p className="text-muted-foreground whitespace-pre-line">
          {copy.body}
        </p>
      </motion.div>
    );
  }

  // Planning review is a small callout box
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.4 }}
      className={cn(
        "p-4 rounded-lg bg-muted/50 border border-border/50",
        className
      )}
    >
      <p className="text-sm font-medium text-foreground mb-1">
        {copy.headline}
      </p>
      <p className="text-sm text-muted-foreground whitespace-pre-line">
        {copy.body}
      </p>
    </motion.div>
  );
};
