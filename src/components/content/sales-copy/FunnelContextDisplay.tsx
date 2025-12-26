import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { FunnelConfig } from "@/data/funnelConfigs";

interface FunnelContextDisplayProps {
  funnelConfig: FunnelConfig;
}

export const FunnelContextDisplay = ({ funnelConfig }: FunnelContextDisplayProps) => {
  return (
    <Card className="bg-muted/30 border-border/50">
      <CardContent className="pt-4 pb-4">
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Detected Context</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Funnel type:</span>
            <Badge variant="secondary" className="font-normal">
              {funnelConfig.name}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
