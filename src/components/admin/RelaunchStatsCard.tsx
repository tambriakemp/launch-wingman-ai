import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Sparkles, Target, GitBranch } from "lucide-react";
import { useAdminPlatformStats } from "@/hooks/useAdminPlatformStats";
import { Skeleton } from "@/components/ui/skeleton";

export function RelaunchStatsCard() {
  const { data: platformStats, isLoading } = useAdminPlatformStats();
  const stats = platformStats?.relaunchStats;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary" />
            Relaunch Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!stats) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-primary" />
          Relaunch Analytics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <GitBranch className="w-4 h-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.totalRelaunches}</span>
            </div>
            <p className="text-xs text-muted-foreground">Total relaunches</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.freshStarts}</span>
            </div>
            <p className="text-xs text-muted-foreground">Fresh starts</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.avgKeptSections.toFixed(1)}</span>
            </div>
            <p className="text-xs text-muted-foreground">Avg kept sections</p>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.relaunchConversionRate}%</span>
            </div>
            <p className="text-xs text-muted-foreground">Relaunch rate</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
