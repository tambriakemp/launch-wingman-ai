import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Eye, Rocket, Users, Sparkles, Package, CheckCircle, Circle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { FUNNEL_CONFIGS } from "@/data/funnelConfigs";
import { FunnelDiagram } from "@/components/funnel/FunnelDiagram";
import { FunnelPreview } from "@/components/funnel/FunnelPreview";
import { FunnelEmptyState } from "@/components/funnel/FunnelEmptyState";
import { LaunchTimeline } from "@/components/funnel/LaunchTimeline";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
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

const ProjectFunnelOverview = () => {
  const { id: projectId } = useParams();
  const navigate = useNavigate();
  const [showPreview, setShowPreview] = useState(false);

  // Fetch project
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId!)
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
        .eq('project_id', projectId!)
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

  if (!projectId) return null;

  if (isLoading) {
    return (
      <ProjectLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </ProjectLayout>
    );
  }

  // No funnel exists - show empty state
  if (!funnel) {
    return (
      <ProjectLayout>
        <FunnelEmptyState onCreateFunnel={() => navigate(`/projects/${projectId}/funnel-type`)} />
      </ProjectLayout>
    );
  }

  const funnelConfig = funnel.funnel_type ? FUNNEL_CONFIGS[funnel.funnel_type] : null;
  const Icon = funnelConfig ? ICON_MAP[funnelConfig.icon] || Layers : Layers;

  // Calculate completion status
  const hasAudience = !!(funnel.niche && funnel.target_audience && funnel.primary_pain_point && funnel.desired_outcome && funnel.problem_statement);
  const hasTransformation = !!project?.transformation_statement;
  const hasOffers = offers.some(o => o.title);

  const steps = [
    { id: 'funnel-type', label: 'Funnel Type', complete: !!funnel.funnel_type, route: 'funnel-type' },
    { id: 'audience', label: 'Audience', complete: hasAudience, route: 'audience' },
    { id: 'transformation', label: 'Transformation', complete: hasTransformation, route: 'transformation' },
    { id: 'offers', label: 'Offers', complete: hasOffers, route: 'offers' },
  ];

  const completedSteps = steps.filter(s => s.complete).length;

  return (
    <ProjectLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Funnel Overview</h1>
          <p className="text-muted-foreground">
            Your complete funnel configuration at a glance
          </p>
        </div>

        {/* Launch Timeline */}
        <LaunchTimeline projectId={projectId} projectType={project?.project_type as "launch" | "prelaunch" || "launch"} />

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {steps.map((step) => (
            <Card
              key={step.id}
              className={cn(
                "cursor-pointer transition-all hover:border-primary/50",
                step.complete ? "border-emerald-500/30 bg-emerald-500/5" : ""
              )}
              onClick={() => navigate(`/projects/${projectId}/${step.route}`)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                {step.complete ? (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground" />
                )}
                <div>
                  <p className="text-sm font-medium text-foreground">{step.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {step.complete ? "Complete" : "Not set"}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Progress Bar */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-foreground">Setup Progress</p>
              <p className="text-sm text-muted-foreground">{completedSteps}/{steps.length} complete</p>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all"
                style={{ width: `${(completedSteps / steps.length) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Funnel Type Card */}
        {funnelConfig && (
          <Card>
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
              
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1">
                  <FunnelDiagram
                    steps={funnelConfig.steps}
                    color={funnelConfig.color}
                    bgColor={funnelConfig.bgColor}
                  />
                </div>
                <div className="flex-1 space-y-3">
                  <h4 className="text-sm font-medium text-muted-foreground">Configured Offers</h4>
                  <div className="space-y-2">
                    {funnelConfig.offerSlots.map((slot, index) => {
                      const configuredOffer = offers.find(o => o.slot_type === slot.type);
                      return (
                        <div key={index} className="flex items-center gap-3 p-2 rounded-lg bg-accent/30">
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
                          {configuredOffer?.title && (
                            <Badge variant="outline" className="text-xs text-emerald-600 border-emerald-600/50 bg-emerald-500/10">
                              Configured
                            </Badge>
                          )}
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
    </ProjectLayout>
  );
};

export default ProjectFunnelOverview;
