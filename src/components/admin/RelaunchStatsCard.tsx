import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RefreshCw, Sparkles, Target, GitBranch } from "lucide-react";

interface RelaunchStats {
  totalRelaunches: number;
  freshStarts: number;
  avgKeptSections: number;
  avgRevisitSections: number;
  relaunchRate: number;
}

interface RelaunchStatsCardProps {
  stats: RelaunchStats;
}

export function RelaunchStatsCard({ stats }: RelaunchStatsCardProps) {
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
              <span className="text-2xl font-bold">{stats.relaunchRate}%</span>
            </div>
            <p className="text-xs text-muted-foreground">Relaunch rate</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
