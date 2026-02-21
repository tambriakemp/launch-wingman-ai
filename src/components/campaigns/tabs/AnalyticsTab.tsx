import { Campaign } from "@/types/campaign";
import { Card } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

interface Props {
  campaign: Campaign;
}

const trafficData = [
  { day: "Week 1", traffic: 1200, leads: 80 },
  { day: "Week 2", traffic: 1800, leads: 145 },
  { day: "Week 3", traffic: 2400, leads: 210 },
  { day: "Week 4", traffic: 3100, leads: 320 },
  { day: "Week 5", traffic: 2800, leads: 280 },
  { day: "Week 6", traffic: 3500, leads: 390 },
];

const revenueBySource = [
  { source: "Email", revenue: 18200 },
  { source: "Instagram", revenue: 12800 },
  { source: "Facebook", revenue: 3500 },
];

export default function AnalyticsTab({ campaign }: Props) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
      <Card className="p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Traffic & Leads Over Time</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trafficData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="traffic" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Traffic" />
              <Line type="monotone" dataKey="leads" stroke="#10B981" strokeWidth={2} dot={false} name="Leads" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Revenue by Source</p>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueBySource}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="source" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <Card className="p-4 lg:col-span-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">ROI Summary</p>
        <div className="grid grid-cols-4 gap-4">
          <div><p className="text-xs text-muted-foreground">Total Spend</p><p className="text-lg font-bold">${(campaign.budget || 0).toLocaleString()}</p></div>
          <div><p className="text-xs text-muted-foreground">Revenue</p><p className="text-lg font-bold">${campaign.revenue.toLocaleString()}</p></div>
          <div><p className="text-xs text-muted-foreground">Net Return</p><p className="text-lg font-bold">${(campaign.revenue - (campaign.budget || 0)).toLocaleString()}</p></div>
          <div><p className="text-xs text-muted-foreground">ROI</p><p className="text-lg font-bold">{campaign.roi > 0 ? campaign.roi + "%" : "—"}</p></div>
        </div>
      </Card>
    </div>
  );
}
