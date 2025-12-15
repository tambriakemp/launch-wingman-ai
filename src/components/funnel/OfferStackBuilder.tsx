import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  FUNNEL_CONFIGS, 
  OfferSlotConfig 
} from "@/data/funnelConfigs";
import { OfferSlotCard, OfferSlotData } from "./OfferSlotCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { AudienceData } from "./AudienceDiscovery";

interface OfferStackBuilderProps {
  funnelType: string;
  offers: OfferSlotData[];
  onChange: (offers: OfferSlotData[]) => void;
  audienceData?: AudienceData;
}

export const OfferStackBuilder = ({
  funnelType,
  offers,
  onChange,
  audienceData,
}: OfferStackBuilderProps) => {
  const [expandedSlots, setExpandedSlots] = useState<Set<number>>(new Set([0]));
  const [showAddSlot, setShowAddSlot] = useState(false);

  const funnelConfig = FUNNEL_CONFIGS[funnelType];

  if (!funnelConfig) return null;

  const toggleSlot = (index: number) => {
    const newExpanded = new Set(expandedSlots);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSlots(newExpanded);
  };

  const handleOfferChange = (index: number, data: OfferSlotData) => {
    const newOffers = [...offers];
    newOffers[index] = data;
    onChange(newOffers);
  };

  const handleRemoveOffer = (index: number) => {
    const newOffers = offers.filter((_, i) => i !== index);
    onChange(newOffers);
    
    // Update expanded slots
    const newExpanded = new Set<number>();
    expandedSlots.forEach((i) => {
      if (i < index) newExpanded.add(i);
      else if (i > index) newExpanded.add(i - 1);
    });
    setExpandedSlots(newExpanded);
  };

  const handleAddCustomSlot = (slotType: string) => {
    const slotConfig = funnelConfig.offerSlots.find(s => s.type === slotType);
    const customSlot: OfferSlotConfig = slotConfig || {
      type: slotType,
      label: slotType.charAt(0).toUpperCase() + slotType.slice(1).replace(/-/g, ' '),
      description: 'Custom offer slot',
      isRequired: false,
      recommendedOfferTypes: [],
    };

    const newOffer: OfferSlotData = {
      slotType: customSlot.type,
      title: '',
      description: '',
      offerType: '',
      price: '',
      priceType: 'one-time',
      isConfigured: false,
      isSkipped: false,
    };

    onChange([...offers, newOffer]);
    setExpandedSlots(new Set([...expandedSlots, offers.length]));
    setShowAddSlot(false);
  };

  // Get slot config for each offer
  const getSlotConfig = (offer: OfferSlotData): OfferSlotConfig => {
    const config = funnelConfig.offerSlots.find(s => s.type === offer.slotType);
    return config || {
      type: offer.slotType,
      label: offer.slotType.charAt(0).toUpperCase() + offer.slotType.slice(1).replace(/-/g, ' '),
      description: 'Custom offer slot',
      isRequired: false,
      recommendedOfferTypes: [],
    };
  };

  const configuredCount = offers.filter(o => o.isConfigured && !o.isSkipped).length;
  const activeOffers = offers.filter(o => !o.isSkipped);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-1">
            Configure Your Offers
          </h2>
          <p className="text-muted-foreground text-sm">
            Set up each offer in your {funnelConfig.name}. Required offers are marked.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{configuredCount}</span>
          /{activeOffers.length} configured
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-foreground font-medium mb-1">
            How offer slots work
          </p>
          <p className="text-muted-foreground">
            Each slot represents a position in your funnel. Select an offer type first, then use AI to generate titles and descriptions. 
            You can skip optional slots if they don't fit your strategy.
          </p>
        </div>
      </div>

      {/* Offer Slots */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {offers.map((offer, index) => (
            <OfferSlotCard
              key={`${offer.slotType}-${index}`}
              slot={getSlotConfig(offer)}
              data={offer}
              position={index}
              isExpanded={expandedSlots.has(index)}
              onToggle={() => toggleSlot(index)}
              onChange={(data) => handleOfferChange(index, data)}
              onRemove={() => handleRemoveOffer(index)}
              isRemovable={!getSlotConfig(offer).isRequired || 
                offers.filter(o => o.slotType === offer.slotType).length > 1}
              audienceData={audienceData}
              funnelType={funnelType}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Add Slot */}
      <div className="pt-2">
        {showAddSlot ? (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 border border-dashed border-border rounded-xl bg-muted/30"
          >
            <Select onValueChange={handleAddCustomSlot}>
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select slot type..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lead-magnet">Lead Magnet</SelectItem>
                <SelectItem value="tripwire">Tripwire / Low-Ticket</SelectItem>
                <SelectItem value="core">Core Offer</SelectItem>
                <SelectItem value="upsell">Upsell</SelectItem>
                <SelectItem value="downsell">Downsell</SelectItem>
                <SelectItem value="bonus">Bonus</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setShowAddSlot(false)}
            >
              Cancel
            </Button>
          </motion.div>
        ) : (
          <Button
            variant="outline"
            className="w-full border-dashed"
            onClick={() => setShowAddSlot(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Another Offer Slot
          </Button>
        )}
      </div>
    </div>
  );
};
