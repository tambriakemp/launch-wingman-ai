import { Campaign } from "@/types/campaign";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { statusColors, goalLabels } from "./campaignDemoData";
import { ArrowLeft, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Props {
  campaign: Campaign;
}

export default function CampaignDetailHeader({ campaign }: Props) {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      <Button variant="ghost" size="sm" onClick={() => navigate("/marketing-hub/campaigns")} className="gap-1.5 text-muted-foreground -ml-2">
        <ArrowLeft className="w-4 h-4" /> Campaigns
      </Button>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          <Badge className={cn("capitalize", statusColors[campaign.status])} variant="secondary">{campaign.status}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{goalLabels[campaign.goal]}</span>
          <span className="text-sm text-muted-foreground">·</span>
          <span className="text-sm text-muted-foreground">{campaign.owner}</span>
          <Button variant="outline" size="sm" className="gap-1.5 ml-2">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
        </div>
      </div>
      {campaign.tags.length > 0 && (
        <div className="flex gap-1.5">
          {campaign.tags.map((t) => (
            <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
          ))}
        </div>
      )}
    </div>
  );
}
