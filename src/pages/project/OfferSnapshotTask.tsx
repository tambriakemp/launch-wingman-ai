import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Clock, Info, Loader2, Check, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTaskEngine } from "@/hooks/useTaskEngine";
import { FUNNEL_CONFIGS, OfferSlotConfig } from "@/data/funnelConfigs";
import { OfferStackBuilder } from "@/components/funnel/OfferStackBuilder";
import { OfferSlotData } from "@/components/funnel/OfferSlotCard";
import { AudienceData } from "@/types/audience";
import { toast } from "sonner";
import { PHASE_LABELS } from "@/types/tasks";
import { getFunnelConfigKey, FUNNEL_TYPE_TO_CONFIG } from "@/lib/funnelUtils";

// Funnel type to friendly description mapping
const FUNNEL_DESCRIPTIONS: Record<string, string> = {
  'content_to_offer': 'Content → Offer: Direct content that leads to your offer',
  'freebie_email_offer': 'Freebie → Email → Offer: Build your list with a lead magnet',
  'live_training_offer': 'Live Training → Offer: Teach something valuable, then invite to join',
  'application_call': 'Application → Call: Qualify leads through applications',
  'membership': 'Membership: Ongoing subscription with continuous value',
  'challenge': 'Challenge: Short, time-bound experience with focused action',
  'launch': 'Launch: Time-bound cart open/close with urgency',
};

export default function OfferSnapshotTask() {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const [offers, setOffersRaw] = useState<OfferSlotData[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Wrapper that auto-computes isConfigured based on title + offerType
  const setOffers = useCallback((newOffers: OfferSlotData[]) => {
    const offersWithAutoConfig = newOffers.map(offer => ({
      ...offer,
      // Auto-compute: configured if has title AND offerType (and not skipped)
      isConfigured: !!(offer.title?.trim() && offer.offerType?.trim()) && !offer.isSkipped,
    }));
    setOffersRaw(offersWithAutoConfig);
  }, []);

  const {
    isLoading: engineLoading,
    getTaskTemplate,
    completeTask,
    projectTasks,
  } = useTaskEngine({ projectId: projectId || "" });

  const taskTemplate = useMemo(() => getTaskTemplate('planning_offer_stack'), [getTaskTemplate]);
  const projectTask = useMemo(() => 
    projectTasks.find(pt => pt.taskId === 'planning_offer_stack'), 
    [projectTasks]
  );

  // Fetch project with selected funnel type - always refetch to get latest funnel type
  const { data: project, isLoading: projectLoading, refetch: refetchProject } = useQuery({
    queryKey: ["project", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("id", projectId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
    refetchOnMount: 'always',
    staleTime: 0,
    refetchOnWindowFocus: true,
  });

  // Force refetch project data on mount to get latest funnel type
  useEffect(() => {
    if (projectId) {
      refetchProject();
    }
  }, [projectId, refetchProject]);

  // Fetch funnel data for audience context
  const { data: funnel } = useQuery({
    queryKey: ["funnel", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funnels")
        .select("*")
        .eq("project_id", projectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Get the funnel config based on selected funnel type
  const selectedFunnelType = project?.selected_funnel_type;
  const funnelConfigKey = getFunnelConfigKey(selectedFunnelType);
  const funnelConfig = funnelConfigKey ? FUNNEL_CONFIGS[funnelConfigKey] : null;

  // Fetch existing offers - scoped to current funnel type
  const { data: existingOffers } = useQuery({
    queryKey: ["offers", projectId, selectedFunnelType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("project_id", projectId)
        .eq("funnel_type", selectedFunnelType)
        .order("slot_position", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!projectId && !!selectedFunnelType,
  });

  // Reset initialization when funnel type changes
  useEffect(() => {
    setIsInitialized(false);
  }, [selectedFunnelType]);

  // Build audience data from funnel
  const audienceData: AudienceData | undefined = funnel ? {
    niche: funnel.niche || '',
    targetAudience: funnel.target_audience || '',
    primaryPainPoint: funnel.primary_pain_point || '',
    desiredOutcome: funnel.desired_outcome || '',
    problemStatement: funnel.problem_statement || '',
    painSymptoms: Array.isArray(funnel.pain_symptoms) 
      ? (funnel.pain_symptoms as unknown as string[]) 
      : [],
    mainObjections: funnel.main_objections || '',
    likelihoodElements: Array.isArray(funnel.likelihood_elements) 
      ? (funnel.likelihood_elements as Array<{ type: string; content: string }>) 
      : [],
    timeEffortElements: Array.isArray(funnel.time_effort_elements) 
      ? (funnel.time_effort_elements as Array<{ type: string; content: string }>) 
      : [],
  } : undefined;

  // Initialize offers from existing data or funnel defaults
  useEffect(() => {
    if (isInitialized) return;
    if (!funnelConfig || !selectedFunnelType) return;

    const expectedSlotTypes = funnelConfig.offerSlots.map(s => s.type);
    
    // existingOffers is already filtered by funnel_type from the query
    const existingSlotTypes = existingOffers?.map(o => o.slot_type) || [];
    
    // Check if we have matching offers for this funnel type
    const hasMatchingOffers = 
      expectedSlotTypes.length === existingSlotTypes.length &&
      expectedSlotTypes.every(type => existingSlotTypes.includes(type)) &&
      existingSlotTypes.every(type => expectedSlotTypes.includes(type));

    if (existingOffers && existingOffers.length > 0 && hasMatchingOffers) {
      // Load existing offers for this funnel type
      const loadedOffers: OfferSlotData[] = existingOffers.map(o => ({
        id: o.id,
        slotType: o.slot_type,
        title: o.title || '',
        description: o.description || '',
        offerType: o.offer_type,
        price: o.price?.toString() || '',
        priceType: o.price_type || 'one-time',
        isConfigured: !!(o.title && o.offer_type),
        isSkipped: false,
      }));
      setOffers(loadedOffers);
    } else {
      // No matching offers - create defaults for this funnel type
      const defaultOffers: OfferSlotData[] = funnelConfig.offerSlots.map((slot: OfferSlotConfig) => ({
        slotType: slot.type,
        title: '',
        description: '',
        offerType: '',
        price: '',
        priceType: slot.priceRange === 'Free' ? 'free' : 'one-time',
        isConfigured: false,
        isSkipped: false,
      }));
      setOffers(defaultOffers);
    }
    setIsInitialized(true);
  }, [existingOffers, funnelConfig, isInitialized, selectedFunnelType]);

  // Save offers to database (scoped to current funnel type)
  const saveOffersToDb = useCallback(async (offersToSave: OfferSlotData[]) => {
    if (!projectId || !user || offersToSave.length === 0 || !selectedFunnelType) return;

    setAutoSaveStatus('saving');

    try {
      // Delete only offers for the current funnel type (preserve other funnel's offers)
      const { error: deleteError } = await supabase
        .from("offers")
        .delete()
        .eq("project_id", projectId)
        .eq("user_id", user.id)
        .eq("funnel_type", selectedFunnelType);

      if (deleteError) throw deleteError;

      // Insert new offers with funnel_type tag
      const offersToInsert = offersToSave.map((offer, index) => ({
        project_id: projectId,
        user_id: user.id,
        slot_type: offer.slotType,
        slot_position: index,
        title: offer.title?.trim() ? offer.title.trim() : null,
        description: offer.description?.trim() ? offer.description.trim() : null,
        // Keep required column non-null, but don't force a fake configured value
        offer_type: offer.offerType?.trim() ? offer.offerType.trim() : "",
        offer_category: offer.slotType,
        niche: audienceData?.niche || 'General',
        price: offer.price ? parseFloat(offer.price) : null,
        price_type: offer.priceType || 'one-time',
        is_required: funnelConfig?.offerSlots.find(s => s.type === offer.slotType)?.isRequired ?? true,
        funnel_id: funnel?.id || null,
        funnel_type: selectedFunnelType, // Tag with current funnel type
        target_audience: audienceData?.targetAudience || null,
        primary_pain_point: audienceData?.primaryPainPoint || null,
        desired_outcome: audienceData?.desiredOutcome || null,
      }));

      const { error: insertError } = await supabase.from("offers").insert(offersToInsert);
      if (insertError) throw insertError;

      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    } catch (error) {
      console.error("Save error:", error);
      setAutoSaveStatus('idle');
      throw error;
    }
  }, [projectId, user, audienceData, funnelConfig, funnel, selectedFunnelType]);

  // Auto-save wrapper
  const performSave = useCallback(async () => {
    try {
      await saveOffersToDb(offers);
    } catch {
      // keep autosave silent
    }
  }, [offers, saveOffersToDb]);

  // Debounced auto-save
  useEffect(() => {
    if (!isInitialized || offers.length === 0) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(performSave, 1500);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [offers, isInitialized, performSave]);

  const handleComplete = async () => {
    // Check if at least one offer is defined
    const configuredOffers = offers.filter(o => o.title && o.offerType && !o.isSkipped);
    
    if (configuredOffers.length === 0) {
      toast.error("Please configure at least one offer before continuing");
      return;
    }

    setIsSaving(true);
    try {
      await saveOffersToDb(offers);
      await completeTask('planning_offer_stack', { offers: offers.filter(o => !o.isSkipped) });
      
      toast.success("Offer stack saved! Your offer ecosystem is taking shape.");
      navigate(`/projects/${projectId}/offer`);
    } catch (error) {
      console.error("Complete error:", error);
      toast.error("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveForLater = async () => {
    setIsSaving(true);
    try {
      await saveOffersToDb(offers);
      toast.success("Progress saved!");
      navigate(`/projects/${projectId}/offer`);
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  if (engineLoading || projectLoading || !project || !taskTemplate) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  // If no funnel type selected, redirect back
  if (!selectedFunnelType) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <Link
            to={`/projects/${projectId}/offer`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          <div className="p-6 rounded-xl bg-muted/50 border border-border text-center">
            <Info className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
            <h2 className="text-lg font-medium mb-2">No Launch Path Selected</h2>
            <p className="text-muted-foreground mb-4">
              Please complete the "Choose how you'll sell your offer" task first.
            </p>
            <Button onClick={() => navigate(`/projects/${projectId}/offer`)}>
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const phaseLabel = PHASE_LABELS[taskTemplate.phase] || taskTemplate.phase;
  const timeRange = `${taskTemplate.estimatedMinutesMin}–${taskTemplate.estimatedMinutesMax} minutes`;
  const configuredCount = offers.filter(o => o.isConfigured && !o.isSkipped).length;
  const activeOffers = offers.filter(o => !o.isSkipped);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <Link
            to={`/projects/${projectId}/offer`}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium">
              {phaseLabel} Phase
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Estimated time: {timeRange}
            </span>
            {autoSaveStatus !== 'idle' && (
              <span className="ml-auto text-xs flex items-center gap-1">
                {autoSaveStatus === 'saving' && (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Saving...
                  </>
                )}
                {autoSaveStatus === 'saved' && (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    Saved
                  </>
                )}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
            {taskTemplate.title}
          </h1>
        </div>

        {/* Why This Matters */}
        <section className="mb-8">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-3">
            Why this matters
          </h2>
          <p className="text-foreground/80 leading-relaxed">
            {taskTemplate.whyItMatters}
          </p>
        </section>

        <div className="h-px bg-border mb-8" />

        {/* Funnel Context Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-4 rounded-xl bg-primary/5 border border-primary/20"
        >
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-foreground mb-1">
                Your selected path: {FUNNEL_DESCRIPTIONS[selectedFunnelType] || selectedFunnelType}
              </p>
              <p className="text-sm text-muted-foreground">
                We've suggested offer slots based on this path. These are patterns, not requirements — 
                customize them to fit your strategy.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Offer Stack Builder */}
        {funnelConfig && (
          <OfferStackBuilder
            funnelType={funnelConfigKey!}
            offers={offers}
            onChange={setOffers}
            audienceData={audienceData}
            onSaveNow={saveOffersToDb}
          />
        )}

        {/* Completion Status */}
        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{configuredCount}</span>
              /{activeOffers.length} offers configured
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handleComplete}
              className="flex-1"
              disabled={configuredCount === 0 || isSaving}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Save & Continue
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              onClick={handleSaveForLater}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save for Later"}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            You can always come back and adjust your offers later.
          </p>
        </div>
      </div>
    </div>
  );
}
