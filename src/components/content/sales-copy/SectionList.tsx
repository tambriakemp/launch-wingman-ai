import { ArrowLeft, Check, Minus, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { SalesCopySection, SectionDraft, OfferForCopy } from "./types";

interface SectionListProps {
  sections: SalesCopySection[];
  drafts: Record<string, SectionDraft>;
  offer: OfferForCopy;
  onEditSection: (section: SalesCopySection) => void;
  onBack: () => void;
}

export const SectionList = ({ 
  sections, 
  drafts, 
  offer, 
  onEditSection, 
  onBack 
}: SectionListProps) => {
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

  const getSectionStatus = (sectionId: string): 'empty' | 'drafted' | 'skipped' => {
    return drafts[sectionId]?.status || 'empty';
  };

  const getStatusBadge = (status: 'empty' | 'drafted' | 'skipped') => {
    switch (status) {
      case 'drafted':
        return (
          <Badge variant="secondary" className="bg-primary/10 text-primary border-0">
            <Check className="w-3 h-3 mr-1" />
            Drafted
          </Badge>
        );
      case 'skipped':
        return (
          <Badge variant="outline" className="text-muted-foreground">
            <Minus className="w-3 h-3 mr-1" />
            Skipped
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with back button */}
      <div className="space-y-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground -ml-2 mb-2"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Choose different offer
        </Button>
        
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-medium">
            {offer.title || `${getSlotLabel(offer.slotType)} Page`}
          </h2>
          <Badge variant="outline" className="font-normal">
            {getSlotLabel(offer.slotType)}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Work through these sections at your own pace. Skip what doesn't apply.
        </p>
      </div>

      {/* Section cards */}
      <div className="space-y-2">
        {sections.map((section, index) => {
          const status = getSectionStatus(section.id);
          const isDrafted = status === 'drafted';
          const preview = drafts[section.id]?.content?.slice(0, 80);

          return (
            <Card 
              key={section.id}
              className={cn(
                "cursor-pointer transition-all hover:border-primary/50 group",
                isDrafted && "border-primary/20 bg-primary/5"
              )}
              onClick={() => onEditSection(section)}
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn(
                      "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                      isDrafted 
                        ? "bg-primary text-primary-foreground" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      {isDrafted ? <Check className="w-3.5 h-3.5" /> : index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="font-medium">{section.label}</h3>
                        {getStatusBadge(status)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {section.description}
                      </p>
                      
                      {preview && (
                        <p className="text-sm text-muted-foreground/70 mt-1.5 truncate italic">
                          "{preview}..."
                        </p>
                      )}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Pencil className="w-4 h-4 mr-1" />
                    {isDrafted ? 'Edit' : 'Write'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Reassurance note */}
      <p className="text-xs text-muted-foreground text-center pt-4">
        You don't need to complete all sections. Use what helps, skip what doesn't.
      </p>
    </div>
  );
};
