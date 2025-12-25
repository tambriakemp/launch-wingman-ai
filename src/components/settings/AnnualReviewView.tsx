import { motion } from "framer-motion";
import { format, parseISO } from "date-fns";
import { X, BookOpen, Users, Target, GitBranch, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnnualReview } from "@/hooks/useAnnualReview";

// Map funnel types to human-readable labels
const FUNNEL_TYPE_LABELS: Record<string, string> = {
  "webinar-funnel": "Live Training → Offer",
  "challenge-funnel": "Challenge → Offer",
  "video-series-funnel": "Video Series → Offer",
  "direct-sales-funnel": "Content → Offer",
  "lead-magnet-funnel": "Freebie → Email → Offer",
  "application-funnel": "Application → Call",
};

interface AnnualReviewViewProps {
  onClose: () => void;
}

function SectionCard({
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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
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

function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-5 w-96" />
      <div className="grid gap-5 md:grid-cols-2">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
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

export function AnnualReviewView({ onClose }: AnnualReviewViewProps) {
  const { data, isLoading } = useAnnualReview();

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <LoadingSkeleton />
      </div>
    );
  }

  if (!data || !data.isEligible) {
    return (
      <div className="max-w-4xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Annual Review</h1>
            <p className="text-muted-foreground mt-1">
              Complete at least 2 projects to unlock your annual review.
            </p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </motion.div>

        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              You have {data?.totalCompleted || 0} completed project{data?.totalCompleted !== 1 ? "s" : ""}.
              <br />
              Complete {2 - (data?.totalCompleted || 0)} more to see your annual reflection.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between gap-4"
      >
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-foreground">Your Year in Review</h1>
          <p className="text-muted-foreground">
            This isn't a performance review — just a moment to reflect.
          </p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="flex-shrink-0">
          <X className="w-5 h-5" />
        </Button>
      </motion.div>

      {/* Projects Completed */}
      <SectionCard icon={BookOpen} title="Projects Completed" delay={0.05}>
        <ul className="space-y-2">
          {data.completedProjects.map((project) => (
            <li key={project.id} className="flex items-center justify-between py-2 border-b border-border/30 last:border-0">
              <span className="text-sm text-foreground">{project.name}</span>
              <span className="text-xs text-muted-foreground">
                {format(parseISO(project.completedAt), "MMM yyyy")}
              </span>
            </li>
          ))}
        </ul>
      </SectionCard>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Audiences Served */}
        <SectionCard icon={Users} title="Audiences You've Served" delay={0.1}>
          {data.patterns.audiences.length > 0 ? (
            <ul className="space-y-2">
              {data.patterns.audiences.slice(0, 5).map((audience, i) => (
                <li key={i} className="text-sm text-foreground flex items-start gap-2">
                  <span className="text-primary mt-1">•</span>
                  <span className="line-clamp-2">{audience}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground/70 italic">No audience data captured</p>
          )}
        </SectionCard>

        {/* Approaches Used */}
        <SectionCard icon={GitBranch} title="Approaches You've Tried" delay={0.15}>
          {data.patterns.funnelTypes.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {data.patterns.funnelTypes.map((type, i) => (
                <Badge key={i} variant="secondary" className="text-xs font-normal">
                  {FUNNEL_TYPE_LABELS[type] || type}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/70 italic">No funnel types recorded</p>
          )}
        </SectionCard>

        {/* Themes in Your Messaging */}
        <SectionCard icon={Target} title="Themes in Your Messaging" delay={0.2}>
          {data.patterns.messagingThemes.length > 0 ? (
            <ul className="space-y-2">
              {data.patterns.messagingThemes.slice(0, 4).map((theme, i) => (
                <li key={i} className="text-sm text-foreground italic line-clamp-2">
                  "{theme}"
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground/70 italic">No messaging themes captured</p>
          )}
        </SectionCard>

        {/* What Stayed Consistent */}
        <SectionCard icon={Sparkles} title="What Stayed Consistent" delay={0.25}>
          {data.consistentElements.recurringAudiences.length > 0 ||
          data.consistentElements.recurringNiches.length > 0 ||
          data.consistentElements.preferredFunnelType ? (
            <div className="space-y-3">
              {data.consistentElements.recurringAudiences.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Recurring audiences</p>
                  {data.consistentElements.recurringAudiences.map((audience, i) => (
                    <p key={i} className="text-sm text-foreground line-clamp-2">{audience}</p>
                  ))}
                </div>
              )}
              {data.consistentElements.recurringNiches.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Recurring niches</p>
                  {data.consistentElements.recurringNiches.map((niche, i) => (
                    <p key={i} className="text-sm text-foreground">{niche}</p>
                  ))}
                </div>
              )}
              {data.consistentElements.preferredFunnelType && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Go-to approach</p>
                  <Badge variant="outline" className="text-xs font-normal">
                    {FUNNEL_TYPE_LABELS[data.consistentElements.preferredFunnelType] ||
                      data.consistentElements.preferredFunnelType}
                  </Badge>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground/70 italic">
              No strong patterns yet — each project was unique
            </p>
          )}
        </SectionCard>
      </div>

      {/* Footer note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center text-sm text-muted-foreground pt-4"
      >
        This is simply a snapshot of how your thinking looked at different moments.
      </motion.p>
    </div>
  );
}
