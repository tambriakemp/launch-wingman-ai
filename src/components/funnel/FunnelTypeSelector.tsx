import { useState } from "react";
import { 
  Gift, DollarSign, Video, Trophy, Rocket, Users, ClipboardCheck,
  Check, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FUNNEL_CONFIGS } from "@/data/funnelConfigs";
import { FunnelDiagram } from "./FunnelDiagram";
import { cn } from "@/lib/utils";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

const ICON_MAP: Record<string, React.ElementType> = {
  Gift,
  DollarSign,
  Video,
  Trophy,
  Rocket,
  Users,
  ClipboardCheck,
};

const COMPLEXITY_CONFIG = {
  beginner: {
    label: "Beginner",
    color: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  intermediate: {
    label: "Intermediate",
    color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  advanced: {
    label: "Advanced",
    color: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
  },
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
    <div className="space-y-4">
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
          const complexityConfig = COMPLEXITY_CONFIG[funnel.complexity];

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
              <AccordionTrigger className="px-4 py-3 hover:no-underline [&>svg]:hidden group">
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
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold text-foreground text-sm">
                        {funnel.name}
                      </h3>
                      <Badge 
                        variant="secondary" 
                        className={cn("text-[10px] px-1.5 py-0 h-4 font-medium", complexityConfig.color)}
                      >
                        {complexityConfig.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {funnel.description}
                    </p>
                  </div>
                  {/* Select button in header when expanded */}
                  {openItem === funnel.id && (
                    <Button
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(funnel.id);
                      }}
                      className="shrink-0"
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-4 h-4 mr-1" />
                          Selected
                        </>
                      ) : (
                        "Select"
                      )}
                    </Button>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-4 pt-2">
                  <p className="text-sm text-muted-foreground">
                    {funnel.description}
                  </p>
                  
                  {/* Best For & Setup Time badges */}
                  <div className="flex flex-wrap gap-2">
                    <div className="inline-flex items-center gap-1.5 text-xs bg-muted px-2 py-1 rounded-md">
                      <span className="font-medium text-foreground">Best for:</span>
                      <span className="text-muted-foreground">{funnel.bestFor}</span>
                    </div>
                    {funnel.typicalSetupTime && (
                      <div className="inline-flex items-center gap-1.5 text-xs bg-muted px-2 py-1 rounded-md">
                        <Clock className="w-3 h-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{funnel.typicalSetupTime} to set up</span>
                      </div>
                    )}
                  </div>
                  
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
                    <p className="text-xs text-muted-foreground">
                      Offer Slots: {funnel.offerSlots.map(s => s.label.replace(" (Optional)", "")).join(" → ")}
                    </p>
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
