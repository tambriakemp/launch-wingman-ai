import { Card } from "@/components/ui/card";
import { User, Target, Zap, Shield, BarChart3, GraduationCap, Flame, BoltIcon, Route } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface LikelihoodElement {
  type: 'objection_counter' | 'proof' | 'credibility';
  text: string;
}

interface TimeEffortElement {
  type: 'quick_win' | 'friction_reducer';
  text: string;
}

interface AudienceProfileCardProps {
  niche: string;
  targetAudience: string;
  primaryPainPoint: string;
  desiredOutcome: string;
  specificityScore?: number;
  likelihoodElements?: LikelihoodElement[];
  painSymptoms?: string[];
  timeEffortElements?: TimeEffortElement[];
}

export const AudienceProfileCard = ({
  niche,
  targetAudience,
  primaryPainPoint,
  desiredOutcome,
  specificityScore = 0,
  likelihoodElements = [],
  painSymptoms = [],
  timeEffortElements = [],
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

  // Count time/effort elements by type
  const quickWinCount = timeEffortElements.filter(e => e.type === 'quick_win').length;
  const frictionReducerCount = timeEffortElements.filter(e => e.type === 'friction_reducer').length;
  const hasTimeEffortElements = timeEffortElements.length > 0;

  // Pain symptoms count
  const painSymptomsCount = painSymptoms.length;

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
    <TooltipProvider>
      <Card className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-3">
            {/* WHO Section */}
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">
                {niche ? `${niche}` : "No niche selected"}
                {targetAudience && ` → ${targetAudience}`}
              </span>
            </div>
            
            {/* PAIN Section */}
            {primaryPainPoint && (
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-destructive" />
                <span className="text-sm text-muted-foreground">
                  Pain: {primaryPainPoint}
                </span>
                {painSymptomsCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex items-center gap-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-0.5 rounded-full">
                        <Flame className="w-3 h-3" />
                        {painSymptomsCount}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">Pain Symptoms</p>
                      <p className="text-xs text-muted-foreground">Specific symptoms your audience experiences</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}
            
            {/* OUTCOME Section */}
            {desiredOutcome && (
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">
                  Outcome: {desiredOutcome}
                </span>
              </div>
            )}

            {/* CREDIBILITY Section - Likelihood Elements */}
            {hasLikelihoodElements && (
              <div className="flex items-center gap-4 pt-1">
                <span className="text-xs text-muted-foreground">Credibility:</span>
                {objectionCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 cursor-help">
                        <Shield className="w-3 h-3 text-blue-500" />
                        <span className="text-xs text-blue-600 dark:text-blue-400">{objectionCount}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">Objection Counters</p>
                      <p className="text-xs text-muted-foreground">Elements that address common doubts and hesitations</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {proofCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 cursor-help">
                        <BarChart3 className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-600 dark:text-green-400">{proofCount}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">Proof Elements</p>
                      <p className="text-xs text-muted-foreground">Data, results, testimonials, and case studies</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {credibilityCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 cursor-help">
                        <GraduationCap className="w-3 h-3 text-purple-500" />
                        <span className="text-xs text-purple-600 dark:text-purple-400">{credibilityCount}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">Credibility Builders</p>
                      <p className="text-xs text-muted-foreground">Credentials, experience, and expertise markers</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            )}

            {/* TIME + EFFORT Section */}
            {hasTimeEffortElements && (
              <div className="flex items-center gap-4 pt-1">
                <span className="text-xs text-muted-foreground">Effort:</span>
                {quickWinCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 cursor-help">
                        <BoltIcon className="w-3 h-3 text-amber-500" />
                        <span className="text-xs text-amber-600 dark:text-amber-400">{quickWinCount}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">Quick Wins</p>
                      <p className="text-xs text-muted-foreground">Fast results that show immediate progress</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {frictionReducerCount > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 cursor-help">
                        <Route className="w-3 h-3 text-teal-500" />
                        <span className="text-xs text-teal-600 dark:text-teal-400">{frictionReducerCount}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="font-medium">Friction Reducers</p>
                      <p className="text-xs text-muted-foreground">Elements that make the journey easier</p>
                    </TooltipContent>
                  </Tooltip>
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
    </TooltipProvider>
  );
};
