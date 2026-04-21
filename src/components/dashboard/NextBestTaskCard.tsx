import { useNavigate, Link, useParams } from "react-router-dom";
import { ArrowRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div
      className="rounded-xl bg-card p-6 space-y-4 border border-[hsl(var(--hairline))]"
      style={{
        boxShadow:
          "0 1px 1px rgba(31,27,23,.04), 0 8px 24px -8px rgba(31,27,23,.06)",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="eyebrow">Next</span>
        {projectId && (
          <Link
            to={`/projects/${projectId}/library?article=${APP_LEVEL_LEARN_MORE.dashboard}`}
            className="text-xs text-muted-foreground hover:text-[hsl(var(--terracotta))] transition-colors"
          >
            What's this?
          </Link>
        )}
      </div>

      <div className="space-y-2">
        <h2
          className="text-2xl font-medium text-foreground leading-tight"
          style={{ fontFamily: '"Playfair Display", Georgia, serif' }}
        >
          {title}
        </h2>
        <p className="text-muted-foreground leading-relaxed">{whyItMatters}</p>
      </div>

      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span>Estimated time: {estimatedMinutes} minutes</span>
      </div>

      <Button
        size="lg"
        onClick={() => navigate(route)}
        className="rounded-full bg-foreground text-background hover:bg-foreground/90"
      >
        Start this step
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
};
