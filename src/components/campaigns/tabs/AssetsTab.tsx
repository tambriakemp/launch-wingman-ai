import { demoAssets } from "../campaignDemoData";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Film, Mail, Megaphone, Globe, Plus, ExternalLink, ArrowUpDown } from "lucide-react";
import { useState } from "react";

interface Props {
  campaignId: string;
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  reel: Film,
  email: Mail,
  ad: Megaphone,
  landing_page: Globe,
};

const typeLabels: Record<string, string> = {
  reel: "Reel / Video",
  email: "Email",
  ad: "Ad",
  landing_page: "Landing Page",
};

type SortKey = "clicks" | "leads" | "revenue";

export default function AssetsTab({ campaignId }: Props) {
  const [platformFilter, setPlatformFilter] = useState("all");
  const [sortBy, setSortBy] = useState<SortKey>("revenue");

  const allAssets = demoAssets.filter((a) => a.campaign_id === campaignId);
  const filtered = platformFilter === "all" ? allAssets : allAssets.filter((a) => a.type === platformFilter);
  const sorted = [...filtered].sort((a, b) => b[sortBy] - a[sortBy]);

  return (
    <div className="mt-4 space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Button size="sm" className="gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Asset</Button>
          <Select value={platformFilter} onValueChange={setPlatformFilter}>
            <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="All types" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="reel">Reel / Video</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="ad">Ad</SelectItem>
              <SelectItem value="landing_page">Landing Page</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <ArrowUpDown className="w-3 h-3" />
          Sort:
          {(["clicks", "leads", "revenue"] as SortKey[]).map((k) => (
            <button key={k} onClick={() => setSortBy(k)} className={`capitalize px-1.5 py-0.5 rounded transition-colors ${sortBy === k ? "text-foreground font-medium bg-muted" : "hover:text-foreground"}`}>
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {sorted.length === 0 ? (
        <div className="border border-dashed rounded-lg py-12 text-center">
          <p className="text-sm text-muted-foreground">No assets attached to this campaign.</p>
          <Button size="sm" className="mt-3 gap-1.5"><Plus className="w-3.5 h-3.5" /> Add First Asset</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sorted.map((a) => {
            const Icon = typeIcons[a.type] || Globe;
            const ctr = a.clicks > 0 ? ((a.leads / a.clicks) * 100).toFixed(1) : "0";
            return (
              <Card key={a.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{a.name}</p>
                      <Badge variant="outline" className="text-[10px] capitalize mt-0.5">{typeLabels[a.type] ?? a.type}</Badge>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Button>
                </div>

                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div><p className="text-muted-foreground">Clicks</p><p className="font-semibold mt-0.5">{a.clicks.toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground">Leads</p><p className="font-semibold mt-0.5">{a.leads.toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground">Revenue</p><p className="font-semibold mt-0.5">${a.revenue.toLocaleString()}</p></div>
                  <div><p className="text-muted-foreground">CTR</p><p className="font-semibold mt-0.5">{ctr}%</p></div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                  <p className="text-[10px] text-muted-foreground font-mono">{a.utm_tag}</p>
                  <Badge variant="secondary" className="text-[10px]">Active</Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
