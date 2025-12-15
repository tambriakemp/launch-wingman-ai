import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Gift, DollarSign, Video, Trophy, Rocket, Users, ClipboardCheck,
  Check
} from "lucide-react";
import { FUNNEL_CONFIGS } from "@/data/funnelConfigs";
import { FunnelDiagram } from "./FunnelDiagram";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  const [openItem, setOpenItem] = useState<string | undefined>(selectedFunnelType || undefined);

  const funnels = Object.values(FUNNEL_CONFIGS);

  const handleAccordionChange = (value: string) => {
    setOpenItem(value);
  };

  const handleSelect = (funnelId: string) => {
    onSelect(funnelId);
    // Auto-collapse after selection
    setOpenItem(undefined);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Choose Your Funnel Type
        </h2>
        <p className="text-muted-foreground">
          Select the funnel that best matches your launch strategy. Click to expand and see details.
        </p>
      </div>

      <Accordion 
        type="single" 
        collapsible 
        value={openItem}
        onValueChange={handleAccordionChange}
        className="space-y-3"
      >
        {funnels.map((funnel) => {
          const Icon = ICON_MAP[funnel.icon] || Gift;
          const isSelected = selectedFunnelType === funnel.id;

          return (
            <AccordionItem
              key={funnel.id}
              value={funnel.id}
              className={cn(
                "border-2 rounded-xl overflow-hidden transition-all",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card hover:border-muted-foreground/30"
              )}
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline [&>svg]:hidden">
                <div className="flex items-center gap-3 flex-1">
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3 text-primary-foreground" />
                    </div>
                  )}
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                    isSelected ? "bg-primary text-primary-foreground" : funnel.bgColor + " " + funnel.color
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <h3 className="font-semibold text-foreground text-sm">
                      {funnel.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {funnel.description}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4 pt-2">
                  <p className="text-sm text-muted-foreground">
                    {funnel.description}
                  </p>
                  
                  <div className="text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {funnel.offerSlots.length} offer slots
                    </span>
                    {" • "}
                    <span className="font-medium text-foreground">
                      {funnel.assets.length} assets
                    </span>
                  </div>

                  <FunnelDiagram
                    steps={funnel.steps}
                    color={funnel.color}
                    bgColor={funnel.bgColor}
                  />

                  <div className="pt-2 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-3">
                      Offer Slots: {funnel.offerSlots.map(s => s.label.replace(" (Optional)", "")).join(" → ")}
                    </p>
                    <button
                      onClick={() => handleSelect(funnel.id)}
                      className={cn(
                        "w-full py-2 px-4 rounded-lg text-sm font-medium transition-colors",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted hover:bg-muted/80 text-foreground"
                      )}
                    >
                      {isSelected ? "Selected" : "Select This Funnel"}
                    </button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};
