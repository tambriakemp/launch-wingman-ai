import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Gift, DollarSign, Video, Trophy, Rocket, Users, ClipboardCheck,
  ChevronRight, Check
} from "lucide-react";
import { FUNNEL_CONFIGS, FunnelConfig } from "@/data/funnelConfigs";
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                "relative p-5 rounded-xl border-2 text-left transition-all duration-200",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 bg-card"
              )}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                </div>
              )}

              <div className="flex items-start gap-4">
                <div className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                  isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                )}>
                  <Icon className="w-6 h-6" />
                </div>

                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground mb-1">
                    {funnel.name}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {funnel.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {funnel.offerSlots.slice(0, 3).map((slot) => (
                      <span
                        key={slot.type}
                        className={cn(
                          "text-xs px-2 py-0.5 rounded-full border",
                          slot.isRequired
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-muted text-muted-foreground border-border"
                        )}
                      >
                        {slot.label.replace(" (Optional)", "")}
                      </span>
                    ))}
                    {funnel.offerSlots.length > 3 && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                        +{funnel.offerSlots.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                <ChevronRight className={cn(
                  "w-5 h-5 shrink-0 transition-transform",
                  isHovered ? "translate-x-1 text-primary" : "text-muted-foreground"
                )} />
              </div>
            </motion.button>
          );
        })}
      </div>

      {selectedFunnelType && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-lg bg-primary/5 border border-primary/20"
        >
          <div className="flex items-center gap-2 text-primary font-medium mb-2">
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
