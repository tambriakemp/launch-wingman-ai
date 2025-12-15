import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Gift, DollarSign, Video, Trophy, Rocket, Users, ClipboardCheck,
  Check
} from "lucide-react";
import { FUNNEL_CONFIGS, FunnelConfig } from "@/data/funnelConfigs";
import { FunnelDiagram } from "./FunnelDiagram";
import { cn } from "@/lib/utils";

const ICON_MAP: Record<string, React.ElementType> = {
  Gift,
  DollarSign,
  Video,
  Trophy,
  Rocket,
  Users,
  ClipboardCheck,
};

interface FunnelTypeSelectorProps {
  selectedFunnelType: string | null;
  onSelect: (funnelType: string) => void;
}

export const FunnelTypeSelector = ({ 
  selectedFunnelType, 
  onSelect 
}: FunnelTypeSelectorProps) => {
  const [hoveredFunnel, setHoveredFunnel] = useState<string | null>(null);

  const funnels = Object.values(FUNNEL_CONFIGS);
  const activeFunnel = hoveredFunnel || selectedFunnelType;
  const activeFunnelConfig = activeFunnel ? FUNNEL_CONFIGS[activeFunnel] : null;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Choose Your Funnel Type
        </h2>
        <p className="text-muted-foreground">
          Select the funnel that best matches your launch strategy. Each funnel includes pre-configured offer slots and asset checklists.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel Cards */}
        <div className="grid grid-cols-1 gap-3">
          {funnels.map((funnel) => {
            const Icon = ICON_MAP[funnel.icon] || Gift;
            const isSelected = selectedFunnelType === funnel.id;
            const isHovered = hoveredFunnel === funnel.id;

            return (
              <motion.button
                key={funnel.id}
                onClick={() => onSelect(funnel.id)}
                onMouseEnter={() => setHoveredFunnel(funnel.id)}
                onMouseLeave={() => setHoveredFunnel(null)}
                className={cn(
                  "relative p-4 rounded-xl border-2 text-left transition-all duration-200",
                  isSelected
                    ? "border-primary bg-primary/5"
                    : isHovered
                    ? "border-primary/50 bg-card"
                    : "border-border bg-card hover:border-muted-foreground/30"
                )}
                whileTap={{ scale: 0.99 }}
              >
                {isSelected && (
                  <div className="absolute top-3 right-3">
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    isSelected ? "bg-primary text-primary-foreground" : funnel.bgColor + " " + funnel.color
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground text-sm">
                      {funnel.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {funnel.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Funnel Diagram Preview */}
        <div className="bg-card rounded-xl border border-border p-6">
          <AnimatePresence mode="wait">
            {activeFunnelConfig ? (
              <motion.div
                key={activeFunnelConfig.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div className="text-center">
                  <h3 className="font-semibold text-foreground mb-1">
                    {activeFunnelConfig.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {activeFunnelConfig.offerSlots.length} offer slots • {activeFunnelConfig.assets.length} assets
                  </p>
                </div>
                
                <FunnelDiagram
                  steps={activeFunnelConfig.steps}
                  color={activeFunnelConfig.color}
                  bgColor={activeFunnelConfig.bgColor}
                />

                <div className="pt-3 border-t border-border">
                  <p className="text-xs text-muted-foreground text-center">
                    Offer Slots: {activeFunnelConfig.offerSlots.map(s => s.label.replace(" (Optional)", "")).join(" → ")}
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex items-center justify-center text-muted-foreground text-sm"
              >
                Hover over a funnel to preview its flow
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {selectedFunnelType && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-primary/5 border border-primary/20"
        >
          <div className="flex items-center gap-2 text-primary font-medium mb-1">
            <Check className="w-4 h-4" />
            <span>{FUNNEL_CONFIGS[selectedFunnelType].name} Selected</span>
          </div>
          <p className="text-sm text-muted-foreground">
            This funnel includes {FUNNEL_CONFIGS[selectedFunnelType].offerSlots.length} offer slots 
            and {FUNNEL_CONFIGS[selectedFunnelType].assets.length} assets to create.
          </p>
        </motion.div>
      )}
    </div>
  );
};
