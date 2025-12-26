import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { OfferStackBuilder } from "@/components/funnel/OfferStackBuilder";
import { OfferSlotData } from "@/components/funnel/OfferSlotCard";
import { AudienceData } from "@/components/funnel/AudienceDiscovery";
import { PlanPageHeader } from "@/components/PlanPageHeader";
import { FUNNEL_CONFIGS } from "@/data/funnelConfigs";
import { useState, useEffect, useRef, useCallback } from "react";

interface Props {
  projectId: string;
}

type SaveStatus = 'idle' | 'saving' | 'saved';

const OffersContent = ({ projectId }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [offers, setOffers] = useState<OfferSlotData[]>([]);
  const [audienceData, setAudienceData] = useState<AudienceData>({
    niche: '',
    targetAudience: '',
    primaryPainPoint: '',
    desiredOutcome: '',
    problemStatement: '',
    painSymptoms: [],
    mainObjections: '',
    likelihoodElements: [],
    timeEffortElements: [],
  });

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [isInitialized, setIsInitialized] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const statusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch funnel
  const { data: funnel, isLoading } = useQuery({
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
    enabled: !!projectId,
  });

  // Fetch existing offers
  const { data: existingOffers } = useQuery({
    queryKey: ['funnel-offers', projectId],
    queryFn: async () => {
      if (!funnel?.id) return [];
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('funnel_id', funnel.id)
        .order('slot_position');
      if (error) throw error;
      return data;
    },
    enabled: !!funnel?.id,
  });

  // Initialize from existing data
  useEffect(() => {
    if (funnel) {
      setAudienceData({
        niche: funnel.niche || '',
        targetAudience: funnel.target_audience || '',
        primaryPainPoint: funnel.primary_pain_point || '',
        desiredOutcome: funnel.desired_outcome || '',
        problemStatement: funnel.problem_statement || '',
        painSymptoms: (funnel.pain_symptoms as string[]) || [],
        mainObjections: funnel.main_objections || '',
        likelihoodElements: (funnel.likelihood_elements as Array<{ type: string; content: string }>) || [],
        timeEffortElements: (funnel.time_effort_elements as Array<{ type: string; content: string }>) || [],
      });
    }
  }, [funnel]);

  // Initialize offers
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
      setTimeout(() => setIsInitialized(true), 100);
    } else if (funnel?.funnel_type && FUNNEL_CONFIGS[funnel.funnel_type]) {
      const config = FUNNEL_CONFIGS[funnel.funnel_type];
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
      setTimeout(() => setIsInitialized(true), 100);
    }
  }, [funnel?.funnel_type, existingOffers]);

  // Auto-save function
  const performSave = useCallback(async () => {
    if (!user || !projectId || !funnel) return;

    setSaveStatus('saving');

    try {
      // Save offers (only non-skipped)
      const activeOffers = offers.filter(o => !o.isSkipped);
      for (let i = 0; i < activeOffers.length; i++) {
        const offer = activeOffers[i];
        const offerData = {
          project_id: projectId,
          user_id: user.id,
          funnel_id: funnel.id,
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
          is_required: FUNNEL_CONFIGS[funnel.funnel_type]?.offerSlots.find(s => s.type === offer.slotType)?.isRequired ?? false,
        };

        if (offer.id) {
          const { error } = await supabase
            .from('offers')
            .update(offerData)
            .eq('id', offer.id);
          if (error) throw error;
        } else {
          const { data: inserted, error } = await supabase
            .from('offers')
            .insert(offerData)
            .select('id')
            .single();
          if (error) throw error;
          // Update local state with new ID
          if (inserted) {
            setOffers(prev => prev.map(o => 
              o.slotType === offer.slotType && !o.id ? { ...o, id: inserted.id } : o
            ));
          }
        }
      }

      setSaveStatus('saved');
      queryClient.invalidateQueries({ queryKey: ['funnel-offers', projectId] });

      // Reset to idle after 2 seconds
      statusTimeoutRef.current = setTimeout(() => {
        setSaveStatus('idle');
      }, 2000);
    } catch (error) {
      console.error("Error auto-saving:", error);
      setSaveStatus('idle');
    }
  }, [offers, funnel, projectId, user, audienceData, queryClient]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!isInitialized || !funnel) return;

    // Clear existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    if (statusTimeoutRef.current) {
      clearTimeout(statusTimeoutRef.current);
    }

    // Set new timeout for auto-save (1.5 seconds)
    saveTimeoutRef.current = setTimeout(() => {
      performSave();
    }, 1500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [offers, isInitialized, funnel, performSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
    };
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No funnel - redirect to dashboard
  if (!funnel) {
    navigate(`/projects/${projectId}/offer`, { replace: true });
    return null;
  }

  // Audience not complete - redirect to audience
  if (!funnel.niche || !funnel.target_audience) {
    navigate(`/projects/${projectId}/audience`, { replace: true });
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Header with Save Status */}
      <div className="flex items-start justify-between">
        <PlanPageHeader
          title="Offer Stack"
          description="Each offer in your funnel has a job - some build trust, some generate revenue, some maximize lifetime value."
          whyItMatters="A well-designed offer stack guides customers through a natural journey from free to paid, increasing both conversions and revenue per customer."
          estimatedTime="10-15 min"
          tipText="Start with your core offer, then work backwards. What free content would attract your ideal customer? What upsell would help them succeed faster?"
        />
        {/* Auto-save Status Indicator */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-[100px] justify-end">
          {saveStatus === 'saving' && (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving...</span>
            </>
          )}
          {saveStatus === 'saved' && (
            <>
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-green-500">Saved</span>
            </>
          )}
        </div>
      </div>

      {/* Offer Stack Builder */}
      <OfferStackBuilder
        funnelType={funnel.funnel_type}
        offers={offers}
        onChange={setOffers}
        audienceData={audienceData}
      />

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={() => navigate(`/projects/${projectId}/transformation`)}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Transformation
        </Button>

        <Button onClick={() => navigate(`/projects/${projectId}/tech-stack`)}>
          Continue
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default OffersContent;