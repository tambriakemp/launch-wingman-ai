import { FileText, ChevronRight, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { OfferForCopy, SectionDraft } from "./types";
import { getSectionsForOffer } from "./types";

interface OfferSelectorProps {
  offers: OfferForCopy[];
  existingCopy: Array<{ deliverable_id: string; sections: unknown }>;
  onSelect: (offerId: string) => void;
}

export const OfferSelector = ({ offers, existingCopy, onSelect }: OfferSelectorProps) => {
  const formatPrice = (offer: OfferForCopy) => {
    if (!offer.price || offer.price === 0) return "Free";
    return `$${offer.price}`;
  };

  const getSlotLabel = (slotType: string) => {
    const labels: Record<string, string> = {
      'lead-magnet': 'Lead Magnet',
      'tripwire': 'Tripwire',
      'core': 'Core Offer',
      'upsell': 'Upsell',
      'downsell': 'Downsell',
      'bonus': 'Bonus',
    };
    return labels[slotType] || slotType;
  };

  const getProgress = (offerId: string, offer: OfferForCopy) => {
    const copyRecord = existingCopy.find(c => c.deliverable_id === offerId);
    if (!copyRecord) return { completed: 0, total: 0, percent: 0 };
    
    const sections = getSectionsForOffer(offer.slotType, offer.price);
    const drafts = (copyRecord.sections || {}) as Record<string, SectionDraft>;
    const completed = Object.values(drafts).filter(d => d.status === 'drafted').length;
    
    return {
      completed,
      total: sections.length,
      percent: sections.length > 0 ? Math.round((completed / sections.length) * 100) : 0,
    };
  };

  if (offers.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-12 text-center">
          <FileText className="w-10 h-10 mx-auto text-muted-foreground/50 mb-3" />
          <p className="text-muted-foreground">
            No offers found. Set up your offer stack in the Plan section first.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-medium">Which offer are you writing copy for?</h2>
        <p className="text-sm text-muted-foreground">
          Select an offer to see the relevant sections for its sales page.
        </p>
      </div>

      <div className="space-y-2">
        {offers.map((offer) => {
          const progress = getProgress(offer.id, offer);
          const hasProgress = progress.completed > 0;
          
          return (
            <Card 
              key={offer.id}
              className="cursor-pointer hover:border-primary/50 transition-colors group"
              onClick={() => onSelect(offer.id)}
            >
              <CardContent className="py-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs font-normal">
                        {getSlotLabel(offer.slotType)}
                      </Badge>
                      <span className="text-sm text-muted-foreground">
                        {formatPrice(offer)}
                      </span>
                    </div>
                    <h3 className="font-medium truncate">
                      {offer.title || `${getSlotLabel(offer.slotType)} Page`}
                    </h3>
                    
                    {hasProgress && (
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={progress.percent} className="h-1.5 flex-1 max-w-32" />
                        <span className="text-xs text-muted-foreground">
                          {progress.completed}/{progress.total} sections
                        </span>
                      </div>
                    )}
                  </div>
                  
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
