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
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjectSummary } from "@/hooks/useProjectSummary";

interface ProjectSummarySheetProps {
  projectId: string | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Map funnel types to readable names
const FUNNEL_TYPE_NAMES: Record<string, string> = {
  "webinar-funnel": "Webinar Funnel",
  "challenge-funnel": "Challenge Funnel",
  "video-series-funnel": "Video Series Funnel",
  "direct-sales-funnel": "Direct Sales Funnel",
  "lead-magnet-funnel": "Lead Magnet Funnel",
};

function SummarySection({
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
      className="space-y-2"
    >
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium uppercase tracking-wider">{title}</span>
      </div>
      <div className="pl-6">{children}</div>
    </motion.div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-sm text-muted-foreground/60 italic">{message}</p>
  );
}

export function ProjectSummarySheet({
  projectId,
  open,
  onOpenChange,
}: ProjectSummarySheetProps) {
  const { data, isLoading } = useProjectSummary(projectId);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg border-l border-border/50"
      >
        <SheetHeader className="pb-4 border-b border-border/30">
          <SheetTitle className="text-xl font-semibold">
            {isLoading ? (
              <Skeleton className="h-6 w-48" />
            ) : (
              data?.projectName || "Project Summary"
            )}
          </SheetTitle>
          <SheetDescription className="text-muted-foreground">
            A reflection of what you've built so far
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-120px)] pr-4 -mr-4">
          {isLoading ? (
            <div className="space-y-6 py-6">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ))}
            </div>
          ) : data ? (
            <div className="space-y-8 py-6">
              {/* Audience & Problem */}
              <SummarySection icon={Users} title="Audience & Problem" delay={0.05}>
                {data.niche || data.targetAudience || data.primaryPainPoint ? (
                  <div className="space-y-3">
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
                        <p className="text-sm text-foreground">{data.primaryPainPoint}</p>
                      </div>
                    )}
                    {data.painSymptoms.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {data.painSymptoms.map((symptom, i) => (
                          <Badge key={i} variant="secondary" className="text-xs font-normal">
                            {symptom}
                          </Badge>
                        ))}
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

              {/* Transformation */}
              {data.transformationStatement && (
                <SummarySection icon={Sparkles} title="Transformation" delay={0.15}>
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <p className="text-sm text-foreground italic leading-relaxed">
                      "{data.transformationStatement}"
                    </p>
                  </div>
                </SummarySection>
              )}

              {/* Offer Snapshot */}
              <SummarySection icon={Package} title="Offer Snapshot" delay={0.2}>
                {data.offers.length > 0 ? (
                  <div className="space-y-2">
                    {data.offers.map((offer, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-accent/30 border border-border/30"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">
                            {offer.title || offer.offerType}
                          </span>
                          {offer.price !== null && (
                            <span className="text-xs text-muted-foreground">
                              ${offer.price.toLocaleString()}
                              {offer.priceType === "recurring" && "/mo"}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground capitalize">
                          {offer.offerType.replace(/-/g, " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState message="No offers configured yet" />
                )}
              </SummarySection>

              {/* Funnel Type */}
              <SummarySection icon={Rocket} title="Funnel Type" delay={0.25}>
                {data.funnelType ? (
                  <div className="p-3 rounded-lg bg-accent/30 border border-border/30">
                    <p className="text-sm font-medium text-foreground">
                      {FUNNEL_TYPE_NAMES[data.funnelType] || data.funnelType}
                    </p>
                  </div>
                ) : (
                  <EmptyState message="Not yet selected" />
                )}
              </SummarySection>

              {/* Messaging Highlights */}
              <SummarySection icon={MessageSquare} title="Messaging" delay={0.3}>
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
              </SummarySection>

              {/* Content Themes */}
              <SummarySection icon={FileText} title="Content Themes" delay={0.35}>
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
              </SummarySection>

              {/* Launch Window */}
              <SummarySection icon={Calendar} title="Launch Window" delay={0.4}>
                {data.launchDate ? (
                  <div className="p-3 rounded-lg bg-accent/30 border border-border/30">
                    <p className="text-sm font-medium text-foreground">
                      {format(parseISO(data.launchDate), "MMMM d, yyyy")}
                    </p>
                  </div>
                ) : (
                  <EmptyState message="No launch date set" />
                )}
              </SummarySection>

              {/* Reflective footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="pt-4 border-t border-border/30"
              >
                <p className="text-xs text-muted-foreground text-center italic">
                  Does this still feel right?
                </p>
              </motion.div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              Unable to load summary
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
