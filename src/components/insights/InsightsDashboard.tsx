import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Mail, DollarSign, TrendingUp, Plus } from "lucide-react";
import { GrowthChart } from "./GrowthChart";

interface MetricUpdate {
  id: string;
  recorded_at: string;
  instagram_followers: number | null;
  facebook_followers: number | null;
  tiktok_followers: number | null;
  email_list_size: number | null;
  monthly_revenue: number | null;
  ytd_revenue: number | null;
  notes: string | null;
}

interface InsightsDashboardProps {
  startingSnapshot: {
    instagram_followers?: number | null;
    facebook_followers?: number | null;
    tiktok_followers?: number | null;
    email_list_size?: number | null;
    monthly_revenue?: number | null;
    ytd_revenue?: number | null;
  } | null;
  metricUpdates: MetricUpdate[];
  onUpdateMetrics: () => void;
}

export function InsightsDashboard({
  startingSnapshot,
  metricUpdates,
  onUpdateMetrics,
}: InsightsDashboardProps) {
  // Get the latest metrics (most recent update or starting snapshot)
  const latestUpdate = metricUpdates[0];
  
  const currentMetrics = {
    totalFollowers: 
      (latestUpdate?.instagram_followers ?? startingSnapshot?.instagram_followers ?? 0) +
      (latestUpdate?.facebook_followers ?? startingSnapshot?.facebook_followers ?? 0) +
      (latestUpdate?.tiktok_followers ?? startingSnapshot?.tiktok_followers ?? 0),
    emailListSize: latestUpdate?.email_list_size ?? startingSnapshot?.email_list_size ?? 0,
    monthlyRevenue: latestUpdate?.monthly_revenue ?? startingSnapshot?.monthly_revenue ?? 0,
    ytdRevenue: latestUpdate?.ytd_revenue ?? startingSnapshot?.ytd_revenue ?? 0,
  };

  const startingMetrics = {
    totalFollowers:
      (startingSnapshot?.instagram_followers ?? 0) +
      (startingSnapshot?.facebook_followers ?? 0) +
      (startingSnapshot?.tiktok_followers ?? 0),
    emailListSize: startingSnapshot?.email_list_size ?? 0,
    monthlyRevenue: startingSnapshot?.monthly_revenue ?? 0,
    ytdRevenue: startingSnapshot?.ytd_revenue ?? 0,
  };

  // Calculate growth percentages
  const calculateGrowth = (current: number, starting: number) => {
    if (starting === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - starting) / starting) * 100);
  };

  const followerGrowth = calculateGrowth(currentMetrics.totalFollowers, startingMetrics.totalFollowers);
  const emailGrowth = calculateGrowth(currentMetrics.emailListSize, startingMetrics.emailListSize);
  const revenueGrowth = calculateGrowth(currentMetrics.monthlyRevenue, startingMetrics.monthlyRevenue);

  // Prepare chart data - combine starting snapshot with metric updates
  const chartData = [
    {
      date: startingSnapshot ? 'Start' : '',
      instagram: startingSnapshot?.instagram_followers ?? 0,
      facebook: startingSnapshot?.facebook_followers ?? 0,
      tiktok: startingSnapshot?.tiktok_followers ?? 0,
      emailList: startingSnapshot?.email_list_size ?? 0,
      monthlyRevenue: startingSnapshot?.monthly_revenue ?? 0,
    },
    ...metricUpdates.slice().reverse().map((update) => ({
      date: new Date(update.recorded_at).toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
      instagram: update.instagram_followers ?? 0,
      facebook: update.facebook_followers ?? 0,
      tiktok: update.tiktok_followers ?? 0,
      emailList: update.email_list_size ?? 0,
      monthlyRevenue: update.monthly_revenue ?? 0,
    })),
  ].filter(d => d.date);

  const hasEnoughDataForCharts = chartData.length >= 2;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header with Update Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Growth Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            Track your progress over time
          </p>
        </div>
        <Button onClick={onUpdateMetrics} variant="outline" size="sm">
          <Plus className="w-4 h-4 mr-2" />
          Update Metrics
        </Button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Followers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(currentMetrics.totalFollowers)}</div>
            {followerGrowth !== 0 && (
              <p className={`text-xs ${followerGrowth > 0 ? 'text-green-600' : 'text-red-500'}`}>
                <TrendingUp className="inline w-3 h-3 mr-1" />
                {followerGrowth > 0 ? '+' : ''}{followerGrowth}% from start
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Email List
            </CardTitle>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(currentMetrics.emailListSize)}</div>
            {emailGrowth !== 0 && (
              <p className={`text-xs ${emailGrowth > 0 ? 'text-green-600' : 'text-red-500'}`}>
                <TrendingUp className="inline w-3 h-3 mr-1" />
                {emailGrowth > 0 ? '+' : ''}{emailGrowth}% from start
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Monthly Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentMetrics.monthlyRevenue)}</div>
            {revenueGrowth !== 0 && (
              <p className={`text-xs ${revenueGrowth > 0 ? 'text-green-600' : 'text-red-500'}`}>
                <TrendingUp className="inline w-3 h-3 mr-1" />
                {revenueGrowth > 0 ? '+' : ''}{revenueGrowth}% from start
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              YTD Revenue
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(currentMetrics.ytdRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Year to date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      {hasEnoughDataForCharts ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <GrowthChart
            title="Follower Growth"
            data={chartData}
            dataKeys={[
              { key: 'instagram', color: 'hsl(var(--chart-1))', label: 'Instagram' },
              { key: 'facebook', color: 'hsl(var(--chart-2))', label: 'Facebook' },
              { key: 'tiktok', color: 'hsl(var(--chart-3))', label: 'TikTok' },
            ]}
            type="line"
          />
          <GrowthChart
            title="Email List Growth"
            data={chartData}
            dataKeys={[
              { key: 'emailList', color: 'hsl(var(--chart-4))', label: 'Subscribers' },
            ]}
            type="area"
          />
          <GrowthChart
            title="Monthly Revenue"
            data={chartData}
            dataKeys={[
              { key: 'monthlyRevenue', color: 'hsl(var(--chart-5))', label: 'Revenue' },
            ]}
            type="bar"
            formatValue={(value) => formatCurrency(value)}
          />
        </div>
      ) : (
        <Card className="border-dashed bg-muted/30">
          <CardContent className="py-8 text-center">
            <TrendingUp className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              Charts will appear here after you log your second update.
              <br />
              <span className="text-xs">Tracking progress helps you see how far you've come.</span>
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
