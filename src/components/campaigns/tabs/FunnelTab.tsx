import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowDown, AlertTriangle, BarChart3, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  campaignId: string;
}

const STEP_ORDER = ["landing", "engage", "lead", "checkout", "purchase"];
const STEP_LABELS: Record<string, string> = {
  landing: "Landing Page",
  engage: "Engaged",
  lead: "Lead Capture",
  checkout: "Checkout",
  purchase: "Purchase",
};

interface StepData {
  name: string;
  step: string;
  visitors: number;
  conversion_pct: number;
  dropoff_pct: number;
}

export default function FunnelTab({ campaignId }: Props) {
  const { data: steps = [], isLoading } = useQuery({
    queryKey: ["funnel-steps", campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaign_conversions")
        .select("step, ip_hash")
        .eq("campaign_id", campaignId)
        .not("step", "is", null);

      if (error) throw error;
      if (!data || data.length === 0) return [];

      // Count unique ip_hash per step
      const stepCounts: Record<string, Set<string>> = {};
      for (const row of data) {
        const s = (row as any).step as string;
        if (!s) continue;
        if (!stepCounts[s]) stepCounts[s] = new Set();
        if (row.ip_hash) stepCounts[s].add(row.ip_hash);
      }

      // Sort steps: known order first, then alphabetical unknowns
      const allSteps = Object.keys(stepCounts);
      allSteps.sort((a, b) => {
        const ai = STEP_ORDER.indexOf(a);
        const bi = STEP_ORDER.indexOf(b);
        if (ai !== -1 && bi !== -1) return ai - bi;
        if (ai !== -1) return -1;
        if (bi !== -1) return 1;
        return a.localeCompare(b);
      });

      // Build step data with conversion/dropoff
      const result: StepData[] = [];
      for (let i = 0; i < allSteps.length; i++) {
        const stepKey = allSteps[i];
        const visitors = stepCounts[stepKey].size;
        const prevVisitors = i === 0 ? visitors : result[i - 1].visitors;
        const convPct = prevVisitors > 0 ? Math.round((visitors / prevVisitors) * 100) : 100;
        result.push({
          name: STEP_LABELS[stepKey] || stepKey.charAt(0).toUpperCase() + stepKey.slice(1),
          step: stepKey,
          visitors,
          conversion_pct: i === 0 ? 100 : convPct,
          dropoff_pct: i === 0 ? 0 : 100 - convPct,
        });
      }
      return result;
    },
  });

  if (isLoading) {
    return (
      <div className="mt-4 flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (steps.length === 0) {
    return (
      <div className="mt-4 border border-dashed rounded-lg py-16 text-center">
        <BarChart3 className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground mb-1">No funnel data yet.</p>
        <p className="text-xs text-muted-foreground">
          Add <strong>step</strong> parameters to your tracking pixels to see funnel data here.
          Check the <strong>Pixel</strong> tab for step-aware snippets.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-6">
      {/* Horizontal funnel flow */}
      <Card className="p-6">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-5">Funnel Flow</p>
        {/* Desktop: horizontal flow */}
        <div className="hidden md:flex items-stretch gap-0 overflow-x-auto pb-2">
          {steps.map((step, i) => {
            const isLowConversion = step.conversion_pct < 30 && i > 0;
            return (
              <div key={step.step} className="flex items-center">
                <div className={cn(
                  "border rounded-lg p-4 min-w-[160px] transition-all",
                  isLowConversion ? "border-amber-300 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-800" : "border-border"
                )}>
                  <div className="flex items-center gap-1.5 mb-2">
                    {isLowConversion && <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />}
                    <p className="text-sm font-semibold">{step.name}</p>
                  </div>
                  <p className="text-2xl font-bold">{step.visitors.toLocaleString()}</p>
                  {i > 0 && (
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="text-emerald-600 font-medium">{step.conversion_pct}% conv</span>
                      <span className="text-red-500">{step.dropoff_pct}% drop</span>
                    </div>
                  )}
                </div>
                {i < steps.length - 1 && (
                  <div className="flex items-center px-2">
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        {/* Mobile: vertical flow */}
        <div className="md:hidden flex flex-col gap-0">
          {steps.map((step, i) => {
            const isLowConversion = step.conversion_pct < 30 && i > 0;
            return (
              <div key={step.step} className="flex flex-col items-center">
                <div className={cn(
                  "border rounded-lg p-4 w-full transition-all",
                  isLowConversion ? "border-amber-300 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-800" : "border-border"
                )}>
                  <div className="flex items-center gap-1.5 mb-2">
                    {isLowConversion && <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />}
                    <p className="text-sm font-semibold">{step.name}</p>
                  </div>
                  <p className="text-2xl font-bold">{step.visitors.toLocaleString()}</p>
                  {i > 0 && (
                    <div className="flex items-center gap-3 mt-2 text-xs">
                      <span className="text-emerald-600 font-medium">{step.conversion_pct}% conv</span>
                      <span className="text-red-500">{step.dropoff_pct}% drop</span>
                    </div>
                  )}
                </div>
                {i < steps.length - 1 && (
                  <ArrowDown className="w-4 h-4 text-muted-foreground my-2" />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Table view */}
      <Card className="p-5">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">Funnel Breakdown</p>
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/30">
                <th className="text-left p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Step</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Unique Visitors</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Conv Rate</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Drop-Off</th>
              </tr>
            </thead>
            <tbody>
              {steps.map((step, i) => {
                const isLow = step.conversion_pct < 30 && i > 0;
                return (
                  <tr key={step.step} className={cn("border-b last:border-0", isLow && "bg-amber-50/30 dark:bg-amber-950/10")}>
                    <td className="p-3 font-medium">
                      <div className="flex items-center gap-1.5">
                        {isLow && <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />}
                        {step.name}
                      </div>
                    </td>
                    <td className="p-3 text-right">{step.visitors.toLocaleString()}</td>
                    <td className="p-3 text-right">
                      {i === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className={cn("font-medium", isLow ? "text-amber-600" : "text-emerald-600")}>{step.conversion_pct}%</span>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {i === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="text-red-500">{step.dropoff_pct}%</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
