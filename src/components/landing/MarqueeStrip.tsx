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
    <div className="border-y hairline py-5 overflow-hidden bg-background">
      <motion.div
        className="flex gap-10 whitespace-nowrap"
        animate={{ x: [0, -1920] }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {[...keywords, ...keywords, ...keywords].map((keyword, index) => (
          <span
            key={index}
            className="font-serif italic text-2xl text-foreground/80 flex items-center gap-10"
          >
            {keyword}
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          </span>
        ))}
      </motion.div>
    </div>
  );
};
