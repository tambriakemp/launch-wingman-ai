import { Campaign } from "@/types/campaign";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { demoLinks, demoAssets } from "../campaignDemoData";

interface Props {
  campaign: Campaign;
}

const trafficData = [
  { name: "Instagram", value: 35, color: "#E1306C" },
  { name: "Email", value: 40, color: "#4A90D9" },
  { name: "Facebook", value: 15, color: "#1877F2" },
  { name: "Direct", value: 10, color: "#6B7280" },
];

export default function SummaryTab({ campaign }: Props) {
  const links = demoLinks.filter((l) => l.campaign_id === campaign.id);
  const assets = demoAssets.filter((a) => a.campaign_id === campaign.id);
  const goalTarget = campaign.goal === "revenue" ? 50000 : 5000;
  const goalCurrent = campaign.goal === "revenue" ? campaign.revenue : campaign.leads;
  const goalPct = Math.min(100, (goalCurrent / goalTarget) * 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-4">
      <div className="lg:col-span-2 space-y-4">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Goal Progress</p>
          <div className="flex items-end justify-between mb-1">
            <span className="text-xl font-bold">{goalCurrent.toLocaleString()}</span>
            <span className="text-sm text-muted-foreground">/ {goalTarget.toLocaleString()}</span>
          </div>
          <Progress value={goalPct} className="h-2" />
        </Card>
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Revenue</p>
            <p className="text-xl font-bold mt-1">${campaign.revenue.toLocaleString()}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Leads</p>
            <p className="text-xl font-bold mt-1">{campaign.leads.toLocaleString()}</p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Conversion</p>
            <p className="text-xl font-bold mt-1">{campaign.conversion_rate}%</p>
          </Card>
        </div>

        {/* Top assets */}
        {assets.length > 0 && (
          <Card className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Top Assets</p>
            <div className="space-y-2">
              {assets.slice(0, 3).map((a) => (
                <div key={a.id} className="flex items-center justify-between text-sm">
                  <span>{a.name}</span>
                  <span className="text-muted-foreground">{a.leads} leads · ${a.revenue.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Top links */}
        {links.length > 0 && (
          <Card className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Top Links</p>
            <div className="space-y-2">
              {links.slice(0, 3).map((l) => (
                <div key={l.id} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{l.utm_source}/{l.utm_medium}</span>
                  <span>{l.leads} leads · {l.conversion_rate}% CVR</span>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Traffic breakdown */}
      <Card className="p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-2">Traffic Breakdown</p>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={trafficData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                {trafficData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(value: number) => `${value}%`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-1 mt-2">
          {trafficData.map((d) => (
            <div key={d.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span>{d.name}</span>
              </div>
              <span className="text-muted-foreground">{d.value}%</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
