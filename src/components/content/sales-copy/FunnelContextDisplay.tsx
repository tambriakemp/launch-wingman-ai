import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FunnelConfig } from "@/data/funnelConfigs";
import type { OfferForCopy } from "./types";

interface FunnelContextDisplayProps {
  funnelConfig: FunnelConfig;
  offers: OfferForCopy[];
}

export const FunnelContextDisplay = ({ funnelConfig, offers }: FunnelContextDisplayProps) => {
  const formatPrice = (offer: OfferForCopy) => {
    if (!offer.price || offer.price === 0) return "Free";
    return `$${offer.price}`;
  };

  const getOfferLabel = (offer: OfferForCopy) => {
    if (offer.title) return offer.title;
    const slotConfig = funnelConfig.offerSlots.find(s => s.type === offer.slotType);
    return slotConfig?.label || offer.slotType;
  };

  return (
    <Card className="bg-muted/30 border-border/50">
      <CardContent className="pt-4 pb-4 space-y-3">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Detected Context</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Funnel type:</span>
            <Badge variant="secondary" className="font-normal">
              {funnelConfig.name}
            </Badge>
          </div>
        </div>

        <div className="space-y-1.5">
          <p className="text-xs text-muted-foreground">Offer stack:</p>
          <div className="flex flex-wrap gap-2">
            {offers.map((offer, index) => (
              <div 
                key={offer.id}
                className="flex items-center gap-1.5 text-sm bg-background/60 px-2 py-1 rounded border border-border/50"
              >
                <span className="text-muted-foreground">{index + 1}.</span>
                <span>{getOfferLabel(offer)}</span>
                <span className="text-muted-foreground">({formatPrice(offer)})</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
