import { Campaign } from "@/types/campaign";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { demoWeeklyTraffic, demoAttribution } from "../campaignDemoData";
import { DollarSign, TrendingUp } from "lucide-react";

interface Props {
  campaign: Campaign;
}

const conversionTrend = [
  { week: "W1", rate: 6.7 },
  { week: "W2", rate: 7.8 },
  { week: "W3", rate: 8.8 },
  { week: "W4", rate: 10.3 },
  { week: "W5", rate: 10.0 },
  { week: "W6", rate: 11.1 },
];

const revenueBySource = [
  { source: "Email", revenue: 18200 },
  { source: "Instagram", revenue: 12800 },
  { source: "YouTube", revenue: 4800 },
  { source: "Facebook", revenue: 3500 },
];

export default function AnalyticsTab({ campaign }: Props) {
  const budget = campaign.budget || 5000;
  const revenue = campaign.revenue || 34500;
  const profit = revenue - budget;
  const roi = budget > 0 ? ((profit / budget) * 100).toFixed(0) : "—";

  return (
    <div className="space-y-6 mt-4">
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic over time */}
        <Card className="p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Traffic Over Time</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={demoWeeklyTraffic}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="traffic" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} name="Traffic" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Leads over time */}
        <Card className="p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Leads Over Time</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={demoWeeklyTraffic}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="leads" stroke="hsl(168, 76%, 42%)" strokeWidth={2} dot={false} name="Leads" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Revenue by source */}
        <Card className="p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Revenue by Source</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueBySource}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis dataKey="source" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Conversion trend */}
        <Card className="p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Conversion Trend</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={conversionTrend}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Line type="monotone" dataKey="rate" stroke="hsl(47, 96%, 53%)" strokeWidth={2} dot={false} name="Conv %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* ROI Summary */}
      <Card className="p-5">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-4">ROI Summary</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Budget / Spend</p>
            <p className="text-2xl font-bold">${budget.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Revenue</p>
            <p className="text-2xl font-bold text-emerald-600">${revenue.toLocaleString()}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground mb-1">Net Profit</p>
            <p className="text-2xl font-bold">${profit.toLocaleString()}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <p className="text-xs text-muted-foreground">ROI</p>
              <TrendingUp className="w-3 h-3 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-emerald-600">{roi}%</p>
          </div>
        </div>
      </Card>

      {/* Attribution Table */}
      <Card className="p-5">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Attribution Table</p>
        <div className="border rounded-lg overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Source</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Medium</th>
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Content</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Clicks</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Leads</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Revenue</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Conv %</th>
              </tr>
            </thead>
            <tbody>
              {demoAttribution.map((row) => (
                <tr key={`${row.source}-${row.content}`} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="p-3 capitalize font-medium">{row.source}</td>
                  <td className="p-3 text-muted-foreground">{row.medium}</td>
                  <td className="p-3"><Badge variant="outline" className="text-[10px] font-mono">{row.content}</Badge></td>
                  <td className="p-3 text-right">{row.clicks.toLocaleString()}</td>
                  <td className="p-3 text-right">{row.leads.toLocaleString()}</td>
                  <td className="p-3 text-right font-medium">${row.revenue.toLocaleString()}</td>
                  <td className="p-3 text-right">
                    <span className="text-emerald-600 font-medium">{row.conversion}%</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
