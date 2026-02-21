import { Campaign } from "@/types/campaign";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import SummaryTab from "./tabs/SummaryTab";
import LinksTab from "./tabs/LinksTab";
import AssetsTab from "./tabs/AssetsTab";
import FunnelTab from "./tabs/FunnelTab";
import AnalyticsTab from "./tabs/AnalyticsTab";
import NotesTab from "./tabs/NotesTab";

interface Props {
  campaign: Campaign;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function CampaignDetailTabs({ campaign, activeTab, onTabChange }: Props) {
  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="mt-6">
      <TabsList className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b w-full justify-start rounded-none px-0 h-auto gap-0">
        {["summary", "links", "assets", "funnel", "analytics", "notes"].map((t) => (
          <TabsTrigger key={t} value={t} className="capitalize rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-2.5 text-sm">
            {t}
          </TabsTrigger>
        ))}
      </TabsList>
      <TabsContent value="summary"><SummaryTab campaign={campaign} /></TabsContent>
      <TabsContent value="links"><LinksTab campaignId={campaign.id} campaignName={campaign.name} /></TabsContent>
      <TabsContent value="assets"><AssetsTab campaignId={campaign.id} /></TabsContent>
      <TabsContent value="funnel"><FunnelTab /></TabsContent>
      <TabsContent value="analytics"><AnalyticsTab campaign={campaign} /></TabsContent>
      <TabsContent value="notes"><NotesTab campaignId={campaign.id} /></TabsContent>
    </Tabs>
  );
}
