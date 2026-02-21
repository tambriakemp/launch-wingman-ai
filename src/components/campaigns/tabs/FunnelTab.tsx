import { demoFunnelSteps } from "../campaignDemoData";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, Link2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function FunnelTab() {
  const hasSteps = demoFunnelSteps.length > 0;

  if (!hasSteps) {
    return (
      <div className="mt-4 border border-dashed rounded-lg py-16 text-center">
        <p className="text-sm text-muted-foreground">No funnel attached to this campaign.</p>
        <Button size="sm" className="mt-3 gap-1.5"><Link2 className="w-3.5 h-3.5" /> Attach Funnel</Button>
      </div>
    );
  }

  return (
    <div className="mt-4 space-y-6">
      {/* Horizontal funnel flow */}
      <Card className="p-6">
        <p className="text-xs text-muted-foreground uppercase tracking-wide mb-5">Funnel Flow</p>
        <div className="flex items-stretch gap-0 overflow-x-auto pb-2">
          {demoFunnelSteps.map((step, i) => {
            const isLowConversion = step.conversion_pct < 30;
            return (
              <div key={step.name} className="flex items-center">
                <div className={cn(
                  "border rounded-lg p-4 min-w-[160px] transition-all",
                  isLowConversion ? "border-amber-300 bg-amber-50/50 dark:bg-amber-950/10 dark:border-amber-800" : "border-border"
                )}>
                  <div className="flex items-center gap-1.5 mb-2">
                    {isLowConversion && <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />}
                    <p className="text-sm font-semibold">{step.name}</p>
                  </div>
                  <p className="text-2xl font-bold">{step.visitors.toLocaleString()}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs">
                    <span className="text-emerald-600 font-medium">{step.conversion_pct}% conv</span>
                    <span className="text-red-500">{step.dropoff_pct}% drop</span>
                  </div>
                </div>
                {i < demoFunnelSteps.length - 1 && (
                  <div className="flex items-center px-2">
                    <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  </div>
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
                <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Visitors</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Conversions</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Conv Rate</th>
                <th className="text-right p-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Drop-Off</th>
              </tr>
            </thead>
            <tbody>
              {demoFunnelSteps.map((step, i) => {
                const conversions = Math.round(step.visitors * (step.conversion_pct / 100));
                const isLow = step.conversion_pct < 30;
                return (
                  <tr key={step.name} className={cn("border-b last:border-0", isLow && "bg-amber-50/30 dark:bg-amber-950/10")}>
                    <td className="p-3 font-medium">
                      <div className="flex items-center gap-1.5">
                        {isLow && <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" />}
                        {step.name}
                      </div>
                    </td>
                    <td className="p-3 text-right">{step.visitors.toLocaleString()}</td>
                    <td className="p-3 text-right">{conversions.toLocaleString()}</td>
                    <td className="p-3 text-right">
                      <span className={cn("font-medium", isLow ? "text-amber-600" : "text-emerald-600")}>{step.conversion_pct}%</span>
                    </td>
                    <td className="p-3 text-right text-red-500">{step.dropoff_pct}%</td>
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
