import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { OfferStackBuilder } from "@/components/funnel/OfferStackBuilder";
import { OfferSlotData } from "@/components/funnel/OfferSlotCard";
import { FUNNEL_CONFIGS } from "@/data/funnelConfigs";
import { AudienceData } from "@/types/audience";
import { FunnelEmptyState } from "@/components/funnel/FunnelEmptyState";
import { toast } from "sonner";

interface Props {
  projectId: string;
}

const OfferOverviewContent = ({ projectId }: Props) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch project
  const { data: project, isLoading: projectLoading } = useQuery({
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
  });

  // Fetch funnel data
  const { data: funnel, isLoading: funnelLoading } = useQuery({
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

  // Fetch offers
  const { data: offers, isLoading: offersLoading } = useQuery({
    queryKey: ["offers", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("project_id", projectId)
        .order("slot_position", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });

  // Mutation to save offers
  const saveOffersMutation = useMutation({
    mutationFn: async (updatedOffers: OfferSlotData[]) => {
      if (!user?.id) throw new Error("Not authenticated");

      // Delete existing offers and insert new ones
      await supabase.from("offers").delete().eq("project_id", projectId);

      const offersToInsert = updatedOffers.map((offer, index) => ({
        project_id: projectId,
        user_id: user.id,
        slot_type: offer.slotType,
        slot_position: index,
        title: offer.title || null,
        description: offer.description || null,
        offer_type: offer.offerType || "other",
        offer_category: offer.offerType || "other",
        niche: funnel?.niche || "general",
        price: offer.price ? parseFloat(offer.price) : null,
        price_type: offer.priceType || "one-time",
        is_required: false,
        funnel_id: funnel?.id || null,
      }));

      if (offersToInsert.length > 0) {
        const { error } = await supabase.from("offers").insert(offersToInsert);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["offers", projectId] });
      toast.success("Offers saved");
    },
    onError: () => {
      toast.error("Failed to save offers");
    },
  });

  const isLoading = projectLoading || funnelLoading || offersLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const funnelType = funnel?.funnel_type || project?.selected_funnel_type;
  const funnelConfig = funnelType ? FUNNEL_CONFIGS[funnelType] : null;

  // If no funnel type selected, show empty state
  if (!funnelType || !funnelConfig) {
    return (
      <div className="max-w-4xl mx-auto py-6 px-4">
        <FunnelEmptyState onCreateFunnel={() => navigate(`/projects/${projectId}/playbook`)} />
      </div>
    );
  }

  // Convert DB offers to OfferSlotData format
  const offerSlotData: OfferSlotData[] = offers?.length
    ? offers.map((o) => ({
        slotType: o.slot_type || "core", // Defensive: ensure slotType is never undefined
        title: o.title || "",
        description: o.description || "",
        offerType: o.offer_type || "",
        price: o.price?.toString() || "",
        priceType: (o.price_type as OfferSlotData["priceType"]) || "one-time",
        isConfigured: !!(o.title || o.offer_type),
        isSkipped: false,
        isRequired: o.is_required,
      }))
    : funnelConfig.offerSlots.map((slot) => ({
        slotType: slot.type,
        title: "",
        description: "",
        offerType: "",
        price: slot.priceRange || "",
        priceType: "one-time" as const,
        isConfigured: false,
        isSkipped: false,
        isRequired: slot.isRequired,
      }));

  const audienceData: AudienceData = {
    niche: funnel?.niche || "",
    targetAudience: funnel?.target_audience || "",
    primaryPainPoint: funnel?.primary_pain_point || "",
    desiredOutcome: funnel?.desired_outcome || "",
    problemStatement: funnel?.problem_statement || "",
  };

  const handleOffersChange = (updated: OfferSlotData[]) => {
    saveOffersMutation.mutate(updated);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-6 px-4">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Offer Stack</h1>
        <p className="text-muted-foreground">
          Configure your offers for {project?.name || "this project"}.
        </p>
      </div>

      <OfferStackBuilder
        funnelType={funnelType}
        offers={offerSlotData}
        onChange={handleOffersChange}
        audienceData={audienceData}
        onSaveNow={handleOffersChange}
      />
    </div>
  );
};

export default OfferOverviewContent;
