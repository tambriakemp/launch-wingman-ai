import { useNavigate, Link, useParams } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APP_LEVEL_LEARN_MORE } from "@/data/taskLearnMoreLinks";

interface NextBestTaskCardProps {
  title: string;
  whyItMatters: string;
  estimatedMinutes: string;
  route: string;
}

export const NextBestTaskCard = ({
  title,
  whyItMatters,
  estimatedMinutes,
  route,
}: NextBestTaskCardProps) => {
  const navigate = useNavigate();
  const { id: projectId } = useParams();

  return (
    <Card className="border-2 border-primary/20 bg-card shadow-sm">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs font-semibold uppercase tracking-wider bg-primary/10 text-primary border-primary/20">
            Next Step
          </Badge>
          {/* Learn more link for dashboard */}
          {projectId && (
            <Link
              to={`/projects/${projectId}/library?article=${APP_LEVEL_LEARN_MORE.dashboard}`}
              className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
            >
              What's this?
            </Link>
          )}
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="text-muted-foreground leading-relaxed">{whyItMatters}</p>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          <span>Estimated time: {estimatedMinutes} minutes</span>
        </div>

        <Button 
          className="w-full" 
          size="lg"
          onClick={() => navigate(route)}
        >
          Start this step
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
};
