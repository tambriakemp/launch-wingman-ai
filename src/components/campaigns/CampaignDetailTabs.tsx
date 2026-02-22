import { Campaign } from "@/types/campaign";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SummaryTab from "./tabs/SummaryTab";
import LinksTab from "./tabs/LinksTab";
import AssetsTab from "./tabs/AssetsTab";
import FunnelTab from "./tabs/FunnelTab";
import AnalyticsTab from "./tabs/AnalyticsTab";
import NotesTab from "./tabs/NotesTab";
import PixelTab from "./tabs/PixelTab";
import { LayoutDashboard, Link2, Image, GitBranch, BarChart3, StickyNote, Crosshair } from "lucide-react";

interface Props {
  campaign: Campaign;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabItems = [
  { id: "summary", label: "Summary", icon: LayoutDashboard },
  { id: "links", label: "Links", icon: Link2 },
  { id: "pixel", label: "Pixel", icon: Crosshair },
  { id: "assets", label: "Assets", icon: Image },
  { id: "funnel", label: "Funnel", icon: GitBranch },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "notes", label: "Notes", icon: StickyNote },
];

export default function CampaignDetailTabs({ campaign, activeTab, onTabChange }: Props) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange}>
      {/* Mobile/Tablet: scrollable tab pills — hidden on lg where sidebar takes over */}
      <TabsList className="lg:hidden flex overflow-x-auto w-full justify-start rounded-none px-0 h-auto gap-1 bg-transparent border-b pb-2 mb-2">
        {tabItems.map((t) => (
          <TabsTrigger
            key={t.id}
            value={t.id}
            className="shrink-0 rounded-full border border-border/50 px-3 py-1.5 text-xs gap-1.5 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:border-primary data-[state=active]:shadow-none"
          >
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>

      <TabsContent value="summary" className="mt-0"><SummaryTab campaign={campaign} /></TabsContent>
      <TabsContent value="links" className="mt-0"><LinksTab campaignId={campaign.id} campaignName={campaign.name} /></TabsContent>
      <TabsContent value="pixel" className="mt-0"><PixelTab campaign={campaign} /></TabsContent>
      <TabsContent value="assets" className="mt-0"><AssetsTab campaignId={campaign.id} /></TabsContent>
      <TabsContent value="funnel" className="mt-0"><FunnelTab /></TabsContent>
      <TabsContent value="analytics" className="mt-0"><AnalyticsTab campaign={campaign} /></TabsContent>
      <TabsContent value="notes" className="mt-0"><NotesTab campaignId={campaign.id} /></TabsContent>
    </Tabs>
  );
}
