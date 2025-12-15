import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, Target, Sparkles, Shield, Zap, ArrowRight } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";

interface PainSymptom {
  id: string;
  text: string;
}

interface LikelihoodElement {
  id: string;
  type: 'objection_counter' | 'proof' | 'credibility';
  text: string;
}

interface TimeEffortElement {
  id: string;
  type: 'quick_win' | 'friction_reducer';
  text: string;
}

interface AudienceSummaryCardProps {
  niche: string;
  targetAudience: string;
  primaryPainPoint: string;
  painSymptoms: PainSymptom[];
  desiredOutcome: string;
  mainObjections: string;
  likelihoodElements: LikelihoodElement[];
  timeEffortElements: TimeEffortElement[];
  specificityScore: number;
  compact?: boolean;
}

export const AudienceSummaryCard = ({
  niche,
  targetAudience,
  primaryPainPoint,
  painSymptoms,
  desiredOutcome,
  mainObjections,
  likelihoodElements,
  timeEffortElements,
  specificityScore,
  compact = false,
}: AudienceSummaryCardProps) => {
  const navigate = useNavigate();
  const { id: projectId } = useParams();

  const quickWins = timeEffortElements?.filter(e => e.type === 'quick_win') || [];
  const objectionCounters = likelihoodElements?.filter(e => e.type === 'objection_counter') || [];
  const proofElements = likelihoodElements?.filter(e => e.type === 'proof') || [];
  const credibilityElements = likelihoodElements?.filter(e => e.type === 'credibility') || [];

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-emerald-600";
    if (score >= 5) return "text-amber-600";
    return "text-red-600";
  };

  if (compact) {
    return (
      <Card className="bg-muted/30 border-border">
        <CardHeader className="pb-2 pt-4 px-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Audience Foundation
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/projects/${projectId}/audience`)}
              className="text-xs h-7 px-2"
            >
              Edit
              <ArrowRight className="w-3 h-3 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="px-4 pb-4 space-y-3">
          {/* WHO */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Target className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Who</span>
              {specificityScore > 0 && (
                <Badge variant="outline" className={cn("text-[9px] px-1 py-0 h-4", getScoreColor(specificityScore))}>
                  {specificityScore}/10
                </Badge>
              )}
            </div>
            <p className="text-xs font-medium line-clamp-2">{targetAudience || "Not defined"}</p>
          </div>

          {/* PAIN */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px]">😣</span>
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Pain</span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{primaryPainPoint || "Not defined"}</p>
          </div>

          {/* DREAM */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Dream</span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{desiredOutcome || "Not defined"}</p>
          </div>

          {/* OBSTACLES - condensed */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-muted-foreground" />
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Obstacles</span>
            </div>
            <div className="flex gap-1 flex-wrap">
              {objectionCounters.length > 0 && (
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                  {objectionCounters.length} counters
                </Badge>
              )}
              {proofElements.length > 0 && (
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                  {proofElements.length} proof
                </Badge>
              )}
              {credibilityElements.length > 0 && (
                <Badge variant="secondary" className="text-[9px] px-1.5 py-0 h-4">
                  {credibilityElements.length} cred
                </Badge>
              )}
              {objectionCounters.length === 0 && proofElements.length === 0 && credibilityElements.length === 0 && (
                <span className="text-xs text-muted-foreground">Not defined</span>
              )}
            </div>
          </div>

          {/* FAST WINS - condensed */}
          {quickWins.length > 0 && (
            <div className="pt-2 border-t border-border">
              <div className="flex items-center gap-1.5 mb-1">
                <Zap className="w-3 h-3 text-amber-500" />
                <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Fast Wins</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {quickWins.slice(0, 2).map((win) => (
                  <Badge key={win.id} variant="outline" className="text-[9px] bg-amber-500/10 border-amber-500/30 text-amber-700 px-1.5 py-0 h-4">
                    {win.text.slice(0, 25)}{win.text.length > 25 ? '...' : ''}
                  </Badge>
                ))}
                {quickWins.length > 2 && (
                  <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4">+{quickWins.length - 2}</Badge>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Full version (original)
  return (
    <Card className="bg-muted/30 border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="w-4 h-4 text-primary" />
            Your Audience Foundation
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/projects/${projectId}/audience`)}
            className="text-xs"
          >
            Edit
            <ArrowRight className="w-3 h-3 ml-1" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          This data powers your transformation statement generation
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* WHO */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Target className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Who</span>
              {specificityScore > 0 && (
                <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${getScoreColor(specificityScore)}`}>
                  {specificityScore}/10 specificity
                </Badge>
              )}
            </div>
            <p className="text-sm font-medium">{targetAudience || "Not defined"}</p>
            {niche && (
              <p className="text-xs text-muted-foreground">in {niche}</p>
            )}
          </div>

          {/* PAIN */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs">😣</span>
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pain</span>
              {painSymptoms?.length > 0 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                  +{painSymptoms.length} symptoms
                </Badge>
              )}
            </div>
            <p className="text-sm">{primaryPainPoint || "Not defined"}</p>
          </div>

          {/* DREAM */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Dream Outcome</span>
            </div>
            <p className="text-sm">{desiredOutcome || "Not defined"}</p>
          </div>

          {/* OBSTACLES */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Obstacles</span>
            </div>
            <p className="text-sm line-clamp-2">{mainObjections || "Not defined"}</p>
            {(objectionCounters.length > 0 || proofElements.length > 0 || credibilityElements.length > 0) && (
              <div className="flex gap-1 flex-wrap mt-1">
                {objectionCounters.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {objectionCounters.length} counters
                  </Badge>
                )}
                {proofElements.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {proofElements.length} proof
                  </Badge>
                )}
                {credibilityElements.length > 0 && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {credibilityElements.length} credibility
                  </Badge>
                )}
              </div>
            )}
          </div>
        </div>

        {/* FAST WINS */}
        {quickWins.length > 0 && (
          <div className="pt-3 border-t border-border">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fast Wins</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {quickWins.slice(0, 4).map((win) => (
                <Badge key={win.id} variant="outline" className="text-xs bg-amber-500/10 border-amber-500/30 text-amber-700">
                  {win.text}
                </Badge>
              ))}
              {quickWins.length > 4 && (
                <Badge variant="outline" className="text-xs">+{quickWins.length - 4} more</Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};