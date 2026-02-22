import { Campaign } from "@/types/campaign";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { demoAssets, goalLabels } from "../campaignDemoData";
import { TrendingUp, TrendingDown, Users, DollarSign, MousePointerClick, Target, Activity, Info, ShieldCheck, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import ClickTimingChart from "@/components/marketing-hub/analytics/ClickTimingChart";

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

const SOURCE_COLORS = [
  "hsl(210, 60%, 55%)",
  "hsl(330, 70%, 55%)",
  "hsl(220, 80%, 55%)",
  "hsl(0, 75%, 55%)",
  "hsl(220, 9%, 46%)",
  "hsl(168, 76%, 42%)",
  "hsl(45, 80%, 55%)",
];

function KPICard({ label, value, change, lastPeriod, positive, icon: Icon, tooltip, secondaryText }: { label: string; value: string; change: string; lastPeriod: string; positive: boolean; icon: any; tooltip?: string; secondaryText?: string }) {
  return (
  <Card className="p-3 sm:p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
          {tooltip && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="w-3 h-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[200px] text-xs">
                  {tooltip}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
      <div className="flex items-center gap-2.5 flex-wrap">
        <p className="text-xl sm:text-2xl font-bold">{value}</p>
        <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded ${positive ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400" : "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400"}`}>
          {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {change}
        </span>
      </div>
      <p className="text-xs text-muted-foreground mt-1.5">vs. {lastPeriod} last period</p>
      {secondaryText && (
        <p className="text-[10px] text-muted-foreground mt-1">{secondaryText}</p>
      )}
    </Card>
  );
}

export default function SummaryTab({ campaign }: Props) {
  const { user } = useAuth();
  const assets = demoAssets.filter((a) => a.campaign_id === campaign.id);

  // Fetch real UTM links for this campaign from the database
  const { data: dbLinks } = useQuery({
    queryKey: ["campaign-utm-links-summary", campaign.id, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("utm_links")
        .select("id, label, utm_source, utm_medium, utm_campaign, click_count, status")
        .eq("campaign_id", campaign.id)
        .eq("user_id", user!.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && !!campaign.id,
  });

  // Fetch real conversion data from campaign_conversions table
  const { data: conversionData } = useQuery({
    queryKey: ["campaign-conversions-summary", campaign.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_conversions")
        .select("id, utm_source, utm_medium, revenue, created_at")
        .eq("campaign_id", campaign.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!campaign.id,
    staleTime: 30_000,
  });

  const links = dbLinks || [];
  const conversions = conversionData || [];
  const totalTraffic = links.reduce((s, l) => s + (l.click_count || 0), 0);
  const totalLeads = conversions.length;
  const totalRevenue = conversions.reduce((s, c) => s + (Number(c.revenue) || 0), 0);
  const cpl = campaign.budget && totalLeads > 0 ? (campaign.budget / totalLeads).toFixed(2) : null;

  const paidConversions = conversions.filter(c => (Number(c.revenue) || 0) > 0).length;
  const clickToLeadRate = totalTraffic > 0 ? ((totalLeads / totalTraffic) * 100) : 0;
  const leadToSaleRate = totalLeads > 0 ? ((paidConversions / totalLeads) * 100) : 0;

  const isRevenueGoal = campaign.goal === "revenue";
  const primaryConversionRate = isRevenueGoal ? leadToSaleRate : clickToLeadRate;
  const primaryConversionLabel = isRevenueGoal ? "Lead-to-Sale" : "Click-to-Lead";
  const secondaryConversionRate = isRevenueGoal ? clickToLeadRate : leadToSaleRate;
  const secondaryConversionLabel = isRevenueGoal ? "Click-to-Lead" : "Lead-to-Sale";

  const roi = campaign.budget && campaign.budget > 0 ? (((totalRevenue - campaign.budget) / campaign.budget) * 100) : 0;

  const goalTarget = campaign.goal_target > 0 ? campaign.goal_target : (campaign.goal === "revenue" ? 50000 : campaign.goal === "leads" ? 5000 : 2000);
  const goalCurrent = campaign.goal === "revenue" ? totalRevenue : totalLeads;
  const goalPct = Math.min(100, (goalCurrent / goalTarget) * 100);

  // Source breakdown from real link data
  const sourceCounts: Record<string, number> = {};
  links.forEach((l) => {
    sourceCounts[l.utm_source] = (sourceCounts[l.utm_source] || 0) + (l.click_count || 0);
  });
  const trafficBySource = Object.entries(sourceCounts)
    .map(([name, value], i) => ({
      name,
      value,
      color: SOURCE_COLORS[i % SOURCE_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  // Leads by channel from actual conversion data
  const leadsBySourceMap: Record<string, number> = {};
  conversions.forEach((c) => {
    const src = c.utm_source || "direct";
    leadsBySourceMap[src] = (leadsBySourceMap[src] || 0) + 1;
  });
  const leadsByChannel = Object.entries(leadsBySourceMap)
    .map(([channel, leads]) => ({ channel, leads }))
    .sort((a, b) => b.leads - a.leads)
    .slice(0, 5);

  // Revenue by channel from actual conversion data
  const revBySourceMap: Record<string, number> = {};
  conversions.forEach((c) => {
    const src = c.utm_source || "direct";
    revBySourceMap[src] = (revBySourceMap[src] || 0) + (Number(c.revenue) || 0);
  });

  // Source table from links + conversion data
  const sourceTable = trafficBySource.map((s) => {
    const leads = leadsBySourceMap[s.name] || 0;
    const cvr = s.value > 0 ? ((leads / s.value) * 100).toFixed(1) : "0.0";
    return {
      source: s.name,
      clicks: s.value,
      leads,
      conversion: cvr,
    };
  });

  return (
    <div className="space-y-6 mt-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <KPICard
          label="Total Traffic"
          value={totalTraffic.toLocaleString()}
          change="+12.4%"
          lastPeriod="0"
          positive
          icon={MousePointerClick}
          tooltip={`Sum of all UTM link clicks across ${links.length} tracked link${links.length !== 1 ? "s" : ""} in this campaign.`}
        />
        <KPICard
          label="Total Leads"
          value={totalLeads.toLocaleString()}
          change={totalLeads > 0 ? `+${totalLeads}` : "0%"}
          lastPeriod="0"
          positive={totalLeads > 0}
          icon={Users}
          tooltip={`Count of conversion events recorded by the tracking pixel. Each pixel hit = 1 lead. Currently ${totalLeads} conversion${totalLeads !== 1 ? "s" : ""}.`}
        />
        <KPICard
          label="Revenue"
          value={`$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          change={totalRevenue > 0 ? `+$${totalRevenue.toLocaleString()}` : "↓ 100%"}
          lastPeriod="$0.00"
          positive={totalRevenue > 0}
          icon={DollarSign}
          tooltip={`Sum of revenue values passed via the tracking pixel across all ${totalLeads} conversion${totalLeads !== 1 ? "s" : ""}.`}
        />
        <KPICard
          label={primaryConversionLabel}
          value={`${primaryConversionRate.toFixed(1)}%`}
          change={primaryConversionRate > 0 ? `+${primaryConversionRate.toFixed(1)}%` : "0%"}
          lastPeriod="0%"
          positive={primaryConversionRate > 0}
          icon={Target}
          tooltip={isRevenueGoal
            ? `Paid conversions ÷ Leads × 100. ${paidConversions} paid ÷ ${totalLeads} lead${totalLeads !== 1 ? "s" : ""} = ${leadToSaleRate.toFixed(1)}%.`
            : `Leads ÷ Traffic × 100. ${totalLeads} lead${totalLeads !== 1 ? "s" : ""} ÷ ${totalTraffic.toLocaleString()} click${totalTraffic !== 1 ? "s" : ""} = ${clickToLeadRate.toFixed(1)}%.`}
          
        />
      </div>
      {(cpl || roi !== 0) && (
        <div className="grid grid-cols-2 gap-3">
          {cpl && (
            <KPICard
              label="Cost / Lead"
              value={`$${cpl}`}
              change="—"
              lastPeriod="$0.00"
              positive
              icon={Activity}
              tooltip={`Campaign budget ÷ Total leads. $${campaign.budget?.toLocaleString() ?? "0"} ÷ ${totalLeads} = $${cpl}/lead.`}
            />
          )}
          <KPICard
            label="ROI"
            value={`${roi.toFixed(0)}%`}
            change={roi > 0 ? `+${roi.toFixed(0)}%` : "0%"}
            lastPeriod="0%"
            positive={roi > 0}
            icon={TrendingUp}
            tooltip={`(Revenue − Budget) ÷ Budget × 100. ($${totalRevenue.toLocaleString()} − $${campaign.budget?.toLocaleString() ?? "0"}) ÷ $${campaign.budget?.toLocaleString() ?? "0"} = ${roi.toFixed(0)}%.`}
          />
        </div>
      )}

      {/* Traffic breakdown row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Pie chart */}
        <Card className="p-5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Traffic by Source</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={trafficBySource} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                  {trafficBySource.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <RechartsTooltip formatter={(value: number) => value.toLocaleString()} />
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
                <RechartsTooltip />
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
              <div className="grid grid-cols-4 gap-1 text-[10px] text-muted-foreground uppercase tracking-wider pb-1.5 border-b">
                <span>Source</span><span className="text-right">Clicks</span><span className="text-right">Leads</span><span className="text-right">CVR</span>
              </div>
              {sourceTable.map((row) => (
                <div key={row.source} className="grid grid-cols-4 gap-1 text-xs py-1.5 border-b border-border/50 last:border-0">
                  <span className="capitalize font-medium truncate">{row.source}</span>
                  <span className="text-right text-muted-foreground">{row.clicks.toLocaleString()}</span>
                  <span className="text-right text-muted-foreground">{row.leads.toLocaleString()}</span>
                  <span className="text-right font-medium">{row.conversion}%</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Campaign Health */}
      <Card className="p-4">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Campaign Health</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Link Health</p>
              <p className="text-sm font-semibold">{links.length} Active · 0 Broken</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Funnel Drop-Off</p>
              <p className="text-sm font-semibold">72% at Lead Capture</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tracking Confidence</p>
              <p className="text-sm font-semibold">92%</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Attribution Table */}
      <AttributionTable links={links} conversions={conversions} />

      {/* Click Timing */}
      <ClickTimingSection campaignLinkIds={links.map(l => l.id)} />

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

    </div>
  );
}

/* ── Attribution Table ── */
function AttributionTable({ links, conversions }: { links: any[]; conversions: any[] }) {
  const rows = useMemo(() => {
    const map: Record<string, { clicks: number; leads: number; revenue: number }> = {};

    links.forEach((l) => {
      const key = `${l.utm_source}||${l.utm_medium}`;
      if (!map[key]) map[key] = { clicks: 0, leads: 0, revenue: 0 };
      map[key].clicks += l.click_count || 0;
    });

    conversions.forEach((c) => {
      const key = `${c.utm_source || "direct"}||${c.utm_medium || "none"}`;
      if (!map[key]) map[key] = { clicks: 0, leads: 0, revenue: 0 };
      map[key].leads += 1;
      map[key].revenue += Number(c.revenue) || 0;
    });

    return Object.entries(map)
      .map(([key, v]) => {
        const [source, medium] = key.split("||");
        return { source, medium, ...v, cvr: v.clicks > 0 ? ((v.leads / v.clicks) * 100).toFixed(1) : "0.0" };
      })
      .sort((a, b) => b.clicks - a.clicks);
  }, [links, conversions]);

  if (rows.length === 0) return null;

  return (
    <Card className="p-5">
      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Attribution Table</p>
      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/30">
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Source</th>
              <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Medium</th>
              <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Clicks</th>
              <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Leads</th>
              <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Revenue</th>
              <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">CVR</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={`${row.source}-${row.medium}`} className="border-b last:border-0 hover:bg-muted/20 transition-colors">
                <td className="p-3 capitalize font-medium">{row.source}</td>
                <td className="p-3 text-muted-foreground">{row.medium}</td>
                <td className="p-3 text-right">{row.clicks.toLocaleString()}</td>
                <td className="p-3 text-right">{row.leads.toLocaleString()}</td>
                <td className="p-3 text-right font-medium">${row.revenue.toLocaleString()}</td>
                <td className="p-3 text-right"><span className="text-emerald-600 font-medium">{row.cvr}%</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

/* ── Click Timing Section ── */
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const HOURS = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, "0")}:00`);

function ClickTimingSection({ campaignLinkIds }: { campaignLinkIds: string[] }) {
  const { data: clickEvents } = useQuery({
    queryKey: ["campaign-click-timing", campaignLinkIds],
    queryFn: async (): Promise<{ clicked_at: string }[]> => {
      if (campaignLinkIds.length === 0) return [];
      const query = supabase
        .from("utm_click_events")
        .select("clicked_at") as any;
      const { data, error } = await query.in("link_id", campaignLinkIds);
      if (error) throw error;
      return (data as { clicked_at: string }[]) || [];
    },
    enabled: campaignLinkIds.length > 0,
    staleTime: 60_000,
  });

  const { dayData, hourData } = useMemo(() => {
    const dayCounts = DAYS.map((day) => ({ day, clicks: 0 }));
    const hourCounts = HOURS.map((hour) => ({ hour, clicks: 0 }));

    (clickEvents || []).forEach((e) => {
      const d = new Date(e.clicked_at);
      const dayIdx = (d.getUTCDay() + 6) % 7; // Mon=0
      dayCounts[dayIdx].clicks += 1;
      hourCounts[d.getUTCHours()].clicks += 1;
    });

    return { dayData: dayCounts, hourData: hourCounts };
  }, [clickEvents]);

  if (!clickEvents || clickEvents.length === 0) return null;

  return <ClickTimingChart dayData={dayData} hourData={hourData} />;
}
