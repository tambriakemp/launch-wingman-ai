import { motion } from "framer-motion";
import { Rocket, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FunnelEmptyStateProps {
  onCreateFunnel: () => void;
}

export const FunnelEmptyState = ({ onCreateFunnel }: FunnelEmptyStateProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-16 text-center"
    >
      <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Rocket className="w-10 h-10 text-primary" />
      </div>
      
      <h2 className="text-2xl font-bold text-foreground mb-3">
        Create Your Funnel
      </h2>
      
      <p className="text-muted-foreground max-w-md mb-8">
        Start by selecting a funnel type and defining your audience. 
        We'll guide you through building a complete launch funnel with offers, 
        messaging, and assets.
      </p>

      <div className="flex flex-col sm:flex-row gap-4">
        <Button size="lg" onClick={onCreateFunnel}>
          <Sparkles className="w-5 h-5 mr-2" />
          Build Your Funnel
        </Button>
      </div>

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-2xl">
        <div className="text-center">
          <div className="w-10 h-10 rounded-lg bg-accent mx-auto mb-3 flex items-center justify-center">
            <span className="text-lg font-bold text-primary">1</span>
          </div>
          <h3 className="font-medium text-foreground mb-1">Choose Funnel Type</h3>
          <p className="text-sm text-muted-foreground">
            Select from proven funnel templates
          </p>
        </div>
        <div className="text-center">
          <div className="w-10 h-10 rounded-lg bg-accent mx-auto mb-3 flex items-center justify-center">
            <span className="text-lg font-bold text-primary">2</span>
          </div>
          <h3 className="font-medium text-foreground mb-1">Define Your Audience</h3>
          <p className="text-sm text-muted-foreground">
            Identify your target market and pain points
          </p>
        </div>
        <div className="text-center">
          <div className="w-10 h-10 rounded-lg bg-accent mx-auto mb-3 flex items-center justify-center">
            <span className="text-lg font-bold text-primary">3</span>
          </div>
          <h3 className="font-medium text-foreground mb-1">Build Your Offers</h3>
          <p className="text-sm text-muted-foreground">
            Create compelling offers for each funnel step
          </p>
        </div>
      </div>
    </motion.div>
  );
};
