import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAiUsage, getFunctionLabel } from "@/hooks/useAiUsage";
import { Loader2, Sparkles } from "lucide-react";
import { format } from "date-fns";

export function AiUsageCard() {
  const { data, isLoading } = useAiUsage();

  // Get top 5 functions by usage
  const topFunctions = data?.byFunction
    ? Object.entries(data.byFunction)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
    : [];

  return (
    <Card variant="elevated">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-violet-500/10 rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <CardTitle>AI Usage</CardTitle>
            <CardDescription>
              Your AI usage this month ({format(new Date(), "MMMM yyyy")})
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Total calls */}
            <div className="text-center p-4 rounded-lg bg-muted/50">
              <div className="text-4xl font-bold text-foreground">
                {data?.totalCalls || 0}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                AI calls this month
              </p>
            </div>

            {/* Breakdown by feature */}
            {topFunctions.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  By Feature
                </p>
                <div className="space-y-1.5">
                  {topFunctions.map(([fn, count]) => (
                    <div
                      key={fn}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-foreground">
                        {getFunctionLabel(fn)}
                      </span>
                      <span className="text-muted-foreground font-medium">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {data?.totalCalls === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No AI usage recorded yet this month.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
