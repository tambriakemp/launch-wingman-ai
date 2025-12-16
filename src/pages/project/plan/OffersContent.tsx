import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { OfferStackBuilder } from "@/components/funnel/OfferStackBuilder";
import { OfferSlotData } from "@/components/funnel/OfferSlotCard";
import { AudienceData } from "@/components/funnel/AudienceDiscovery";
import { PlanPageHeader } from "@/components/PlanPageHeader";
import { FUNNEL_CONFIGS } from "@/data/funnelConfigs";
import { useState, useEffect } from "react";

// Map asset categories to task phases
const ASSET_PHASE_MAP: Record<string, string> = {
  'pages': 'technical',
  'emails': 'emails',
  'content': 'prelaunch',
  'deliverables': 'delivery',
};

// Map asset categories to task labels
const ASSET_LABEL_MAP: Record<string, string[]> = {
  'pages': ['technical'],
  'emails': ['copy'],
  'content': ['creative', 'marketing'],
  'deliverables': ['creative'],
};

interface Props {
  projectId: string;
}

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
    }
  }, [funnel?.funnel_type, existingOffers]);

  // Generate tasks from funnel assets
  const generateTasksFromFunnel = async (funnelTypeKey: string) => {
    if (!user || !projectId) return;
    
    const config = FUNNEL_CONFIGS[funnelTypeKey];
    if (!config) return;

    // Check if there are already tasks for this project
    const { data: existingTasks } = await supabase
      .from('tasks')
      .select('id')
      .eq('project_id', projectId)
      .limit(1);

    // Only generate tasks if none exist
    if (existingTasks && existingTasks.length > 0) return;

    const tasksToInsert = config.assets
      .filter(asset => {
        if (!asset.offerSlotType) return true;
        return offers.some(offer => 
          offer.slotType === asset.offerSlotType && 
          !offer.isSkipped &&
          (offer.isConfigured || offer.title)
        );
      })
      .map((asset, index) => {
        const relatedOffer = asset.offerSlotType 
          ? offers.find(o => o.slotType === asset.offerSlotType && !o.isSkipped)
          : null;
        
        const description = relatedOffer?.title 
          ? `${asset.description} • ${relatedOffer.title}`
          : asset.description;

        return {
          project_id: projectId,
          user_id: user.id,
          title: asset.title,
          description: description,
          column_id: 'todo',
          phase: ASSET_PHASE_MAP[asset.category] || null,
          labels: ASSET_LABEL_MAP[asset.category] || [],
          position: index,
        };
      });

    if (tasksToInsert.length > 0) {
      const { error } = await supabase.from('tasks').insert(tasksToInsert);
      if (error) {
        console.error('Error generating tasks:', error);
      }
    }
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (completeSetup: boolean = false) => {
      if (!user || !projectId || !funnel) throw new Error("Missing required data");

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
          const { error } = await supabase
            .from('offers')
            .insert(offerData);
          if (error) throw error;
        }
      }

      // Generate tasks if completing setup
      if (completeSetup && funnel.funnel_type) {
        await generateTasksFromFunnel(funnel.funnel_type);
        
        // Update funnel_type_snapshot on the project
        await supabase
          .from('projects')
          .update({ funnel_type_snapshot: funnel.funnel_type })
          .eq('id', projectId);
      }
    },
    onSuccess: (_, completeSetup) => {
      queryClient.invalidateQueries({ queryKey: ['funnel-offers', projectId] });
      if (completeSetup) {
        navigate(`/projects/${projectId}/offer`);
      }
    },
    onError: (error) => {
      console.error("Error saving:", error);
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No funnel or funnel type - redirect to funnel type
  if (!funnel || !funnel.funnel_type) {
    navigate(`/projects/${projectId}/funnel-type`, { replace: true });
    return null;
  }

  // Audience not complete - redirect to audience
  if (!funnel.niche || !funnel.target_audience) {
    navigate(`/projects/${projectId}/audience`, { replace: true });
    return null;
  }

  const hasConfiguredOffers = offers.some(o => o.isConfigured || o.title || o.isSkipped);

  return (
    <div className="space-y-6 max-w-3xl">
      <PlanPageHeader
        title="Offer Stack"
        description="Configure each offer in your funnel"
      />

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

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => saveMutation.mutate(false)}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save
          </Button>
          <Button
            onClick={() => saveMutation.mutate(true)}
            disabled={!hasConfiguredOffers || saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Complete Setup
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default OffersContent;
