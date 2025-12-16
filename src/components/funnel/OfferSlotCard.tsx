import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronDown, ChevronUp, GripVertical, Sparkles, 
  Check, Trash2, Loader2, SkipForward
} from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { OfferSlotConfig, OFFER_TYPES, SLOT_TYPE_COLORS } from "@/data/funnelConfigs";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { AudienceData } from "./AudienceDiscovery";

export interface OfferSlotData {
  id?: string;
  slotType: string;
  title: string;
  description: string;
  offerType: string;
  price: string;
  priceType: string;
  isConfigured: boolean;
  isSkipped?: boolean;
}

interface GeneratedIdea {
  title: string;
  description: string;
}

interface OfferSlotCardProps {
  slot: OfferSlotConfig;
  data: OfferSlotData;
  position: number;
  isExpanded: boolean;
  onToggle: () => void;
  onChange: (data: OfferSlotData) => void;
  onRemove?: () => void;
  isRemovable: boolean;
  audienceData?: AudienceData;
  funnelType?: string;
}

const PRICE_TYPES = [
  { value: "free", label: "Free" },
  { value: "one-time", label: "One-time Payment" },
  { value: "monthly", label: "Monthly Subscription" },
  { value: "quarterly", label: "Quarterly Payment" },
  { value: "annual", label: "Annual Payment" },
  { value: "payment-plan", label: "Payment Plan" },
];

export const OfferSlotCard = ({
  slot,
  data,
  position,
  isExpanded,
  onToggle,
  onChange,
  onRemove,
  isRemovable,
  audienceData,
  funnelType,
}: OfferSlotCardProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedIdeas, setGeneratedIdeas] = useState<GeneratedIdea[]>([]);
  const [showIdeas, setShowIdeas] = useState(false);
  const colorClasses = SLOT_TYPE_COLORS[slot.type] || SLOT_TYPE_COLORS['core'];

  const handleFieldChange = (field: keyof OfferSlotData, value: string | boolean) => {
    onChange({ ...data, [field]: value });
  };

  const handleSkipToggle = () => {
    onChange({ ...data, isSkipped: !data.isSkipped, isConfigured: false });
  };

  const handleGenerateTitleDescription = async () => {
    // Validate offer type is selected
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

  // If skipped, show minimal card
  if (data.isSkipped) {
    return (
      <motion.div
        layout
        className="border rounded-xl overflow-hidden border-border bg-muted/30 opacity-60"
      >
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className={cn("shrink-0", colorClasses)}>
              {slot.label.replace(" (Optional)", "")}
            </Badge>
            <span className="text-sm text-muted-foreground italic">Skipped</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleSkipToggle}>
            <SkipForward className="w-4 h-4 mr-1" />
            Include
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "border rounded-xl overflow-hidden transition-all",
        isExpanded ? "border-primary/50 bg-card" : "border-border bg-card/50",
        data.isConfigured && "border-l-4 border-l-emerald-500"
      )}
    >
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors"
      >
        <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
        
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Badge variant="outline" className={cn("shrink-0", colorClasses)}>
            {slot.label.replace(" (Optional)", "")}
          </Badge>
          
          {data.title ? (
            <span className="text-sm font-medium text-foreground truncate">
              {data.title}
            </span>
          ) : (
            <span className="text-sm text-muted-foreground italic">
              Not configured
            </span>
          )}

          {!slot.isRequired && (
            <span className="text-xs text-muted-foreground">(Optional)</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {data.isConfigured && (
            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
              <Check className="w-3 h-3 text-white" />
            </div>
          )}
          
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 pt-0 space-y-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                {slot.description}
                {slot.priceRange && (
                  <span className="ml-2 text-primary font-medium">
                    Typical: {slot.priceRange}
                  </span>
                )}
              </p>

              {/* Offer Type - Required before AI */}
              <div className="space-y-2">
                <Label htmlFor={`offer-type-${position}`}>
                  Offer Type <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={data.offerType}
                  onValueChange={(value) => handleFieldChange("offerType", value)}
                >
                  <SelectTrigger id={`offer-type-${position}`}>
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


              {/* Generated Ideas Selection */}
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor={`title-${position}`}>Offer Title</Label>
                  <Input
                    id={`title-${position}`}
                    value={data.title}
                    onChange={(e) => handleFieldChange("title", e.target.value)}
                    placeholder={`e.g., "Ultimate ${slot.label} Guide"`}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`price-${position}`}>Price</Label>
                  <Input
                    id={`price-${position}`}
                    value={data.price}
                    onChange={(e) => handleFieldChange("price", e.target.value)}
                    placeholder="e.g., 297"
                    type="text"
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor={`price-type-${position}`}>Price Type</Label>
                  <Select
                    value={data.priceType}
                    onValueChange={(value) => handleFieldChange("priceType", value)}
                  >
                    <SelectTrigger id={`price-type-${position}`}>
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

              <div className="space-y-2">
                <Label htmlFor={`description-${position}`}>Description</Label>
                <Textarea
                  id={`description-${position}`}
                  value={data.description}
                  onChange={(e) => handleFieldChange("description", e.target.value)}
                  placeholder="Briefly describe what this offer includes..."
                  rows={2}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFieldChange("isConfigured", !data.isConfigured)}
                    className={cn(
                      data.isConfigured && "bg-emerald-500/10 border-emerald-500/50 text-emerald-600"
                    )}
                  >
                    {data.isConfigured ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Configured
                      </>
                    ) : (
                      "Mark as Configured"
                    )}
                  </Button>

                  {!slot.isRequired && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleSkipToggle}
                      className="text-muted-foreground"
                    >
                      <SkipForward className="w-4 h-4 mr-1" />
                      Skip
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* AI Generate Button - positioned bottom right */}
                  {audienceData && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleGenerateTitleDescription}
                      disabled={isGenerating || !data.offerType}
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-2" />
                          Generate with AI
                        </>
                      )}
                    </Button>
                  )}

                  {isRemovable && onRemove && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onRemove}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
