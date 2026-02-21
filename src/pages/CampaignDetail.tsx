import { useParams } from "react-router-dom";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import CampaignDetailHeader from "@/components/campaigns/CampaignDetailHeader";
import CampaignDetailTabs from "@/components/campaigns/CampaignDetailTabs";
import { demoCampaigns } from "@/components/campaigns/campaignDemoData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Campaign } from "@/types/campaign";
import { Loader2 } from "lucide-react";

export default function CampaignDetail() {
  const { campaignId } = useParams();
  const { user } = useAuth();

  const { data: dbCampaign, isLoading } = useQuery({
    queryKey: ["campaign-detail", campaignId],
    queryFn: async () => {
      if (!user?.id || !campaignId) return null;
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", campaignId)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const c: Campaign = {
        id: data.id,
        name: data.name,
        goal: data.goal as any,
        status: data.status as any,
        start_date: data.start_date,
        end_date: data.end_date,
        budget: data.budget,
        tags: data.tags ?? [],
        leads: 0,
        revenue: 0,
        roi: 0,
        conversion_rate: 0,
        created_at: data.created_at,
        updated_at: data.updated_at,
        sparkline_data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      };
      return c;
    },
    enabled: !!user?.id && !!campaignId,
  });

  // Check demo data as fallback
  const demoCampaign = demoCampaigns.find((c) => c.id === campaignId);
  const campaign = dbCampaign ?? demoCampaign;

  if (isLoading) {
    return (
      <ProjectLayout>
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      </ProjectLayout>
    );
  }

  if (!campaign) {
    return (
      <ProjectLayout>
        <div className="p-6 text-center">
          <h1 className="text-xl font-bold">Campaign not found</h1>
          <p className="text-muted-foreground mt-1">The campaign you're looking for doesn't exist.</p>
        </div>
      </ProjectLayout>
    );
  }

  return (
    <ProjectLayout>
      <div className="p-4 md:p-6">
        <CampaignDetailHeader campaign={campaign} />
        <CampaignDetailTabs campaign={campaign} />
      </div>
    </ProjectLayout>
  );
}
