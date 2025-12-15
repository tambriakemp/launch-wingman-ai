import { Card } from "@/components/ui/card";
import { User, Target, Zap, Shield, BarChart3, GraduationCap } from "lucide-react";

interface LikelihoodElement {
  type: 'objection_counter' | 'proof' | 'credibility';
  text: string;
}

interface AudienceProfileCardProps {
  niche: string;
  targetAudience: string;
  primaryPainPoint: string;
  desiredOutcome: string;
  specificityScore?: number;
  likelihoodElements?: LikelihoodElement[];
}

export const AudienceProfileCard = ({
  niche,
  targetAudience,
  primaryPainPoint,
  desiredOutcome,
  specificityScore = 0,
  likelihoodElements = [],
}: AudienceProfileCardProps) => {
  const hasContent = niche || targetAudience || primaryPainPoint || desiredOutcome;

  const getScoreColor = (score: number) => {
    if (score >= 7) return "text-green-500";
    if (score >= 4) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return "Highly Specific";
    if (score >= 6) return "Good";
    if (score >= 4) return "Needs Work";
    return "Too Vague";
  };

  // Count likelihood elements by type
  const objectionCount = likelihoodElements.filter(e => e.type === 'objection_counter').length;
  const proofCount = likelihoodElements.filter(e => e.type === 'proof').length;
  const credibilityCount = likelihoodElements.filter(e => e.type === 'credibility').length;
  const hasLikelihoodElements = likelihoodElements.length > 0;

  if (!hasContent) {
    return (
      <Card className="p-4 bg-muted/30 border-dashed">
        <p className="text-sm text-muted-foreground text-center">
          Complete the sections below to see your audience profile preview
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">
              {niche ? `${niche}` : "No niche selected"}
              {targetAudience && ` → ${targetAudience}`}
            </span>
          </div>
          
          {primaryPainPoint && (
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-destructive" />
              <span className="text-sm text-muted-foreground">
                Pain: {primaryPainPoint}
              </span>
            </div>
          )}
          
          {desiredOutcome && (
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-green-500" />
              <span className="text-sm text-muted-foreground">
                Outcome: {desiredOutcome}
              </span>
            </div>
          )}

          {hasLikelihoodElements && (
            <div className="flex items-center gap-4 pt-1">
              <span className="text-xs text-muted-foreground">Credibility:</span>
              {objectionCount > 0 && (
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-blue-500" />
                  <span className="text-xs text-blue-600">{objectionCount}</span>
                </div>
              )}
              {proofCount > 0 && (
                <div className="flex items-center gap-1">
                  <BarChart3 className="w-3 h-3 text-green-500" />
                  <span className="text-xs text-green-600">{proofCount}</span>
                </div>
              )}
              {credibilityCount > 0 && (
                <div className="flex items-center gap-1">
                  <GraduationCap className="w-3 h-3 text-purple-500" />
                  <span className="text-xs text-purple-600">{credibilityCount}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {specificityScore > 0 && (
          <div className="text-right">
            <div className={`text-2xl font-bold ${getScoreColor(specificityScore)}`}>
              {specificityScore}/10
            </div>
            <div className={`text-xs ${getScoreColor(specificityScore)}`}>
              {getScoreLabel(specificityScore)}
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
