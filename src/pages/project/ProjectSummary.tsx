import { useParams, useNavigate, Link } from "react-router-dom";
import { format, parseISO, differenceInDays } from "date-fns";
import { motion } from "framer-motion";
import {
  Users,
  Sparkles,
  Target,
  Package,
  GitBranch,
  Calendar,
  MessageSquare,
  FileText,
  ArrowLeft,
  ArrowRight,
  Play,
  RotateCcw,
  RefreshCw,
  Link as LinkIcon,
} from "lucide-react";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectSummary } from "@/hooks/useProjectSummary";
import { useProjectLifecycle } from "@/hooks/useProjectLifecycle";
import { PROJECT_STATE_LABELS, ProjectState } from "@/types/projectLifecycle";

// Map funnel types to human-readable descriptions
const FUNNEL_TYPE_LABELS: Record<string, { label: string; description: string }> = {
  "webinar-funnel": { 
    label: "Live Training → Offer", 
    description: "You invite people to a live training, then present your offer." 
  },
  "challenge-funnel": { 
    label: "Challenge → Offer", 
    description: "You guide people through a multi-day experience, then invite them to continue." 
  },
  "video-series-funnel": { 
    label: "Video Series → Offer", 
    description: "You share a sequence of videos that lead into your offer." 
  },
  "direct-sales-funnel": { 
    label: "Content → Offer", 
    description: "You attract people with content, then direct them to your offer." 
  },
  "lead-magnet-funnel": { 
    label: "Freebie → Email → Offer", 
    description: "You offer a free resource, nurture via email, then pitch." 
  },
  "application-funnel": {
    label: "Application → Call",
    description: "You invite people to apply, then speak with qualified leads."
  },
};

// Map status to badge variant
function getStatusBadgeVariant(status: ProjectState): "default" | "secondary" | "outline" | "destructive" {
  switch (status) {
    case "in_progress":
      return "default";
    case "launched":
      return "default";
    case "completed":
      return "secondary";
    case "paused":
      return "outline";
    case "archived":
      return "destructive";
    default:
      return "secondary";
  }
}

// Section component for consistent styling
function SummarySection({
  icon: Icon,
  title,
  children,
  delay = 0,
  className = "",
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      className={className}
    >
      <Card className="h-full border-border/50 bg-card/50 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2.5 text-base font-medium text-foreground">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">{children}</CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-sm text-muted-foreground/70 italic">{message}</p>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-5 w-64" />
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Skeleton className="w-8 h-8 rounded-lg" />
                <Skeleton className="h-5 w-32" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-20 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function ProjectSummary() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useProjectSummary(id);
  const { projectState, resume } = useProjectLifecycle({ projectId: id || "" });

  // Check if relaunch is available (only for launched or completed)
  const canRelaunch = projectState === "launched" || projectState === "completed";

  // Get lifecycle-aware CTA
  const getPrimaryCta = () => {
    switch (projectState) {
      case "draft":
      case "in_progress":
        return { label: "Continue project", icon: ArrowRight, action: () => navigate(`/projects/${id}`) };
      case "launched":
        return { label: "Continue to Post-Launch", icon: ArrowRight, action: () => navigate(`/projects/${id}`) };
      case "completed":
        return { label: "Choose next step", icon: ArrowRight, action: () => navigate(`/projects/${id}`) };
      case "paused":
        return { label: "Resume project", icon: Play, action: async () => { await resume(); navigate(`/projects/${id}`); } };
      case "archived":
        return { label: "Restore project", icon: RotateCcw, action: () => navigate(`/projects/${id}`) };
      default:
        return { label: "Continue project", icon: ArrowRight, action: () => navigate(`/projects/${id}`) };
    }
  };

  const primaryCta = getPrimaryCta();
  const funnelInfo = data?.funnelType ? FUNNEL_TYPE_LABELS[data.funnelType] : null;
  
  // Check if this is a relaunch project
  const isRelaunchProject = data?.isRelaunch;
  const parentProjectId = data?.parentProjectId;
  const parentProjectName = data?.parentProjectName;

  if (isLoading) {
    return (
      <ProjectLayout>
        <div className="max-w-4xl mx-auto">
          <LoadingSkeleton />
        </div>
      </ProjectLayout>
    );
  }

  if (!data) {
    return (
      <ProjectLayout>
        <div className="py-12 text-center text-muted-foreground">
          Unable to load project summary.
        </div>
      </ProjectLayout>
    );
  }

  return (
    <ProjectLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Back Link */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Link
            to={`/projects/${id}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </motion.div>

        {/* Project Header */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold text-foreground">
              {data.projectName}
            </h1>
            <Badge variant={getStatusBadgeVariant(data.projectStatus)}>
              {PROJECT_STATE_LABELS[data.projectStatus]}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            This is a snapshot of your project so far.
          </p>
        </motion.header>

        {/* Summary Sections Grid */}
        <div className="grid gap-5 md:grid-cols-2">
          {/* Audience & Problem */}
          <SummarySection icon={Users} title="Audience & Problem" delay={0.05}>
            {data.targetAudience || data.primaryPainPoint ? (
              <div className="space-y-3">
                {data.targetAudience && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Who you serve</p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {data.targetAudience}
                    </p>
                  </div>
                )}
                {data.primaryPainPoint && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Their main struggle</p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {data.primaryPainPoint}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState message="Not yet defined" />
            )}
          </SummarySection>

          {/* Dream Outcome */}
          <SummarySection icon={Target} title="Dream Outcome" delay={0.1}>
            {data.desiredOutcome ? (
              <p className="text-sm text-foreground leading-relaxed">
                {data.desiredOutcome}
              </p>
            ) : (
              <EmptyState message="Not yet defined" />
            )}
          </SummarySection>

          {/* Offer Snapshot */}
          <SummarySection icon={Package} title="Offer Snapshot" delay={0.15}>
            {data.offers.length > 0 ? (
              <div className="space-y-3">
                {data.offers.slice(0, 2).map((offer, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-lg bg-accent/40 border border-border/40"
                  >
                    <p className="text-sm font-medium text-foreground">
                      {offer.title || offer.offerType}
                    </p>
                    {offer.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {offer.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {offer.offerCategory && (
                        <Badge variant="outline" className="text-xs font-normal">
                          {offer.offerCategory}
                        </Badge>
                      )}
                      {offer.price !== null && (
                        <span className="text-xs text-muted-foreground">
                          ${offer.price.toLocaleString()}
                          {offer.priceType === "recurring" && "/mo"}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {data.offers.length > 2 && (
                  <p className="text-xs text-muted-foreground">
                    +{data.offers.length - 2} more offer{data.offers.length - 2 > 1 ? "s" : ""}
                  </p>
                )}
              </div>
            ) : (
              <EmptyState message="No offers configured yet" />
            )}
          </SummarySection>

          {/* Funnel Type */}
          <SummarySection icon={GitBranch} title="Funnel Type" delay={0.2}>
            {funnelInfo ? (
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">
                  {funnelInfo.label}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {funnelInfo.description}
                </p>
              </div>
            ) : (
              <EmptyState message="Not yet selected" />
            )}
          </SummarySection>

          {/* Messaging Highlights */}
          <SummarySection icon={MessageSquare} title="Messaging Highlights" delay={0.25}>
            {data.coreMessage || data.transformationStatement || data.talkingPoints.length > 0 ? (
              <div className="space-y-3">
                {data.coreMessage && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Core message</p>
                    <p className="text-sm text-foreground leading-relaxed">
                      {data.coreMessage}
                    </p>
                  </div>
                )}
                {data.transformationStatement && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Transformation</p>
                    <p className="text-sm text-foreground italic leading-relaxed">
                      "{data.transformationStatement}"
                    </p>
                  </div>
                )}
                {data.talkingPoints.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Key talking points</p>
                    <ul className="space-y-1">
                      {data.talkingPoints.slice(0, 4).map((point, i) => (
                        <li key={i} className="text-sm text-foreground flex items-start gap-2">
                          <span className="text-primary mt-1.5">•</span>
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState message="No messaging created yet" />
            )}
          </SummarySection>

          {/* Content Themes */}
          <SummarySection icon={FileText} title="Content Themes" delay={0.3}>
            {data.contentThemes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {data.contentThemes.map((theme, i) => (
                  <Badge key={i} variant="secondary" className="text-xs font-normal">
                    {theme}
                  </Badge>
                ))}
              </div>
            ) : (
              <EmptyState message="No content themes yet" />
            )}
          </SummarySection>

          {/* Launch Window */}
          <SummarySection icon={Calendar} title="Launch Window" delay={0.35} className="md:col-span-2">
            {data.launchWindow && (data.launchWindow.enrollmentOpens || data.launchWindow.prelaunchStart) ? (
              <div className="flex flex-wrap gap-6">
                {data.launchWindow.durationDays && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Duration</p>
                    <p className="text-sm font-medium text-foreground">
                      {data.launchWindow.durationDays} day{data.launchWindow.durationDays !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}
                {data.launchWindow.enrollmentOpens && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Enrollment opens</p>
                    <p className="text-sm text-foreground">
                      {format(parseISO(data.launchWindow.enrollmentOpens), "MMMM d, yyyy")}
                    </p>
                  </div>
                )}
                {data.launchWindow.enrollmentCloses && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Enrollment closes</p>
                    <p className="text-sm text-foreground">
                      {format(parseISO(data.launchWindow.enrollmentCloses), "MMMM d, yyyy")}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState message="No launch dates set" />
            )}
          </SummarySection>
        </div>

        {/* Relaunch CTA - only for launched/completed */}
        {canRelaunch && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-4 pb-4">
                <Button
                  variant="ghost"
                  onClick={() => navigate(`/projects/${id}/relaunch`)}
                  className="w-full justify-between h-auto py-3 px-3"
                >
                  <div className="flex items-center gap-3 text-left">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <RefreshCw className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Relaunch this project</p>
                      <p className="text-sm text-muted-foreground">
                        Reuse what still fits, revisit what needs attention
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Based on section - for relaunch projects */}
        {isRelaunchProject && parentProjectId && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38 }}
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
          >
            <LinkIcon className="w-3.5 h-3.5" />
            <span>Based on:</span>
            <Link
              to={`/projects/${parentProjectId}/summary`}
              className="text-primary hover:underline"
            >
              {parentProjectName || "Original project"}
            </Link>
          </motion.div>
        )}

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6 pb-4"
        >
          <Button onClick={primaryCta.action} className="gap-2">
            {primaryCta.label}
            <primaryCta.icon className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            onClick={() => navigate(`/projects/${id}`)}
            className="text-muted-foreground"
          >
            Back to Dashboard
          </Button>
        </motion.div>
      </div>
    </ProjectLayout>
  );
}
