import { useParams, Link } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { motion } from "framer-motion";
import {
  Users,
  Sparkles,
  Target,
  Package,
  Rocket,
  FileText,
  Calendar,
  MessageSquare,
  ArrowLeft,
} from "lucide-react";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectSummary } from "@/hooks/useProjectSummary";

// Map funnel types to readable names
const FUNNEL_TYPE_NAMES: Record<string, string> = {
  "webinar-funnel": "Webinar Funnel",
  "challenge-funnel": "Challenge Funnel",
  "video-series-funnel": "Video Series Funnel",
  "direct-sales-funnel": "Direct Sales Funnel",
  "lead-magnet-funnel": "Lead Magnet Funnel",
};

function SummaryCard({
  icon: Icon,
  title,
  children,
  delay = 0,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
    >
      <Card className="h-full border bg-card hover:bg-accent/5 transition-colors">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <span className="text-sm font-medium">{title}</span>
          </div>
          <div>{children}</div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-sm text-muted-foreground/60 italic">{message}</p>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i} className="h-full">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Skeleton className="w-8 h-8 rounded-lg" />
              <Skeleton className="h-4 w-24" />
            </div>
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ProjectSummary() {
  const { id } = useParams();
  const { data, isLoading } = useProjectSummary(id);

  return (
    <ProjectLayout>
      <div className="space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Link
            to={`/projects/${id}`}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-semibold text-foreground">
              {isLoading ? (
                <Skeleton className="h-8 w-48" />
              ) : (
                data?.projectName || "Project Summary"
              )}
            </h1>
            <p className="text-muted-foreground">
              A reflection of what you've built so far
            </p>
          </div>
        </motion.div>

        {/* Summary Cards Grid */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : data ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {/* Audience & Problem */}
            <SummaryCard icon={Users} title="Audience & Problem" delay={0.05}>
              {data.niche || data.targetAudience || data.primaryPainPoint ? (
                <div className="space-y-2">
                  {data.niche && (
                    <div>
                      <span className="text-xs text-muted-foreground">Niche</span>
                      <p className="text-sm text-foreground">{data.niche}</p>
                    </div>
                  )}
                  {data.targetAudience && (
                    <div>
                      <span className="text-xs text-muted-foreground">Who you serve</span>
                      <p className="text-sm text-foreground">{data.targetAudience}</p>
                    </div>
                  )}
                  {data.primaryPainPoint && (
                    <div>
                      <span className="text-xs text-muted-foreground">Their main struggle</span>
                      <p className="text-sm text-foreground line-clamp-2">{data.primaryPainPoint}</p>
                    </div>
                  )}
                </div>
              ) : (
                <EmptyState message="Not yet defined" />
              )}
            </SummaryCard>

            {/* Dream Outcome */}
            <SummaryCard icon={Target} title="Dream Outcome" delay={0.1}>
              {data.desiredOutcome ? (
                <p className="text-sm text-foreground leading-relaxed line-clamp-4">
                  {data.desiredOutcome}
                </p>
              ) : (
                <EmptyState message="Not yet defined" />
              )}
            </SummaryCard>

            {/* Transformation */}
            <SummaryCard icon={Sparkles} title="Transformation" delay={0.15}>
              {data.transformationStatement ? (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                  <p className="text-sm text-foreground italic leading-relaxed line-clamp-3">
                    "{data.transformationStatement}"
                  </p>
                </div>
              ) : (
                <EmptyState message="Not yet crafted" />
              )}
            </SummaryCard>

            {/* Offer Snapshot */}
            <SummaryCard icon={Package} title="Offer Snapshot" delay={0.2}>
              {data.offers.length > 0 ? (
                <div className="space-y-2">
                  {data.offers.slice(0, 2).map((offer, i) => (
                    <div
                      key={i}
                      className="p-2 rounded-lg bg-accent/30 border border-border/30"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground truncate">
                          {offer.title || offer.offerType}
                        </span>
                        {offer.price !== null && (
                          <span className="text-xs text-muted-foreground ml-2 flex-shrink-0">
                            ${offer.price.toLocaleString()}
                            {offer.priceType === "recurring" && "/mo"}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {data.offers.length > 2 && (
                    <p className="text-xs text-muted-foreground">
                      +{data.offers.length - 2} more
                    </p>
                  )}
                </div>
              ) : (
                <EmptyState message="No offers configured yet" />
              )}
            </SummaryCard>

            {/* Funnel Type */}
            <SummaryCard icon={Rocket} title="Funnel Type" delay={0.25}>
              {data.funnelType ? (
                <div className="p-3 rounded-lg bg-accent/30 border border-border/30">
                  <p className="text-sm font-medium text-foreground">
                    {FUNNEL_TYPE_NAMES[data.funnelType] || data.funnelType}
                  </p>
                </div>
              ) : (
                <EmptyState message="Not yet selected" />
              )}
            </SummaryCard>

            {/* Messaging Highlights */}
            <SummaryCard icon={MessageSquare} title="Messaging" delay={0.3}>
              {data.hasSalesCopy || data.hasEmailSequences || data.hasDeliverableCopy ? (
                <div className="flex flex-wrap gap-2">
                  {data.hasSalesCopy && (
                    <Badge variant="outline" className="text-xs">
                      Sales Copy
                    </Badge>
                  )}
                  {data.hasEmailSequences && (
                    <Badge variant="outline" className="text-xs">
                      Email Sequences
                    </Badge>
                  )}
                  {data.hasDeliverableCopy && (
                    <Badge variant="outline" className="text-xs">
                      Deliverable Copy
                    </Badge>
                  )}
                </div>
              ) : (
                <EmptyState message="No messaging created yet" />
              )}
            </SummaryCard>

            {/* Content Themes */}
            <SummaryCard icon={FileText} title="Content Themes" delay={0.35}>
              {data.contentThemes.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {data.contentThemes.map((theme, i) => (
                    <Badge key={i} variant="secondary" className="text-xs font-normal">
                      {theme}
                    </Badge>
                  ))}
                </div>
              ) : (
                <EmptyState message="No content themes yet" />
              )}
            </SummaryCard>

            {/* Launch Window */}
            <SummaryCard icon={Calendar} title="Launch Window" delay={0.4}>
              {data.launchDate ? (
                <div className="p-3 rounded-lg bg-accent/30 border border-border/30">
                  <p className="text-sm font-medium text-foreground">
                    {format(parseISO(data.launchDate), "MMMM d, yyyy")}
                  </p>
                </div>
              ) : (
                <EmptyState message="No launch date set" />
              )}
            </SummaryCard>
          </div>
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            Unable to load summary
          </div>
        )}

        {/* Reflective footer */}
        {data && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="pt-4"
          >
            <p className="text-sm text-muted-foreground text-center italic">
              Does this still feel right?
            </p>
          </motion.div>
        )}
      </div>
    </ProjectLayout>
  );
}
