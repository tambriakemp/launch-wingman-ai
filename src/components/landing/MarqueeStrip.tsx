import { motion } from "framer-motion";

const keywords = [
  "AI Content",
  "Launch Planning",
  "Sales Copy",
  "Funnel Builder",
  "Social Scheduler",
  "Email Sequences",
  "Brand Assets",
  "Transformation Statements",
  "Audience Insights",
  "Tasks",
  "Launch Calendar",
];

export const MarqueeStrip = () => {
  return (
    <div className="bg-accent py-4 overflow-hidden">
      <motion.div
        className="flex gap-8 whitespace-nowrap"
        animate={{ x: [0, -1920] }}
        transition={{
          duration: 30,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {[...keywords, ...keywords, ...keywords].map((keyword, index) => (
          <span
            key={index}
            className="text-accent-foreground font-semibold text-lg flex items-center gap-8"
          >
            {keyword}
            <span className="w-2 h-2 rounded-full bg-accent-foreground/50" />
          </span>
        ))}
      </motion.div>
    </div>
  );
};
