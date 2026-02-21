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
}

export default function CampaignDetailTabs({ campaign }: Props) {
  return (
    <Tabs defaultValue="summary" className="mt-6">
      <TabsList>
        <TabsTrigger value="summary">Summary</TabsTrigger>
        <TabsTrigger value="links">Links</TabsTrigger>
        <TabsTrigger value="assets">Assets</TabsTrigger>
        <TabsTrigger value="funnel">Funnel</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="notes">Notes</TabsTrigger>
      </TabsList>
      <TabsContent value="summary"><SummaryTab campaign={campaign} /></TabsContent>
      <TabsContent value="links"><LinksTab campaignId={campaign.id} /></TabsContent>
      <TabsContent value="assets"><AssetsTab campaignId={campaign.id} /></TabsContent>
      <TabsContent value="funnel"><FunnelTab /></TabsContent>
      <TabsContent value="analytics"><AnalyticsTab campaign={campaign} /></TabsContent>
      <TabsContent value="notes"><NotesTab campaignId={campaign.id} /></TabsContent>
    </Tabs>
  );
}
