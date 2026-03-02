import { useState } from "react";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import CampaignOverviewCards from "@/components/campaigns/CampaignOverviewCards";
import CampaignTable from "@/components/campaigns/CampaignTable";
import CampaignTimelineView from "@/components/campaigns/CampaignTimelineView";
import NewCampaignModal from "@/components/campaigns/NewCampaignModal";
import { Button } from "@/components/ui/button";
import { LayoutList, GanttChart, Megaphone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Campaign } from "@/types/campaign";

export default function CampaignPlanner() {
  const { user } = useAuth();
  const [view, setView] = useState<"table" | "timeline">("table");
  const [showModal, setShowModal] = useState(false);

  const { data: dbCampaigns } = useQuery({
    queryKey: ["campaigns", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user?.id,
  });

  // Fetch conversions for all user campaigns
  const campaignIds = (dbCampaigns ?? []).map((c) => c.id);
  const { data: conversions } = useQuery({
    queryKey: ["campaign_conversions", campaignIds],
    queryFn: async () => {
      if (campaignIds.length === 0) return [];
      const { data, error } = await supabase
        .from("campaign_conversions")
        .select("campaign_id, revenue")
        .in("campaign_id", campaignIds);
      if (error) throw error;
      return data ?? [];
    },
    enabled: campaignIds.length > 0,
  });

  // Aggregate conversions by campaign_id
  const conversionMap = new Map<string, { leads: number; revenue: number }>();
  (conversions ?? []).forEach((c) => {
    const existing = conversionMap.get(c.campaign_id) ?? { leads: 0, revenue: 0 };
    existing.leads += 1;
    existing.revenue += Number(c.revenue ?? 0);
    conversionMap.set(c.campaign_id, existing);
  });

  // Build enriched campaigns
  const allCampaigns: Campaign[] = (dbCampaigns ?? []).map((c: any): Campaign => {
    const conv = conversionMap.get(c.id) ?? { leads: 0, revenue: 0 };
    const budget = Number(c.budget) || 0;
    const roi = budget > 0 ? Math.round((conv.revenue / budget) * 100) : 0;
    return {
      id: c.id,
      name: c.name,
      goal: c.goal,
      status: c.status,
      start_date: c.start_date,
      end_date: c.end_date,
      budget: c.budget,
      tags: c.tags ?? [],
      leads: conv.leads,
      revenue: conv.revenue,
      roi,
      conversion_rate: 0,
      created_at: c.created_at,
      updated_at: c.updated_at,
      sparkline_data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      goal_target: Number(c.goal_target) || 0,
    };
  });

  return (
    <ProjectLayout>
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        <div className="flex items-start gap-4 mb-8">
          <div className="p-3 bg-emerald-100/50 dark:bg-emerald-900/20 rounded-xl shrink-0">
            <Megaphone className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Campaigns</h1>
            <p className="text-muted-foreground">Track, measure, and optimize every marketing campaign.</p>
          </div>
        </div>

        <CampaignOverviewCards campaigns={allCampaigns} />

        {/* View toggle */}
        <div className="flex items-center gap-1 border rounded-md w-fit p-0.5">
          <Button variant={view === "table" ? "secondary" : "ghost"} size="sm" className="gap-1.5 h-7 text-xs" onClick={() => setView("table")}>
            <LayoutList className="w-3.5 h-3.5" /> Table
          </Button>
          <Button variant={view === "timeline" ? "secondary" : "ghost"} size="sm" className="gap-1.5 h-7 text-xs" onClick={() => setView("timeline")}>
            <GanttChart className="w-3.5 h-3.5" /> Timeline
          </Button>
        </div>

        {view === "table" ? (
          <CampaignTable campaigns={allCampaigns} onNewCampaign={() => setShowModal(true)} />
        ) : (
          <CampaignTimelineView campaigns={allCampaigns} />
        )}

        <NewCampaignModal open={showModal} onOpenChange={setShowModal} />
      </div>
    </ProjectLayout>
  );
}
