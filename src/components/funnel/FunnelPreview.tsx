import { motion } from "framer-motion";
import { X, ArrowDown, Package, DollarSign, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FUNNEL_CONFIGS, SLOT_TYPE_COLORS } from "@/data/funnelConfigs";
import { OfferSlotData } from "./OfferSlotCard";
import { cn } from "@/lib/utils";

interface FunnelPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  funnelType: string;
  offers: OfferSlotData[];
}

export const FunnelPreview = ({
  isOpen,
  onClose,
  funnelType,
  offers,
}: FunnelPreviewProps) => {
  const config = FUNNEL_CONFIGS[funnelType];

  if (!config) return null;

  const getOfferForSlot = (slotType: string) => {
    return offers.find((o) => o.slotType === slotType && !o.isSkipped);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Funnel Preview: {config.name}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {/* Visual Funnel Flow */}
          <div className="flex flex-col items-center gap-2">
            {config.steps.map((step, index) => {
              // Find if this step has an associated offer slot
              const matchingSlot = config.offerSlots.find((slot) =>
                step.toLowerCase().includes(slot.type.replace("-", " "))
              );
              const offer = matchingSlot
                ? getOfferForSlot(matchingSlot.type)
                : null;
              const colorClasses = matchingSlot
                ? SLOT_TYPE_COLORS[matchingSlot.type] || SLOT_TYPE_COLORS["core"]
                : "";

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="w-full"
                >
                  {index > 0 && (
                    <div className="flex justify-center py-1">
                      <ArrowDown className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}

                  <div
                    className={cn(
                      "p-4 rounded-xl border-2 transition-all",
                      offer
                        ? "border-primary bg-primary/5"
                        : "border-border bg-card"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-medium text-muted-foreground">
                            Step {index + 1}
                          </span>
                          {matchingSlot && (
                            <Badge
                              variant="outline"
                              className={cn("text-xs", colorClasses)}
                            >
                              {matchingSlot.label.replace(" (Optional)", "")}
                            </Badge>
                          )}
                        </div>
                        <p className="font-medium text-foreground">{step}</p>
                      </div>

                      {offer && (
                        <div className="text-right shrink-0">
                          <p className="text-sm font-semibold text-foreground">
                            {offer.title || "Untitled Offer"}
                          </p>
                          {offer.price && (
                            <p className="text-xs text-primary flex items-center justify-end gap-1">
                              <DollarSign className="w-3 h-3" />
                              {offer.price}
                            </p>
                          )}
                          {offer.priceType === "free" && (
                            <p className="text-xs text-emerald-600 flex items-center justify-end gap-1">
                              <Gift className="w-3 h-3" />
                              Free
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {offer?.description && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {offer.description}
                      </p>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Offer Summary */}
          <div className="mt-6 pt-4 border-t border-border">
            <h4 className="text-sm font-semibold text-foreground mb-3">
              Configured Offers
            </h4>
            <div className="grid gap-2">
              {offers.filter((o) => !o.isSkipped).length > 0 ? (
                offers
                  .filter((o) => !o.isSkipped)
                  .map((offer, index) => {
                    const slotConfig = config.offerSlots.find(
                      (s) => s.type === offer.slotType
                    );
                    const colorClasses =
                      SLOT_TYPE_COLORS[offer.slotType] ||
                      SLOT_TYPE_COLORS["core"];

                    return (
                      <div
                        key={index}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg",
                          offer.isConfigured
                            ? "bg-emerald-500/10 border border-emerald-500/30"
                            : "bg-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn("text-xs", colorClasses)}
                          >
                            {slotConfig?.label.replace(" (Optional)", "") ||
                              offer.slotType}
                          </Badge>
                          <span className="text-sm font-medium text-foreground">
                            {offer.title || "Not configured"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {offer.price && (
                            <span className="text-sm text-muted-foreground">
                              ${offer.price}
                            </span>
                          )}
                          {offer.isConfigured && (
                            <Badge
                              variant="outline"
                              className="text-xs text-emerald-600 border-emerald-500/50"
                            >
                              Ready
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No offers configured yet
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            <X className="w-4 h-4 mr-2" />
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
