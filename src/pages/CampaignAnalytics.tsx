import { useState } from "react";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Link } from "react-router-dom";
import { ArrowLeft, MousePointerClick, Link2, Globe, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCampaignAnalytics, DateRange } from "@/hooks/useCampaignAnalytics";
import ClicksOverTimeChart from "@/components/marketing-hub/analytics/ClicksOverTimeChart";
import TopLinksChart from "@/components/marketing-hub/analytics/TopLinksChart";
import TrafficSourcesChart from "@/components/marketing-hub/analytics/TrafficSourcesChart";
import ClicksByCampaignChart from "@/components/marketing-hub/analytics/ClicksByCampaignChart";
import ClicksBySourceMediumChart from "@/components/marketing-hub/analytics/ClicksBySourceMediumChart";
import ClickTimingChart from "@/components/marketing-hub/analytics/ClickTimingChart";
import DeviceBreakdownChart from "@/components/marketing-hub/analytics/DeviceBreakdownChart";

const RANGE_LABELS: Record<DateRange, string> = {
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  all: "All time",
};

const CampaignAnalytics = () => {
  const [dateRange, setDateRange] = useState<DateRange>("30d");
  const analytics = useCampaignAnalytics(dateRange);

  return (
    <ProjectLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <Link
              to="/marketing-hub"
              className="p-1.5 rounded-md hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-4 h-4 text-muted-foreground" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Analytics Dashboard</h1>
              <p className="text-muted-foreground text-sm mt-0.5">
                Track performance across your UTM campaigns and links.
              </p>
            </div>
          </div>
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RANGE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {analytics.isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2 mb-1">
                    <MousePointerClick className="w-4 h-4 text-secondary" />
                    <span className="text-xs text-muted-foreground">Total Clicks</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{analytics.totalClicks}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{RANGE_LABELS[dateRange]}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Link2 className="w-4 h-4 text-secondary" />
                    <span className="text-xs text-muted-foreground">Top Performing Link</span>
                  </div>
                  <p className="text-lg font-bold text-foreground truncate">
                    {analytics.topLink?.label || "—"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {analytics.topLink ? `${analytics.topLink.clicks} clicks` : "No data"}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4 pb-3 px-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Globe className="w-4 h-4 text-secondary" />
                    <span className="text-xs text-muted-foreground">Traffic Sources</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{analytics.uniqueSourceCount}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Unique referrer domains</p>
                </CardContent>
              </Card>
            </div>

            {/* Clicks Over Time */}
            <ClicksOverTimeChart data={analytics.clicksOverTime} />

            {/* Top Links + Traffic Sources */}
            <div className="grid md:grid-cols-2 gap-4">
              <TopLinksChart data={analytics.clicksByLink} />
              <TrafficSourcesChart data={analytics.trafficSources} />
            </div>

            {/* Campaign + Source/Medium */}
            <div className="grid md:grid-cols-2 gap-4">
              <ClicksByCampaignChart data={analytics.clicksByCampaign} />
              <ClicksBySourceMediumChart data={analytics.clicksBySourceMedium} />
            </div>

            {/* Click Timing */}
            <ClickTimingChart dayData={analytics.clicksByDayOfWeek} hourData={analytics.clicksByHour} />

            {/* Device / Browser */}
            <DeviceBreakdownChart
              deviceData={analytics.deviceBreakdown}
              browserData={analytics.browserBreakdown}
            />
          </>
        )}
      </div>
    </ProjectLayout>
  );
};

export default CampaignAnalytics;
