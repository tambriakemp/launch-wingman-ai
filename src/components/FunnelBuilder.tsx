import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  ChevronLeft, ChevronRight, Check, Loader2, Save,
  Layers, Users, Sparkles, Package, Lock, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { FUNNEL_CONFIGS } from "@/data/funnelConfigs";
import { FunnelTypeSelector } from "@/components/funnel/FunnelTypeSelector";
import { AudienceDiscovery, AudienceData } from "@/components/funnel/AudienceDiscovery";
import { TransformationStep } from "@/components/funnel/TransformationStep";
import { OfferStackBuilder } from "@/components/funnel/OfferStackBuilder";
import { OfferSlotData } from "@/components/funnel/OfferSlotCard";
import { FunnelSummary } from "@/components/funnel/FunnelSummary";
import { FunnelPreview } from "@/components/funnel/FunnelPreview";
import { cn } from "@/lib/utils";

interface FunnelBuilderProps {
  projectId: string;
}

type Step = 'funnel-type' | 'audience' | 'transformation' | 'offers';

const STEPS: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: 'funnel-type', label: 'Funnel Type', icon: Layers },
  { id: 'audience', label: 'Audience', icon: Users },
  { id: 'transformation', label: 'Transformation', icon: Sparkles },
  { id: 'offers', label: 'Offers', icon: Package },
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
  const [transformationStatement, setTransformationStatement] = useState('');
  const [offers, setOffers] = useState<OfferSlotData[]>([]);
  const [completedAssets, setCompletedAssets] = useState<Set<string>>(new Set());
  const [isLoadingCompletions, setIsLoadingCompletions] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

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

  // Fetch project for transformation statement
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('transformation_statement')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  // Fetch asset completions
  const { data: assetCompletions } = useQuery({
    queryKey: ['asset-completions', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funnel_asset_completions')
        .select('asset_id, is_completed')
        .eq('project_id', projectId);

      if (error) throw error;
      return data;
    },
  });

  // Initialize completed assets from database
  useEffect(() => {
    if (assetCompletions) {
      const completedSet = new Set<string>(
        assetCompletions.filter(c => c.is_completed).map(c => c.asset_id)
      );
      setCompletedAssets(completedSet);
      setIsLoadingCompletions(false);
    } else {
      setIsLoadingCompletions(false);
    }
  }, [assetCompletions]);

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
      
      // If we have offers, user has completed setup before
      if (existingOffers && existingOffers.length > 0) {
        setIsSetupComplete(true);
        setIsFirstTimeSetup(false);
      } else if (existingFunnel.funnel_type) {
        setIsFirstTimeSetup(false);
      }
    }
  }, [existingFunnel, existingOffers]);

  // Initialize transformation statement from project
  useEffect(() => {
    if (project?.transformation_statement) {
      setTransformationStatement(project.transformation_statement);
    }
  }, [project]);

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
        isSkipped: false,
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
        isSkipped: false,
      })));
    }
  }, [funnelType, existingOffers]);

  // Calculate step completion status - ALL audience fields are now required
  const stepCompletion = useMemo(() => ({
    'funnel-type': !!funnelType,
    'audience': !!(
      audienceData.niche && 
      audienceData.targetAudience && 
      audienceData.primaryPainPoint && 
      audienceData.desiredOutcome && 
      audienceData.problemStatement
    ),
    'transformation': true, // Optional step - always "complete"
    'offers': offers.some(o => o.isConfigured || o.title || o.isSkipped),
  }), [funnelType, audienceData, offers]);

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

      // Save transformation statement to project
      if (transformationStatement) {
        const { error } = await supabase
          .from('projects')
          .update({ transformation_statement: transformationStatement })
          .eq('id', projectId);
        if (error) throw error;
      }

      // Save offers (only non-skipped)
      const activeOffers = offers.filter(o => !o.isSkipped);
      for (let i = 0; i < activeOffers.length; i++) {
        const offer = activeOffers[i];
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
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      toast.success("Funnel saved successfully!");
      setIsSetupComplete(true);
      setIsFirstTimeSetup(false);
    },
    onError: (error) => {
      console.error("Error saving funnel:", error);
      toast.error("Failed to save funnel");
    },
  });

  const handleFunnelTypeSelect = (type: string) => {
    setFunnelType(type);
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'funnel-type':
        return !!funnelType;
      case 'audience':
        return !!(
          audienceData.niche && 
          audienceData.targetAudience && 
          audienceData.primaryPainPoint && 
          audienceData.desiredOutcome && 
          audienceData.problemStatement
        );
      case 'transformation':
        return true; // Optional step
      case 'offers':
        return offers.some(o => o.isConfigured || o.title || o.isSkipped);
      default:
        return false;
    }
  };

  const canNavigateToStep = (targetStep: Step) => {
    // If not first time setup, allow free navigation
    if (!isFirstTimeSetup) return true;

    const targetIndex = STEPS.findIndex(s => s.id === targetStep);
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);

    // Can always go back
    if (targetIndex <= currentIndex) return true;

    // Can only go forward if all previous steps are complete
    for (let i = 0; i < targetIndex; i++) {
      const stepId = STEPS[i].id;
      if (!stepCompletion[stepId]) return false;
    }
    return true;
  };

  const goToStep = (step: Step) => {
    if (canNavigateToStep(step)) {
      setCurrentStep(step);
      setIsSetupComplete(false);
    }
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

  const handleEditFunnel = () => {
    setIsSetupComplete(false);
    setCurrentStep('funnel-type');
  };

  if (isLoading || isLoadingCompletions) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Show completed summary view
  if (isSetupComplete && funnelType) {
    return (
      <div className="space-y-6">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowPreview(true)}>
            <Eye className="w-4 h-4 mr-2" />
            Preview Funnel
          </Button>
          <Button variant="outline" onClick={handleEditFunnel}>
            Edit Funnel
          </Button>
        </div>
        <FunnelSummary
          funnelType={funnelType}
          audienceData={audienceData}
          transformationStatement={transformationStatement}
          offers={offers}
          completedAssets={completedAssets}
          onEditStep={(step) => goToStep(step as Step)}
        />
        <FunnelPreview
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          funnelType={funnelType}
          offers={offers}
        />
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
            const isComplete = stepCompletion[step.id];
            const canNavigate = canNavigateToStep(step.id);
            const isLocked = isFirstTimeSetup && !canNavigate;
            
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
                  disabled={isLocked}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-lg transition-colors",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : isPast || isComplete
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : isLocked
                          ? "text-muted-foreground/50 cursor-not-allowed"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {isLocked ? (
                    <Lock className="w-4 h-4" />
                  ) : isPast && !isActive && isComplete ? (
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

        {/* Preview Button in header */}
        {funnelType && (
          <Button variant="ghost" size="sm" onClick={() => setShowPreview(true)}>
            <Eye className="w-4 h-4 mr-2" />
            Preview
          </Button>
        )}
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

          {currentStep === 'transformation' && (
            <motion.div
              key="transformation"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <TransformationStep
                audienceData={audienceData}
                transformationStatement={transformationStatement}
                onChange={setTransformationStatement}
                funnelType={funnelType || undefined}
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
                audienceData={audienceData}
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

        <div className="flex items-center gap-2">
          {currentStep !== 'funnel-type' && (
            <Button
              variant="outline"
              onClick={() => saveFunnelMutation.mutate()}
              disabled={saveFunnelMutation.isPending || !funnelType}
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
          )}

          {currentStep !== 'offers' ? (
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

      {/* Preview Dialog */}
      {funnelType && (
        <FunnelPreview
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          funnelType={funnelType}
          offers={offers}
        />
      )}
    </div>
  );
};
