import { Campaign } from "@/types/campaign";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { demoLinks, demoAssets, goalLabels } from "../campaignDemoData";
import { TrendingUp, TrendingDown, Users, DollarSign, MousePointerClick, Target, Activity, ShieldCheck, AlertTriangle } from "lucide-react";

interface Props {
  campaign: Campaign;
}

const trafficBySource = [
  { name: "Email", value: 8900, color: "hsl(210, 60%, 55%)" },
  { name: "Instagram", value: 4520, color: "hsl(330, 70%, 55%)" },
  { name: "Facebook", value: 3200, color: "hsl(220, 80%, 55%)" },
  { name: "YouTube", value: 2100, color: "hsl(0, 75%, 55%)" },
  { name: "Direct", value: 1080, color: "hsl(220, 9%, 46%)" },
];

const leadsByChannel = [
  { channel: "Email", leads: 623 },
  { channel: "Instagram", leads: 412 },
  { channel: "Facebook", leads: 212 },
  { channel: "YouTube", leads: 156 },
];

function KPICard({ label, value, change, positive, icon: Icon }: { label: string; value: string; change: string; positive: boolean; icon: any }) {
  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <div className="flex items-center gap-1 mt-1">
        {positive ? <TrendingUp className="w-3 h-3 text-emerald-600" /> : <TrendingDown className="w-3 h-3 text-red-500" />}
        <span className={`text-xs font-medium ${positive ? "text-emerald-600" : "text-red-500"}`}>{change}</span>
        <span className="text-xs text-muted-foreground">vs last period</span>
      </div>
    </Card>
  );
}

export default function SummaryTab({ campaign }: Props) {
  const links = demoLinks.filter((l) => l.campaign_id === campaign.id);
  const assets = demoAssets.filter((a) => a.campaign_id === campaign.id);

  const totalTraffic = links.reduce((s, l) => s + l.clicks, 0);
  const totalLeads = campaign.leads || links.reduce((s, l) => s + l.leads, 0);
  const totalRevenue = campaign.revenue || links.reduce((s, l) => s + l.revenue, 0);
  const cpl = campaign.budget && totalLeads > 0 ? (campaign.budget / totalLeads).toFixed(2) : null;

  const goalTarget = campaign.goal === "revenue" ? 50000 : campaign.goal === "leads" ? 5000 : 2000;
  const goalCurrent = campaign.goal === "revenue" ? totalRevenue : totalLeads;
  const goalPct = Math.min(100, (goalCurrent / goalTarget) * 100);

  // Source table from links
  const sourceTable = links.map((l) => ({
    source: l.utm_source,
    clicks: l.clicks,
    leads: l.leads,
    conversion: l.conversion_rate,
    revenue: l.revenue,
  }));

  return (
    <div className="space-y-6 mt-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard label="Total Traffic" value={totalTraffic.toLocaleString()} change="+12.4%" positive icon={MousePointerClick} />
        <KPICard label="Total Leads" value={totalLeads.toLocaleString()} change="+8.2%" positive icon={Users} />
        <KPICard label="Revenue" value={`$${totalRevenue.toLocaleString()}`} change="+15.7%" positive icon={DollarSign} />
        <KPICard label="Conversion" value={`${campaign.conversion_rate || 7.2}%`} change="+0.8%" positive icon={Target} />
        {cpl && <KPICard label="Cost / Lead" value={`$${cpl}`} change="-5.3%" positive icon={Activity} />}
        <KPICard label="ROI" value={campaign.roi > 0 ? `${campaign.roi}%` : "590%"} change="+42%" positive icon={TrendingUp} />
      </div>

      {/* Goal Progress */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Goal Progress — {goalLabels[campaign.goal]}</p>
          <span className="text-xs text-muted-foreground">{goalPct.toFixed(0)}%</span>
        </div>
        <div className="flex items-end justify-between mb-2">
          <span className="text-2xl font-bold">
            {campaign.goal === "revenue" ? `$${goalCurrent.toLocaleString()}` : goalCurrent.toLocaleString()}
          </span>
          <span className="text-sm text-muted-foreground">
            / {campaign.goal === "revenue" ? `$${goalTarget.toLocaleString()}` : goalTarget.toLocaleString()}
          </span>
        </div>
        <Progress value={goalPct} className="h-2.5" />
      </Card>

      {/* Traffic breakdown row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pie chart */}
        <Card className="p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Traffic by Source</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={trafficBySource} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                  {trafficBySource.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip formatter={(value: number) => value.toLocaleString()} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-1.5 mt-2">
            {trafficBySource.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                  <span>{d.name}</span>
                </div>
                <span className="text-muted-foreground">{d.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Leads bar chart */}
        <Card className="p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Leads by Channel</p>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={leadsByChannel} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="opacity-20" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis dataKey="channel" type="category" tick={{ fontSize: 11 }} width={70} />
                <Tooltip />
                <Bar dataKey="leads" fill="hsl(168, 76%, 42%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Source Table */}
        <Card className="p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Source Performance</p>
          {sourceTable.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No link data yet.</p>
          ) : (
            <div className="space-y-0">
              <div className="grid grid-cols-4 gap-2 text-[10px] text-muted-foreground uppercase tracking-wider pb-2 border-b">
                <span>Source</span><span className="text-right">Clicks</span><span className="text-right">Leads</span><span className="text-right">CVR</span>
              </div>
              {sourceTable.map((row) => (
                <div key={row.source} className="grid grid-cols-4 gap-2 text-sm py-2 border-b border-border/50 last:border-0">
                  <span className="capitalize font-medium">{row.source}</span>
                  <span className="text-right text-muted-foreground">{row.clicks.toLocaleString()}</span>
                  <span className="text-right text-muted-foreground">{row.leads.toLocaleString()}</span>
                  <span className="text-right font-medium">{row.conversion}%</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Top assets */}
      {assets.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Top Performing Assets</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {assets.slice(0, 3).map((a) => {
              const ctr = a.clicks > 0 ? ((a.leads / a.clicks) * 100).toFixed(1) : "0";
              return (
                <Card key={a.id} className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium truncate">{a.name}</p>
                    <Badge variant="outline" className="text-[10px] capitalize shrink-0">{a.type.replace("_", " ")}</Badge>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div><p className="text-muted-foreground">Clicks</p><p className="font-semibold">{a.clicks.toLocaleString()}</p></div>
                    <div><p className="text-muted-foreground">Leads</p><p className="font-semibold">{a.leads.toLocaleString()}</p></div>
                    <div><p className="text-muted-foreground">Revenue</p><p className="font-semibold">${a.revenue.toLocaleString()}</p></div>
                    <div><p className="text-muted-foreground">CTR</p><p className="font-semibold">{ctr}%</p></div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Health Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <Card className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Link Health</p>
            <p className="text-sm font-semibold">{links.length} Active · 0 Broken</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Funnel Drop-Off</p>
            <p className="text-sm font-semibold">Lead Capture: 72% drop</p>
          </div>
        </Card>
        <Card className="p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Tracking Confidence</p>
            <p className="text-sm font-semibold">92%</p>
          </div>
        </Card>
      </div>
    </div>
  );
}
