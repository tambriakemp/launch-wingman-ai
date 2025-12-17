import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Plus, Info, GripVertical, ChevronRight, Check, SkipForward } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  FUNNEL_CONFIGS, 
  OfferSlotConfig,
  SLOT_TYPE_COLORS 
} from "@/data/funnelConfigs";
import { OfferSlotData } from "./OfferSlotCard";
import { OfferSlotSheet } from "./OfferSlotSheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AudienceData } from "./AudienceDiscovery";
import { cn } from "@/lib/utils";

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
  const [activeOfferIndex, setActiveOfferIndex] = useState<number | null>(null);
  const [showAddSlot, setShowAddSlot] = useState(false);

  const funnelConfig = FUNNEL_CONFIGS[funnelType];

  if (!funnelConfig) return null;

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(offers);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    onChange(items);
  };

  const handleOfferChange = (index: number, data: OfferSlotData) => {
    const newOffers = [...offers];
    newOffers[index] = data;
    onChange(newOffers);
  };

  const handleRemoveOffer = (index: number) => {
    const newOffers = offers.filter((_, i) => i !== index);
    onChange(newOffers);
    setActiveOfferIndex(null);
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
    setActiveOfferIndex(offers.length);
    setShowAddSlot(false);
  };

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

  const activeOffer = activeOfferIndex !== null ? offers[activeOfferIndex] : null;
  const activeSlot = activeOffer ? getSlotConfig(activeOffer) : null;

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 rounded-lg bg-muted/50 border border-border">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm">
          <p className="text-foreground font-medium mb-1">
            How offer slots work
          </p>
          <p className="text-muted-foreground">
            Each slot represents a position in your funnel. Click to configure, drag to reorder.
            You can skip optional slots if they don't fit your strategy.
          </p>
        </div>
      </div>

      {/* Progress Counter */}
      <div className="flex justify-end">
        <div className="text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{configuredCount}</span>
          /{activeOffers.length} configured
        </div>
      </div>

      {/* Offer List */}
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="offers">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps}>
                {offers.map((offer, index) => {
                  const slot = getSlotConfig(offer);
                  const colorClasses = SLOT_TYPE_COLORS[slot.type] || SLOT_TYPE_COLORS['core'];
                  const isSkipped = offer.isSkipped;

                  return (
                    <Draggable
                      key={`${offer.slotType}-${index}`}
                      draggableId={`${offer.slotType}-${index}`}
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            "flex items-center gap-3 px-4 py-5 border-b border-border last:border-b-0 transition-colors",
                            snapshot.isDragging && "bg-muted shadow-lg",
                            isSkipped && "opacity-50 bg-muted/30"
                          )}
                        >
                          {/* Drag Handle */}
                          <div
                            {...provided.dragHandleProps}
                            className="text-muted-foreground hover:text-foreground cursor-grab active:cursor-grabbing"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>

                          {/* Content - Clickable */}
                          <button
                            onClick={() => setActiveOfferIndex(index)}
                            className="flex-1 flex items-center gap-3 text-left min-w-0"
                          >
                            <Badge variant="outline" className={cn("shrink-0", colorClasses)}>
                              {slot.label.replace(" (Optional)", "")}
                            </Badge>

                            <div className="flex-1 min-w-0">
                              {isSkipped ? (
                                <span className="text-sm text-muted-foreground italic flex items-center gap-1">
                                  <SkipForward className="w-3 h-3" />
                                  Skipped
                                </span>
                              ) : offer.title ? (
                                <div className="space-y-1">
                                  <span className="text-sm font-medium text-foreground truncate block">
                                    {offer.title}
                                  </span>
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    {offer.offerType && (
                                      <span>{offer.offerType}</span>
                                    )}
                                    {offer.offerType && (offer.price || offer.priceType) && (
                                      <span>•</span>
                                    )}
                                    {offer.priceType === 'free' ? (
                                      <span>Free</span>
                                    ) : offer.price ? (
                                      <span>
                                        ${offer.price}
                                        {offer.priceType && offer.priceType !== 'one-time' && (
                                          <span className="ml-1">
                                            ({offer.priceType === 'monthly' ? '/mo' : 
                                              offer.priceType === 'annual' ? '/yr' : 
                                              offer.priceType === 'quarterly' ? '/qtr' : 
                                              offer.priceType})
                                          </span>
                                        )}
                                      </span>
                                    ) : null}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-sm text-muted-foreground italic">
                                  Not configured
                                </span>
                              )}
                            </div>
                          </button>

                          {/* Status & Arrow */}
                          <div className="flex items-center gap-2 shrink-0">
                            {offer.isConfigured && !isSkipped && (
                              <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                            <button
                              onClick={() => setActiveOfferIndex(index)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </div>

      {/* Add Slot */}
      <div className="pt-2">
        {showAddSlot ? (
          <div className="flex items-center gap-3 p-4 border border-dashed border-border rounded-xl bg-muted/30">
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
          </div>
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

      {/* Sheet for editing */}
      {activeOffer && activeSlot && (
        <OfferSlotSheet
          isOpen={activeOfferIndex !== null}
          onClose={() => setActiveOfferIndex(null)}
          slot={activeSlot}
          data={activeOffer}
          onChange={(data) => handleOfferChange(activeOfferIndex!, data)}
          onRemove={() => handleRemoveOffer(activeOfferIndex!)}
          isRemovable={
            !activeSlot.isRequired || 
            offers.filter(o => o.slotType === activeOffer.slotType).length > 1
          }
          audienceData={audienceData}
          funnelType={funnelType}
        />
      )}
    </div>
  );
};
