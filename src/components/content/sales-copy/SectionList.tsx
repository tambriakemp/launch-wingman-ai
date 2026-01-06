import { useState } from "react";
import { ArrowLeft, Check, Minus, Pencil, Lock, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useFeatureAccess, FREE_PLAN_LIMITS } from "@/hooks/useFeatureAccess";
import { UpgradePrompt } from "@/components/UpgradePrompt";
import { SalesPagePreviewDialog } from "./SalesPagePreviewDialog";
import type { SalesCopySection, SectionDraft, OfferForCopy } from "./types";

// Map section IDs to the free plan allowed sections
const FREE_SECTION_IDS = ['opening-headline', 'paint-the-problem', 'final-cta', 'introduce-offer'];

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
  const [previewOpen, setPreviewOpen] = useState(false);
  const { isSubscribed, hasAdminAccess, hasAccess } = useFeatureAccess();
  const hasFullAccess = isSubscribed || hasAdminAccess;
  
  const isSectionLocked = (sectionId: string): boolean => {
    if (hasFullAccess) return false;
    return !FREE_SECTION_IDS.includes(sectionId);
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

  const hasDraftedContent = sections.some(s => drafts[s.id]?.status === 'drafted');
  const offerTitle = offer.title || `${getSlotLabel(offer.slotType)} Page`;

  return (
    <div className="space-y-6">
      {/* Header with back button and preview */}
      <div className="space-y-1">
        <div className="flex items-center justify-between mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="bg-primary text-primary-foreground hover:bg-primary/90 -ml-2"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Choose different offer
          </Button>
          
          <div className="flex items-center gap-2">
            <Badge className="bg-foreground text-background font-normal">
              {getSlotLabel(offer.slotType)}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewOpen(true)}
              disabled={!hasDraftedContent}
            >
              <Eye className="w-4 h-4 mr-1" />
              Preview Page
            </Button>
          </div>
        </div>
        
        <h2 className="text-lg font-medium">
          {offerTitle}
        </h2>
        <p className="text-sm text-muted-foreground">
          Work through these sections at your own pace. Skip what doesn't apply.
        </p>
      </div>

      {/* Preview Dialog */}
      <SalesPagePreviewDialog
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        sections={sections}
        drafts={drafts}
        offerTitle={offerTitle}
        onEditSection={onEditSection}
      />

      {/* Section cards */}
      <div className="space-y-2">
        {sections.map((section, index) => {
          const status = getSectionStatus(section.id);
          const isDrafted = status === 'drafted';
          const preview = drafts[section.id]?.content?.slice(0, 80);
          const isLocked = isSectionLocked(section.id);

          return (
            <Card 
              key={section.id}
              className={cn(
                "transition-all group",
                isLocked 
                  ? "opacity-60 cursor-not-allowed" 
                  : "cursor-pointer hover:border-primary/50",
                isDrafted && !isLocked && "border-primary/20 bg-primary/5"
              )}
              onClick={() => !isLocked && onEditSection(section)}
            >
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className={cn(
                      "flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium",
                      isLocked
                        ? "bg-muted/50 text-muted-foreground/50"
                        : isDrafted 
                          ? "bg-primary text-primary-foreground" 
                          : "bg-muted text-muted-foreground"
                    )}>
                      {isLocked ? <Lock className="w-3 h-3" /> : isDrafted ? <Check className="w-3.5 h-3.5" /> : index + 1}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className={cn("font-medium", isLocked && "text-muted-foreground")}>{section.label}</h3>
                        {isLocked ? (
                          <Badge variant="outline" className="text-muted-foreground text-xs">
                            <Lock className="w-2.5 h-2.5 mr-1" />
                            Pro
                          </Badge>
                        ) : (
                          getStatusBadge(status)
                        )}
                      </div>
                      <p className={cn("text-sm text-muted-foreground", isLocked && "text-muted-foreground/60")}>
                        {section.description}
                      </p>
                      
                      {preview && !isLocked && (
                        <p className="text-sm text-muted-foreground/70 mt-1.5 truncate italic">
                          "{preview}..."
                        </p>
                      )}
                    </div>
                  </div>

                  {!isLocked && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      {isDrafted ? 'Edit' : 'Write'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Pro upgrade prompt for free users */}
      {!hasFullAccess && (
        <div className="pt-4">
          <UpgradePrompt
            feature="full_sales_copy"
            variant="card"
            customMessage="Unlock all sales copy sections with step-by-step AI guidance"
          />
        </div>
      )}

      {/* Reassurance note */}
      <p className="text-xs text-muted-foreground text-center pt-4">
        You don't need to complete all sections. Use what helps, skip what doesn't.
      </p>
    </div>
  );
};
