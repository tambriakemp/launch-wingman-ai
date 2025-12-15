import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ChevronLeft, ChevronRight, Check, Loader2, Save,
  Layers, Users, ListChecks
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { FUNNEL_CONFIGS } from "@/data/funnelConfigs";
import { FunnelTypeSelector } from "@/components/funnel/FunnelTypeSelector";
import { AudienceDiscovery, AudienceData } from "@/components/funnel/AudienceDiscovery";
import { OfferStackBuilder } from "@/components/funnel/OfferStackBuilder";
import { OfferSlotData } from "@/components/funnel/OfferSlotCard";
import { AssetChecklist } from "@/components/funnel/AssetChecklist";
import { cn } from "@/lib/utils";

interface FunnelBuilderProps {
  projectId: string;
}

type Step = 'funnel-type' | 'audience' | 'offers' | 'checklist';

const STEPS: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: 'funnel-type', label: 'Funnel Type', icon: Layers },
  { id: 'audience', label: 'Audience', icon: Users },
  { id: 'offers', label: 'Offers', icon: Layers },
  { id: 'checklist', label: 'Checklist', icon: ListChecks },
];

export const FunnelBuilder = ({ projectId }: FunnelBuilderProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState<Step>('funnel-type');
  const [funnelType, setFunnelType] = useState<string | null>(null);
  const [audienceData, setAudienceData] = useState<AudienceData>({
    niche: '',
    targetAudience: '',
    primaryPainPoint: '',
    desiredOutcome: '',
    problemStatement: '',
  });
  const [offers, setOffers] = useState<OfferSlotData[]>([]);
  const [completedAssets, setCompletedAssets] = useState<Set<string>>(new Set());

  // Fetch existing funnel data
  const { data: existingFunnel, isLoading } = useQuery({
    queryKey: ['funnel', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funnels')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
  });

  // Fetch existing offers for this funnel
  const { data: existingOffers } = useQuery({
    queryKey: ['funnel-offers', projectId],
    queryFn: async () => {
      if (!existingFunnel?.id) return [];
      
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('funnel_id', existingFunnel.id)
        .order('slot_position');

      if (error) throw error;
      return data;
    },
    enabled: !!existingFunnel?.id,
  });

  // Initialize state from existing data
  useEffect(() => {
    if (existingFunnel) {
      setFunnelType(existingFunnel.funnel_type);
      setAudienceData({
        niche: existingFunnel.niche || '',
        targetAudience: existingFunnel.target_audience || '',
        primaryPainPoint: existingFunnel.primary_pain_point || '',
        desiredOutcome: existingFunnel.desired_outcome || '',
        problemStatement: existingFunnel.problem_statement || '',
      });
      
      // If we have offers, set the current step to checklist
      if (existingOffers && existingOffers.length > 0) {
        setCurrentStep('checklist');
      } else if (existingFunnel.funnel_type) {
        setCurrentStep('audience');
      }
    }
  }, [existingFunnel]);

  // Initialize offers from existing data or funnel config
  useEffect(() => {
    if (existingOffers && existingOffers.length > 0) {
      setOffers(existingOffers.map(offer => ({
        id: offer.id,
        slotType: offer.slot_type,
        title: offer.title || '',
        description: offer.description || '',
        offerType: offer.offer_type,
        price: offer.price?.toString() || '',
        priceType: offer.price_type || 'one-time',
        isConfigured: true,
      })));
    } else if (funnelType && FUNNEL_CONFIGS[funnelType]) {
      // Initialize with default slots from funnel config
      const config = FUNNEL_CONFIGS[funnelType];
      setOffers(config.offerSlots.map(slot => ({
        slotType: slot.type,
        title: '',
        description: '',
        offerType: '',
        price: '',
        priceType: slot.type === 'lead-magnet' ? 'free' : 'one-time',
        isConfigured: false,
      })));
    }
  }, [funnelType, existingOffers]);

  // Save funnel mutation
  const saveFunnelMutation = useMutation({
    mutationFn: async () => {
      if (!user || !funnelType) throw new Error("Missing required data");

      // Upsert funnel
      const funnelData = {
        project_id: projectId,
        user_id: user.id,
        funnel_type: funnelType,
        niche: audienceData.niche,
        target_audience: audienceData.targetAudience,
        primary_pain_point: audienceData.primaryPainPoint,
        desired_outcome: audienceData.desiredOutcome,
        problem_statement: audienceData.problemStatement,
      };

      let funnelId = existingFunnel?.id;

      if (existingFunnel) {
        const { error } = await supabase
          .from('funnels')
          .update(funnelData)
          .eq('id', existingFunnel.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('funnels')
          .insert(funnelData)
          .select()
          .single();
        if (error) throw error;
        funnelId = data.id;
      }

      // Save offers
      for (let i = 0; i < offers.length; i++) {
        const offer = offers[i];
        const offerData = {
          project_id: projectId,
          user_id: user.id,
          funnel_id: funnelId,
          slot_type: offer.slotType,
          slot_position: i,
          title: offer.title || null,
          description: offer.description || null,
          offer_type: offer.offerType || 'Other',
          offer_category: 'funnel-offer',
          niche: audienceData.niche,
          target_audience: audienceData.targetAudience,
          primary_pain_point: audienceData.primaryPainPoint,
          desired_outcome: audienceData.desiredOutcome,
          price: offer.price ? parseFloat(offer.price) : null,
          price_type: offer.priceType,
          is_required: FUNNEL_CONFIGS[funnelType]?.offerSlots.find(s => s.type === offer.slotType)?.isRequired ?? false,
        };

        if (offer.id) {
          const { error } = await supabase
            .from('offers')
            .update(offerData)
            .eq('id', offer.id);
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('offers')
            .insert(offerData);
          if (error) throw error;
        }
      }

      return funnelId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['funnel', projectId] });
      queryClient.invalidateQueries({ queryKey: ['funnel-offers', projectId] });
      toast.success("Funnel saved successfully!");
    },
    onError: (error) => {
      console.error("Error saving funnel:", error);
      toast.error("Failed to save funnel");
    },
  });

  const handleFunnelTypeSelect = (type: string) => {
    setFunnelType(type);
  };

  const handleToggleAsset = (assetId: string) => {
    setCompletedAssets(prev => {
      const newSet = new Set(prev);
      if (newSet.has(assetId)) {
        newSet.delete(assetId);
      } else {
        newSet.add(assetId);
      }
      return newSet;
    });
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'funnel-type':
        return !!funnelType;
      case 'audience':
        return !!audienceData.niche && !!audienceData.targetAudience;
      case 'offers':
        return offers.some(o => o.isConfigured || o.title);
      case 'checklist':
        return true;
      default:
        return false;
    }
  };

  const goToStep = (step: Step) => {
    setCurrentStep(step);
  };

  const nextStep = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1].id);
    }
  };

  const prevStep = () => {
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1].id);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Step Indicator */}
      <div className="flex items-center justify-between p-4 bg-card border border-border rounded-xl">
        <div className="flex items-center gap-2">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            const isActive = currentStep === step.id;
            const isPast = STEPS.findIndex(s => s.id === currentStep) > index;
            
            return (
              <div key={step.id} className="flex items-center">
                {index > 0 && (
                  <div className={cn(
                    "w-8 h-0.5 mx-1",
                    isPast ? "bg-primary" : "bg-border"
                  )} />
                )}
                <button
                  onClick={() => goToStep(step.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : isPast
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {isPast && !isActive ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                  <span className="text-sm font-medium hidden sm:inline">{step.label}</span>
                </button>
              </div>
            );
          })}
        </div>

        <Button
          onClick={() => saveFunnelMutation.mutate()}
          disabled={saveFunnelMutation.isPending || !funnelType}
          size="sm"
        >
          {saveFunnelMutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save
            </>
          )}
        </Button>
      </div>

      {/* Step Content */}
      <div className="min-h-[500px]">
        <AnimatePresence mode="wait">
          {currentStep === 'funnel-type' && (
            <motion.div
              key="funnel-type"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <FunnelTypeSelector
                selectedFunnelType={funnelType}
                onSelect={handleFunnelTypeSelect}
              />
            </motion.div>
          )}

          {currentStep === 'audience' && (
            <motion.div
              key="audience"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <AudienceDiscovery
                data={audienceData}
                onChange={setAudienceData}
              />
            </motion.div>
          )}

          {currentStep === 'offers' && funnelType && (
            <motion.div
              key="offers"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <OfferStackBuilder
                funnelType={funnelType}
                offers={offers}
                onChange={setOffers}
              />
            </motion.div>
          )}

          {currentStep === 'checklist' && funnelType && (
            <motion.div
              key="checklist"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <AssetChecklist
                funnelType={funnelType}
                offers={offers}
                completedAssets={completedAssets}
                onToggleAsset={handleToggleAsset}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={currentStep === 'funnel-type'}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Previous
        </Button>

        {currentStep !== 'checklist' ? (
          <Button
            onClick={nextStep}
            disabled={!canProceed()}
          >
            Next
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button
            onClick={() => saveFunnelMutation.mutate()}
            disabled={saveFunnelMutation.isPending}
          >
            {saveFunnelMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Complete Setup
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
};
