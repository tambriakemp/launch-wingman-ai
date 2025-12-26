import { motion } from "framer-motion";
import { 
  Pencil, Layers, Users, Sparkles,
  Gift, DollarSign, Video, Trophy, Rocket, ClipboardCheck,
  Target, AlertCircle, Lightbulb, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FUNNEL_CONFIGS } from "@/data/funnelConfigs";
import { FunnelDiagram } from "./FunnelDiagram";
import { AudienceData } from "@/types/audience";
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

      <div className="grid grid-cols-1 gap-4">
        {/* Funnel Type Card - Full width with offer slots */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
        >
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center",
                    funnelConfig.bgColor, funnelConfig.color
                  )}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{funnelConfig.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {offers.filter(o => o.isConfigured || o.title).length} offers configured • {funnelConfig.assets.length} assets to create
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {funnelConfig.description}
              </p>
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <FunnelDiagram
                    steps={funnelConfig.steps}
                    color={funnelConfig.color}
                    bgColor={funnelConfig.bgColor}
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Offer Slots</h4>
                  <div className="space-y-2">
                    {funnelConfig.offerSlots.map((slot, index) => {
                      const configuredOffer = offers.find(o => o.slotType === slot.type);
                      return (
                        <div 
                          key={index}
                          className="flex items-center gap-3 p-2 rounded-lg bg-accent/30"
                        >
                          <div className={cn(
                            "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
                            funnelConfig.bgColor, funnelConfig.color
                          )}>
                            {index + 1}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {configuredOffer?.title || slot.label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {configuredOffer?.price ? `$${configuredOffer.price}` : slot.priceRange}
                            </p>
                          </div>
                          {slot.isRequired && (
                            <Badge variant="outline" className="text-xs">Required</Badge>
                          )}
                          {(configuredOffer?.isConfigured || configuredOffer?.title) && (
                            <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-600/50 bg-emerald-500/10">
                              Configured
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Audience & Transformation Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Target className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Niche</p>
                    <p className="text-sm font-medium text-foreground">{audienceData.niche || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Target Audience</p>
                    <p className="text-sm font-medium text-foreground">{audienceData.targetAudience || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Pain Point</p>
                    <p className="text-sm text-foreground">{audienceData.primaryPainPoint || "Not set"}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Desired Outcome</p>
                    <p className="text-sm text-foreground">{audienceData.desiredOutcome || "Not set"}</p>
                  </div>
                </div>
                {audienceData.problemStatement && (
                  <div className="flex items-start gap-3 pt-2 border-t border-border">
                    <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground uppercase tracking-wide mb-0.5">Problem Statement</p>
                      <p className="text-sm text-foreground">{audienceData.problemStatement}</p>
                    </div>
                  </div>
                )}
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
              <CardContent className="flex items-center h-[calc(100%-60px)]">
                {transformationStatement ? (
                  <p className="text-sm text-foreground italic leading-relaxed">
                    "{transformationStatement}"
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground italic">
                    No transformation statement set. Click edit to add one.
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};