import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAdminAiUsage } from "@/hooks/useAdminAiUsage";
import { getFunctionLabel } from "@/hooks/useAiUsage";
import { Loader2, Sparkles, DollarSign } from "lucide-react";
import { format } from "date-fns";

interface MrrCardProps {
  mrrCents: number;
}

export function MrrStatsCard({ mrrCents }: MrrCardProps) {
  const mrr = mrrCents / 100;
  const arr = mrr * 12;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 p-3 md:p-6">
        <CardTitle className="text-xs md:text-sm font-medium">MRR</CardTitle>
        <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-green-500 hidden sm:block" />
      </CardHeader>
      <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
        <div className="text-xl md:text-2xl font-bold">${mrr.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">
          ARR: ${arr.toLocaleString()}
        </p>
      </CardContent>
    </Card>
  );
}

export function AiUsageTable() {
  const { data, isLoading } = useAdminAiUsage();

  // Get top functions
  const topFunctions = data?.byFunction
    ? Object.entries(data.byFunction)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
    : [];

  return (
    <Card>
      <CardHeader className="p-4 md:p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-violet-500/10">
              <Sparkles className="h-4 w-4 md:h-5 md:w-5 text-violet-500" />
            </div>
            <div>
              <CardTitle className="text-base md:text-lg">AI Usage</CardTitle>
              <CardDescription className="text-xs md:text-sm">
                {format(new Date(), "MMMM yyyy")} usage breakdown
              </CardDescription>
            </div>
          </div>
          {/* AI Calls summary in header */}
          <div className="text-right">
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-lg md:text-xl font-bold">{data?.totalCalls || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {data?.totalCallsLast7Days || 0} last 7 days
                </p>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4 md:p-6 pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Users Table */}
            {data?.topUsers && data.topUsers.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">Top Users by AI Calls</h4>
                <div className="rounded-md border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead className="text-right">Calls</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.topUsers.map((user) => (
                        <TableRow key={user.userId}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{user.name}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                                {user.email}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {user.callCount}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            )}

            {/* By Feature */}
            {topFunctions.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-3">Usage by Feature</h4>
                <div className="space-y-2">
                  {topFunctions.map(([fn, count]) => (
                    <div
                      key={fn}
                      className="flex items-center justify-between text-sm p-2 rounded-lg bg-muted/50"
                    >
                      <span className="text-foreground">{getFunctionLabel(fn)}</span>
                      <span className="text-muted-foreground font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(data?.totalCalls || 0) === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No AI usage recorded this month.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
