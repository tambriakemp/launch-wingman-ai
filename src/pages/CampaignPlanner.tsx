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

export default function CampaignPlanner() {
  const [view, setView] = useState<"table" | "timeline">("table");
  const [showModal, setShowModal] = useState(false);

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
          <CampaignTable campaigns={demoCampaigns} onNewCampaign={() => setShowModal(true)} />
        ) : (
          <CampaignTimelineView campaigns={demoCampaigns} />
        )}

        <NewCampaignModal open={showModal} onOpenChange={setShowModal} />
      </div>
    </ProjectLayout>
  );
}
