import { demoAssets } from "../campaignDemoData";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Film, Mail, Megaphone, Globe, Plus } from "lucide-react";

interface Props {
  campaignId: string;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  reel: Film,
  email: Mail,
  ad: Megaphone,
  landing_page: Globe,
};

export default function AssetsTab({ campaignId }: Props) {
  const assets = demoAssets.filter((a) => a.campaign_id === campaignId);

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium">Campaign Assets</h3>
        <Button variant="outline" size="sm" className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Asset</Button>
      </div>
      {assets.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">No assets attached yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {assets.map((a) => {
            const Icon = typeIcons[a.type] || Globe;
            return (
              <Card key={a.id} className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-muted flex items-center justify-center"><Icon className="w-4 h-4 text-muted-foreground" /></div>
                  <div>
                    <p className="text-sm font-medium">{a.name}</p>
                    <Badge variant="outline" className="text-[10px] capitalize">{a.type.replace("_", " ")}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div><p className="text-muted-foreground">Clicks</p><p className="font-medium">{a.clicks.toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground">Leads</p><p className="font-medium">{a.leads.toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground">Revenue</p><p className="font-medium">${a.revenue.toLocaleString()}</p></div>
                </div>
                <p className="text-[10px] text-muted-foreground font-mono">{a.utm_tag}</p>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
