import { useState } from "react";
import { Campaign } from "@/types/campaign";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { statusColors, goalLabels } from "./campaignDemoData";
import { ArrowLeft, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LiveGateModal from "./links/LiveGateModal";

interface Props {
  campaign: Campaign;
}

export default function CampaignDetailHeader({ campaign }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [showGate, setShowGate] = useState(false);
  const [pendingAction, setPendingAction] = useState<"add" | "attach" | null>(null);

  const { data: linkCount } = useQuery({
    queryKey: ["campaign-utm-links-count", campaign.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from("utm_links")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaign.id)
        .eq("user_id", user.id);
      if (error) return 0;
      return count ?? 0;
    },
    enabled: !!user?.id,
  });

  const isDemoCampaign = campaign.id.startsWith("camp-");

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === "live" && (linkCount ?? 0) === 0) {
      setShowGate(true);
      return;
    }
    if (isDemoCampaign) {
      toast.info("Demo campaigns can't be updated");
      return;
    }
    const { error } = await supabase
      .from("campaigns")
      .update({ status: newStatus })
      .eq("id", campaign.id);
    if (error) { toast.error("Failed to update status"); return; }
    toast.success(newStatus === "live" ? "Campaign is Live. Tracking is active." : `Status updated to ${newStatus}`);
    queryClient.invalidateQueries({ queryKey: ["campaign-detail", campaign.id] });
    queryClient.invalidateQueries({ queryKey: ["campaigns"] });
  };

  return (
    <div className="space-y-3">
      <Button variant="ghost" size="sm" onClick={() => navigate("/marketing-hub/campaigns")} className="gap-1.5 text-muted-foreground -ml-2">
        <ArrowLeft className="w-4 h-4" /> Campaigns
      </Button>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">{campaign.name}</h1>
          {isDemoCampaign ? (
            <Badge className={cn("capitalize", statusColors[campaign.status])} variant="secondary">{campaign.status}</Badge>
          ) : (
            <Select value={campaign.status} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-28 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="live">Live</SelectItem>
                <SelectItem value="evergreen">Evergreen</SelectItem>
                <SelectItem value="ended">Ended</SelectItem>
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{goalLabels[campaign.goal]}</span>
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

      <LiveGateModal
        open={showGate}
        onOpenChange={setShowGate}
        onCreateLink={() => {
          // Navigate to links tab - user will see LinksTab with add modal
          setShowGate(false);
        }}
        onAttachLink={() => {
          setShowGate(false);
        }}
      />
    </div>
  );
}
