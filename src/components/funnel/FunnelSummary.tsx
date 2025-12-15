import { motion } from "framer-motion";
import { 
  Pencil, Layers, Users, Sparkles, Package, ListChecks,
  Gift, DollarSign, Video, Trophy, Rocket, ClipboardCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FUNNEL_CONFIGS } from "@/data/funnelConfigs";
import { FunnelDiagram } from "./FunnelDiagram";
import { AudienceData } from "./AudienceDiscovery";
import { OfferSlotData } from "./OfferSlotCard";
import { cn } from "@/lib/utils";

interface FunnelSummaryProps {
  funnelType: string;
  audienceData: AudienceData;
  transformationStatement: string;
  offers: OfferSlotData[];
  completedAssets: Set<string>;
  onEditStep: (step: string) => void;
}

const ICON_MAP: Record<string, React.ElementType> = {
  Gift,
  DollarSign,
  Video,
  Trophy,
  Rocket,
  Users,
  ClipboardCheck,
};

export const FunnelSummary = ({
  funnelType,
  audienceData,
  transformationStatement,
  offers,
  completedAssets,
  onEditStep,
}: FunnelSummaryProps) => {
  const funnelConfig = FUNNEL_CONFIGS[funnelType];
  
  if (!funnelConfig) return null;

  const Icon = ICON_MAP[funnelConfig.icon] || Layers;
  const totalAssets = funnelConfig.assets.length;
  const completedCount = funnelConfig.assets.filter(a => completedAssets.has(a.id)).length;
  const progressPercent = totalAssets > 0 ? (completedCount / totalAssets) * 100 : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-1">
            Your Funnel Configuration
          </h2>
          <p className="text-muted-foreground text-sm">
            Review your funnel setup or edit individual sections
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Funnel Type Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Funnel Type
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditStep('funnel-type')}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center",
                  funnelConfig.bgColor, funnelConfig.color
                )}>
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">{funnelConfig.name}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {funnelConfig.description}
                  </p>
                </div>
              </div>
              <FunnelDiagram
                steps={funnelConfig.steps}
                color={funnelConfig.color}
                bgColor={funnelConfig.bgColor}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Audience Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Audience & Strategy
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditStep('audience')}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Niche</p>
                <p className="text-sm font-medium text-foreground">{audienceData.niche || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Target Audience</p>
                <p className="text-sm font-medium text-foreground">{audienceData.targetAudience || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Pain Point</p>
                <p className="text-sm text-foreground line-clamp-2">{audienceData.primaryPainPoint || "Not set"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Desired Outcome</p>
                <p className="text-sm text-foreground line-clamp-2">{audienceData.desiredOutcome || "Not set"}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Transformation Statement Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Transformation Statement
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditStep('transformation')}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {transformationStatement ? (
                <p className="text-sm text-foreground italic">
                  "{transformationStatement}"
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No transformation statement set
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Offers Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="w-4 h-4 text-primary" />
                  Offer Stack
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditStep('offers')}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {offers.length > 0 ? (
                offers.map((offer, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/50"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {offer.title || offer.slotType.replace(/-/g, ' ')}
                      </p>
                      {offer.price && (
                        <p className="text-xs text-muted-foreground">
                          ${offer.price} - {offer.priceType}
                        </p>
                      )}
                    </div>
                    {offer.isConfigured && (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-600/50 bg-emerald-500/10 shrink-0">
                        Configured
                      </Badge>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground italic">
                  No offers configured
                </p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Asset Checklist Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2"
        >
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <ListChecks className="w-4 h-4 text-primary" />
                  Asset Checklist Progress
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditStep('checklist')}
                >
                  <Pencil className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {completedCount} of {totalAssets} assets complete
                </span>
                <span className="font-medium text-foreground">
                  {Math.round(progressPercent)}%
                </span>
              </div>
              <Progress value={progressPercent} className="h-2" />
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
