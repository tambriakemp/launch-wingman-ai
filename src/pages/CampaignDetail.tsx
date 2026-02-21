import { useParams } from "react-router-dom";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import CampaignDetailHeader from "@/components/campaigns/CampaignDetailHeader";
import CampaignDetailTabs from "@/components/campaigns/CampaignDetailTabs";
import { demoCampaigns } from "@/components/campaigns/campaignDemoData";

export default function CampaignDetail() {
  const { campaignId } = useParams();
  const campaign = demoCampaigns.find((c) => c.id === campaignId);

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
