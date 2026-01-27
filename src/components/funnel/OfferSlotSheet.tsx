import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Check, Trash2, Loader2, SkipForward, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { OfferSlotConfig, OFFER_TYPES } from "@/data/funnelConfigs";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AudienceData } from "@/types/audience";
import { OfferSlotData } from "./OfferSlotCard";
import { SLOT_TYPE_EDUCATION } from "@/data/offerSlotEducation";

interface GeneratedIdea {
  title: string;
  description: string;
}

interface OfferSlotSheetProps {
  isOpen: boolean;
  onClose: () => void;
  slot: OfferSlotConfig;
  data: OfferSlotData;
  onChange: (data: OfferSlotData) => void;
  onRemove?: () => void;
  isRemovable: boolean;
  audienceData?: AudienceData;
  funnelType?: string;
  onSave?: (data: OfferSlotData) => void | Promise<void>;
}

const PRICE_TYPES = [
  { value: "free", label: "Free" },
  { value: "one-time", label: "One-time Payment" },
  { value: "monthly", label: "Monthly Subscription" },
  { value: "quarterly", label: "Quarterly Payment" },
  { value: "annual", label: "Annual Payment" },
  { value: "payment-plan", label: "Payment Plan" },
];

export const OfferSlotSheet = ({
  isOpen,
  onClose,
  slot,
  data,
  onChange,
  onRemove,
  isRemovable,
  audienceData,
  funnelType,
  onSave,
}: OfferSlotSheetProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<GeneratedIdea[]>([]);
  const [showIdeas, setShowIdeas] = useState(false);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const offerTypeRef = useRef<string>(data.offerType);
  const priceTypeRef = useRef<string>(data.priceType);

  useEffect(() => {
    offerTypeRef.current = data.offerType;
    priceTypeRef.current = data.priceType;
  }, [data.offerType, data.priceType]);

  // Auto-resize textarea when sheet opens or description changes
  useEffect(() => {
    if (descriptionRef.current && isOpen) {
      descriptionRef.current.style.height = 'auto';
      descriptionRef.current.style.height = descriptionRef.current.scrollHeight + 'px';
    }
  }, [isOpen, data.description]);

  const handleFieldChange = (field: keyof OfferSlotData, value: string | boolean) => {
    onChange({ ...data, [field]: value });
  };

  const handleSkipToggle = () => {
    onChange({ ...data, isSkipped: !data.isSkipped, isConfigured: false });
    onClose();
  };

  const handleGenerateTitleDescription = async () => {
    if (!data.offerType) {
      toast.error("Please select an offer type first");
      return;
    }

    if (!audienceData?.niche || !audienceData?.targetAudience) {
      toast.error("Please complete the audience step first");
      return;
    }

    setIsGenerating(true);
    setShowIdeas(false);
    try {
      const { data: result, error } = await supabase.functions.invoke(
        "generate-offer-ideas",
        {
          body: {
            niche: audienceData.niche,
            targetAudience: audienceData.targetAudience,
            primaryPainPoint: audienceData.primaryPainPoint || "",
            desiredOutcome: audienceData.desiredOutcome || "",
            offerType: data.offerType,
            slotType: slot.type,
            funnelType: funnelType,
            painSymptoms: audienceData.painSymptoms || [],
            mainObjections: audienceData.mainObjections || "",
            likelihoodElements: audienceData.likelihoodElements || [],
            timeEffortElements: audienceData.timeEffortElements || [],
          },
        }
      );

      if (error) throw error;

      if (result?.ideas && result.ideas.length > 0) {
        setGeneratedIdeas(result.ideas);
        setShowIdeas(true);
        toast.success("Generated 3 offer ideas! Select one below.");
      }
    } catch (error) {
      console.error("Error generating offer ideas:", error);
      toast.error("Failed to generate ideas");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectIdea = (idea: GeneratedIdea) => {
    onChange({
      ...data,
      title: idea.title,
      description: idea.description,
    });
    setShowIdeas(false);
    toast.success("Applied idea to your offer!");
  };

  // Get education content for this slot type
  const slotEducation = SLOT_TYPE_EDUCATION[slot.type];

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent side="right" className="sm:max-w-xl overflow-y-auto bg-background">
        <SheetHeader>
          <SheetTitle>{slot.label.replace(" (Optional)", "")}</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* Slot Type Education - What is this and how is it used */}
          {slotEducation && (
            <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-3">
              <div className="flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    What is a {slotEducation.term}?
                  </p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {slotEducation.whatItIs}
                  </p>
                </div>
              </div>
              <div className="pl-6 space-y-2">
                <p className="text-sm font-medium text-foreground">
                  How it's used:
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {slotEducation.howItsUsed}
                </p>
              </div>
            </div>
          )}

          {/* Brief description from config */}
          <p className="text-sm text-muted-foreground">
            {slot.description}
            {slot.priceRange && (
              <span className="ml-2 text-primary font-medium">
                Typical: {slot.priceRange}
              </span>
            )}
          </p>

          {/* Offer Type */}
          <div className="space-y-2">
            <Label>
              Offer Type <span className="text-destructive">*</span>
            </Label>
            <Select
              value={data.offerType}
              onValueChange={(value) => {
                offerTypeRef.current = value;
                handleFieldChange("offerType", value);
              }}
            >
              <SelectTrigger className="bg-muted/50">
                <SelectValue placeholder="Select type first..." />
              </SelectTrigger>
              <SelectContent>
                {slot.recommendedOfferTypes.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                      Recommended
                    </div>
                    {slot.recommendedOfferTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-3 h-3 text-primary" />
                          {type}
                        </div>
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground border-t mt-1 pt-2">
                      All Types
                    </div>
                  </>
                )}
                {OFFER_TYPES.filter(t => !slot.recommendedOfferTypes.includes(t)).map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label>Offer Title</Label>
            <Input
              ref={titleRef}
              value={data.title}
              onChange={(e) => handleFieldChange("title", e.target.value)}
              placeholder={`e.g., "Ultimate ${slot.label} Guide"`}
              className="bg-muted/50"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              ref={descriptionRef}
              value={data.description}
              onChange={(e) => {
                handleFieldChange("description", e.target.value);
                e.target.style.height = 'auto';
                e.target.style.height = e.target.scrollHeight + 'px';
              }}
              placeholder="Briefly describe what this offer includes..."
              className="min-h-[80px] resize-none bg-muted/50 overflow-hidden"
            />
          </div>

          {/* Price & Price Type */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Price</Label>
              <Input
                ref={priceRef}
                value={data.price}
                onChange={(e) => handleFieldChange("price", e.target.value)}
                placeholder="e.g., 297"
                type="text"
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label>Price Type</Label>
              <Select
                value={data.priceType}
                onValueChange={(value) => {
                  priceTypeRef.current = value;
                  handleFieldChange("priceType", value);
                }}
              >
                <SelectTrigger className="bg-muted/50">
                  <SelectValue placeholder="Select..." />
                </SelectTrigger>
                <SelectContent>
                  {PRICE_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* AI Generate Button */}
          {audienceData && (
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateTitleDescription}
                disabled={isGenerating || !data.offerType}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3 mr-1.5" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
          )}

          {/* Generated Ideas */}
          <AnimatePresence>
            {showIdeas && generatedIdeas.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-2"
              >
                <Label>Select an idea (click to apply)</Label>
                <div className="grid gap-2">
                  {generatedIdeas.map((idea, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectIdea(idea)}
                      className="p-3 border border-border rounded-lg text-left hover:border-primary hover:bg-primary/5 transition-all"
                    >
                      <p className="font-medium text-sm text-foreground">{idea.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{idea.description}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex flex-col gap-3 pt-4 border-t border-border">
            <Button 
              onClick={() => {
                const updated: OfferSlotData = {
                  ...data,
                  title: titleRef.current?.value ?? data.title,
                  description: descriptionRef.current?.value ?? data.description,
                  price: priceRef.current?.value ?? data.price,
                  offerType: offerTypeRef.current ?? data.offerType,
                  priceType: priceTypeRef.current ?? data.priceType,
                };

                onChange(updated);
                onSave?.(updated);
                onClose();
              }} 
              className="w-full"
            >
              Save
            </Button>

            <div className="flex gap-2">
              {!slot.isRequired && (
                <Button
                  variant="ghost"
                  onClick={handleSkipToggle}
                  className="flex-1 text-muted-foreground"
                >
                  <SkipForward className="w-4 h-4 mr-2" />
                  Skip This Slot
                </Button>
              )}

              {isRemovable && onRemove && (
                <Button
                  variant="ghost"
                  onClick={() => {
                    onRemove();
                    onClose();
                  }}
                  className="flex-1 text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
