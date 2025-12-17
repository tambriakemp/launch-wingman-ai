import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Eye, Rocket, Users, Sparkles, Package, CheckCircle, ArrowRight, Edit2, Target, Lightbulb, Server } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { FUNNEL_CONFIGS } from "@/data/funnelConfigs";
import { FunnelDiagram } from "@/components/funnel/FunnelDiagram";
import { FunnelPreview } from "@/components/funnel/FunnelPreview";
import { FunnelEmptyState } from "@/components/funnel/FunnelEmptyState";
import { LaunchTimeline } from "@/components/funnel/LaunchTimeline";
import { PlanPageHeader } from "@/components/PlanPageHeader";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { 
  Gift, DollarSign, Video, Trophy, Layers, ClipboardCheck 
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  Gift,
  DollarSign,
  Video,
  Trophy,
  Rocket,
  Users,
  ClipboardCheck,
};

interface Props {
  projectId: string;
}

const FunnelOverviewContent = ({ projectId }: Props) => {
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);

  // Fetch project
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch funnel
  const { data: funnel, isLoading } = useQuery({
    queryKey: ['funnel', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('funnels')
        .select('*')
        .eq('project_id', projectId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });

  // Fetch offers
  const { data: offers = [] } = useQuery({
    queryKey: ['funnel-offers', projectId],
    queryFn: async () => {
      if (!funnel?.id) return [];
      const { data, error } = await supabase
        .from('offers')
        .select('*')
        .eq('funnel_id', funnel.id)
        .order('slot_position');
      if (error) throw error;
      return data;
    },
    enabled: !!funnel?.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // No funnel exists - show empty state
  if (!funnel) {
    return <FunnelEmptyState onCreateFunnel={() => navigate(`/projects/${projectId}/funnel-type`)} />;
  }

  const funnelConfig = funnel.funnel_type ? FUNNEL_CONFIGS[funnel.funnel_type] : null;
  const Icon = funnelConfig ? ICON_MAP[funnelConfig.icon] || Layers : Layers;

  // Calculate completion status
  const hasAudience = !!(funnel.niche && funnel.target_audience && funnel.primary_pain_point && funnel.desired_outcome && funnel.problem_statement);
  const hasTransformation = !!project?.transformation_statement;
  const hasOffers = offers.some(o => o.title);
  const hasTechStack = !!(funnel.funnel_platform || funnel.email_platform || funnel.community_platform);

  const steps = [
    { id: 'funnel-type', label: 'Funnel Type', complete: !!funnel.funnel_type, route: 'funnel-type', icon: Rocket },
    { id: 'audience', label: 'Audience', complete: hasAudience, route: 'audience', icon: Users },
    { id: 'transformation', label: 'Transformation', complete: hasTransformation, route: 'transformation', icon: Sparkles },
    { id: 'offers', label: 'Offers', complete: hasOffers, route: 'offers', icon: Package },
    { id: 'tech-stack', label: 'Tech Stack', complete: hasTechStack, route: 'tech-stack', icon: Server },
  ];

  const completedSteps = steps.filter(s => s.complete).length;

  return (
    <div className="space-y-6">
      <PlanPageHeader
        title="Funnel Overview"
        description="Your complete funnel configuration at a glance"
      />

      {/* Launch Timeline */}
      <LaunchTimeline projectId={projectId} projectType={project?.project_type as "launch" | "prelaunch" || "launch"} />

      {/* Inline Progress Stepper */}
      <div className="relative max-w-4xl mx-auto hidden lg:block">
        <div className="flex items-center justify-center">
          {steps.map((step, index) => {
            const StepIcon = step.icon;
            const isLast = index === steps.length - 1;

            return (
              <div
                key={step.id}
                className="flex items-center"
              >
                <button
                  onClick={() => navigate(`/projects/${projectId}/${step.route}`)}
                  className={cn(
                    "flex items-center gap-2 px-3 md:px-4 py-2 rounded-full transition-all min-w-0",
                    step.complete
                      ? "bg-foreground text-background hover:bg-foreground/90"
                      : "bg-card text-muted-foreground border border-border hover:bg-muted/50"
                  )}
                >
                  {step.complete ? (
                    <CheckCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <StepIcon className="w-4 h-4 shrink-0" />
                  )}
                  <span className="text-sm font-medium hidden sm:inline whitespace-nowrap">
                    {step.label}
                  </span>
                </button>

                {!isLast && (
                  <div
                    className={cn(
                      "h-0.5 mx-2 w-8 shrink-0",
                      step.complete ? "bg-foreground/40" : "bg-muted"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-3">
          {completedSteps}/{steps.length} complete
        </p>
      </div>

      {/* Audience & Transformation Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Audience Card */}
        <Card className="border bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Target className="w-4 h-4 text-muted-foreground" />
                </div>
                <CardTitle className="text-base">Audience & Strategy</CardTitle>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate(`/projects/${projectId}/audience`)}
              >
                <Edit2 className="w-3.5 h-3.5 mr-1" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {hasAudience ? (
              <div className="space-y-2 text-sm">
                <div className="flex gap-2">
                  <span className="text-muted-foreground shrink-0">Niche:</span>
                  <span className="text-foreground">{funnel.niche}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground shrink-0">Audience:</span>
                  <span className="text-foreground line-clamp-1">{funnel.target_audience}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-muted-foreground shrink-0">Pain Point:</span>
                  <span className="text-foreground line-clamp-1">{funnel.primary_pain_point}</span>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center py-4 text-center">
                <Users className="w-8 h-8 text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">Not configured yet</p>
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => navigate(`/projects/${projectId}/audience`)}
                  className="text-foreground"
                >
                  Set up audience →
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Problem & Transformation Card */}
        <Card className="border bg-card">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-muted-foreground" />
                </div>
                <CardTitle className="text-base">Problem & Transformation</CardTitle>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate(`/projects/${projectId}/transformation`)}
              >
                <Edit2 className="w-3.5 h-3.5 mr-1" />
                Edit
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Problem Statement */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Problem Statement</h4>
              {funnel.problem_statement ? (
                <p className="text-sm text-foreground leading-relaxed line-clamp-3">
                  "{funnel.problem_statement}"
                </p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Not configured</p>
              )}
            </div>
            
            {/* Transformation Statement */}
            <div>
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Transformation Statement</h4>
              {hasTransformation ? (
                <p className="text-sm text-foreground leading-relaxed">
                  "{project?.transformation_statement}"
                </p>
              ) : (
                <div className="flex flex-col items-center py-2 text-center">
                  <Sparkles className="w-6 h-6 text-muted-foreground/50 mb-1" />
                  <p className="text-sm text-muted-foreground">Not configured yet</p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => navigate(`/projects/${projectId}/transformation`)}
                    className="text-foreground"
                  >
                    Create statement →
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Funnel Type Card */}
      {funnelConfig && (
        <Card className="border bg-card">
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
                    {offers.length} offers configured • {funnelConfig.assets.length} assets to create
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowPreview(true)}>
                  <Eye className="w-4 h-4 mr-2" />
                  Preview
                </Button>
                <Button variant="ghost" size="sm" onClick={() => navigate(`/projects/${projectId}/funnel-type`)}>
                  Edit
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{funnelConfig.description}</p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <FunnelDiagram
                  steps={funnelConfig.steps}
                  color={funnelConfig.color}
                  bgColor={funnelConfig.bgColor}
                />
              </div>
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-foreground">Configured Offers</h4>
                <div className="space-y-2">
                  {funnelConfig.offerSlots.map((slot, index) => {
                    const configuredOffer = offers.find(o => o.slot_type === slot.type);
                    return (
                      <div key={index} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/30 transition-colors">
                        <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold",
                          funnelConfig.bgColor, funnelConfig.color
                        )}>
                          {index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {configuredOffer?.title || slot.label}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {configuredOffer?.price ? `$${configuredOffer.price}` : slot.priceRange}
                          </p>
                        </div>
                        <div className="flex gap-1.5">
                          {slot.isRequired && (
                            <Badge variant="outline" className="text-xs">Required</Badge>
                          )}
                          {configuredOffer?.title && (
                            <Badge className="text-xs bg-emerald-500/20 text-emerald-600 border-0">
                              Configured
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={() => navigate(`/projects/${projectId}/offers`)}
                >
                  Configure Offers
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview Dialog */}
      {funnel.funnel_type && (
        <FunnelPreview
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          funnelType={funnel.funnel_type}
          offers={offers.map(o => ({
            slotType: o.slot_type,
            title: o.title || '',
            description: o.description || '',
            offerType: o.offer_type,
            price: o.price?.toString() || '',
            priceType: o.price_type || 'one-time',
            isConfigured: true,
            isSkipped: false,
          }))}
        />
      )}
    </div>
  );
};

export default FunnelOverviewContent;
