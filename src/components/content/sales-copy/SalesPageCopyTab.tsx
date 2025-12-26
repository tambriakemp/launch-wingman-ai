import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PlanPageHeader } from "@/components/PlanPageHeader";
import { OfferSelector } from "./OfferSelector";
import { FunnelContextDisplay } from "./FunnelContextDisplay";
import { SectionList } from "./SectionList";
import { SectionEditor } from "./SectionEditor";
import { getSectionsForOffer, type OfferForCopy, type SalesCopySection, type SectionDraft } from "./types";
import { getFunnelConfig } from "@/lib/funnelUtils";
import type { Json } from "@/integrations/supabase/types";

interface SalesPageCopyTabProps {
  projectId: string;
}

export const SalesPageCopyTab = ({ projectId }: SalesPageCopyTabProps) => {
  const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);
  const [editingSection, setEditingSection] = useState<SalesCopySection | null>(null);

  // Fetch project data
  const { data: project } = useQuery({
    queryKey: ["project-for-sales-copy", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("selected_funnel_type, transformation_statement")
        .eq("id", projectId)
        .single();
      if (error) throw error;
      return data;
    },
  });

  // Fetch funnel data
  const { data: funnel } = useQuery({
    queryKey: ["funnel-for-sales-copy", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funnels")
        .select("target_audience, desired_outcome, primary_pain_point, niche, problem_statement")
        .eq("project_id", projectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Fetch offers
  const { data: offers = [] } = useQuery({
    queryKey: ["offers-for-copy", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("offers")
        .select("*")
        .eq("project_id", projectId)
        .order("slot_position");
      if (error) throw error;
      return (data || []).map(o => ({
        id: o.id,
        title: o.title,
        slotType: o.slot_type,
        slotPosition: o.slot_position,
        price: o.price,
        priceType: o.price_type,
        offerType: o.offer_type,
        niche: o.niche,
        targetAudience: o.target_audience,
        desiredOutcome: o.desired_outcome,
        primaryPainPoint: o.primary_pain_point,
        mainDeliverables: o.main_deliverables,
        transformationStatement: o.transformation_statement,
      })) as OfferForCopy[];
    },
  });

  // Fetch existing sales copy for this project
  const { data: existingCopy = [] } = useQuery({
    queryKey: ["sales-copy-content", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sales_page_copy")
        .select("*")
        .eq("project_id", projectId);
      if (error) throw error;
      return data || [];
    },
  });

  const funnelConfig = getFunnelConfig(project?.selected_funnel_type);
  const selectedOffer = offers.find(o => o.id === selectedOfferId);
  const sections = selectedOffer ? getSectionsForOffer(selectedOffer.slotType, selectedOffer.price) : [];

  // Get draft data for selected offer
  const offerCopyRecord = existingCopy.find(c => c.deliverable_id === selectedOfferId);
  const sectionDrafts: Record<string, SectionDraft> = (offerCopyRecord?.sections as unknown as Record<string, SectionDraft>) || {};

  const handleSelectOffer = (offerId: string) => {
    setSelectedOfferId(offerId);
    setEditingSection(null);
  };

  const handleEditSection = (section: SalesCopySection) => {
    setEditingSection(section);
  };

  const handleCloseEditor = () => {
    setEditingSection(null);
  };

  if (editingSection && selectedOffer) {
    return (
      <SectionEditor
        projectId={projectId}
        section={editingSection}
        offer={selectedOffer}
        draft={sectionDrafts[editingSection.id]}
        funnel={funnel}
        transformationStatement={project?.transformation_statement}
        onClose={handleCloseEditor}
      />
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Header */}
      <PlanPageHeader
        title="Sales Page Copy"
        description="Write your sales page one section at a time, based on your funnel and offers."
        tipText="This is guidance — not a template. You can skip or rewrite anything."
      />

      {/* Context Display */}
      {funnelConfig && offers.length > 0 && (
        <FunnelContextDisplay 
          funnelConfig={funnelConfig} 
          offers={offers} 
        />
      )}

      {/* Offer Selection or Section List */}
      {!selectedOfferId ? (
        <OfferSelector 
          offers={offers} 
          existingCopy={existingCopy}
          onSelect={handleSelectOffer} 
        />
      ) : (
        <SectionList
          sections={sections}
          drafts={sectionDrafts}
          offer={selectedOffer!}
          onEditSection={handleEditSection}
          onBack={() => setSelectedOfferId(null)}
        />
      )}
    </div>
  );
};
