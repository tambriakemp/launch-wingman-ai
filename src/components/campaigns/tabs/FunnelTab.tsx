import { demoFunnelSteps } from "../campaignDemoData";
import { Card } from "@/components/ui/card";
import { ArrowDown } from "lucide-react";

export default function FunnelTab() {
  return (
    <div className="mt-4 flex flex-col items-center gap-2 max-w-md mx-auto">
      {demoFunnelSteps.map((step, i) => {
        const widthPct = 100 - i * 15;
        return (
          <div key={step.name} className="w-full flex flex-col items-center">
            <Card className="p-4 w-full" style={{ maxWidth: `${widthPct}%` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{step.name}</p>
                  <p className="text-lg font-bold">{step.visitors.toLocaleString()}</p>
                </div>
                <div className="text-right text-xs">
                  <p className="text-emerald-600 font-medium">{step.conversion_pct}% converted</p>
                  <p className="text-red-500">{step.dropoff_pct}% drop-off</p>
                </div>
              </div>
            </Card>
            {i < demoFunnelSteps.length - 1 && (
              <ArrowDown className="w-4 h-4 text-muted-foreground my-1" />
            )}
          </div>
        );
      })}
    </div>
  );
}
