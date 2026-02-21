import { useState } from "react";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import CampaignOverviewCards from "@/components/campaigns/CampaignOverviewCards";
import CampaignTable from "@/components/campaigns/CampaignTable";
import CampaignTimelineView from "@/components/campaigns/CampaignTimelineView";
import NewCampaignModal from "@/components/campaigns/NewCampaignModal";
import { demoCampaigns } from "@/components/campaigns/campaignDemoData";
import { Button } from "@/components/ui/button";
import { LayoutList, GanttChart } from "lucide-react";
import { cn } from "@/lib/utils";
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
      return (data ?? []).map((c: any): Campaign => ({
        id: c.id,
        name: c.name,
        goal: c.goal,
        status: c.status,
        start_date: c.start_date,
        end_date: c.end_date,
        budget: c.budget,
        tags: c.tags ?? [],
        leads: 0,
        revenue: 0,
        roi: 0,
        conversion_rate: 0,
        created_at: c.created_at,
        updated_at: c.updated_at,
        sparkline_data: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      }));
    },
    enabled: !!user?.id,
  });

  const allCampaigns = [...(dbCampaigns ?? []), ...demoCampaigns];

  return (
    <ProjectLayout>
      <div className="space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Campaigns</h1>
            <p className="text-sm text-muted-foreground">Track, measure, and optimize every marketing campaign.</p>
          </div>
        </div>

        <CampaignOverviewCards />

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
