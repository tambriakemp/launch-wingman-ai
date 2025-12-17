import { Card } from "@/components/ui/card";
import { Check, AlertCircle, Circle, User, Zap, Target, Shield, Clock } from "lucide-react";
import { Progress } from "@/components/ui/progress";

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

type SectionStatus = 'complete' | 'partial' | 'missing';

interface SectionInfo {
  name: string;
  icon: React.ReactNode;
  status: SectionStatus;
  summary: string;
  improvement?: string;
  score: number; // 0-20 for each section
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
  // Count elements by type
  const objectionCount = likelihoodElements.filter(e => e.type === 'objection_counter').length;
  const proofCount = likelihoodElements.filter(e => e.type === 'proof').length;
  const credibilityCount = likelihoodElements.filter(e => e.type === 'credibility').length;
  const totalLikelihood = likelihoodElements.length;

  const quickWinCount = timeEffortElements.filter(e => e.type === 'quick_win').length;
  const frictionReducerCount = timeEffortElements.filter(e => e.type === 'friction_reducer').length;
  const totalTimeEffort = timeEffortElements.length;

  // Calculate section statuses and scores
  const calculateSections = (): SectionInfo[] => {
    const sections: SectionInfo[] = [];

    // WHO Section (20 points max)
    const hasNiche = !!niche;
    const hasAudience = !!targetAudience;
    const hasGoodSpecificity = specificityScore >= 6;
    let whoScore = 0;
    if (hasNiche) whoScore += 7;
    if (hasAudience) whoScore += 7;
    if (hasGoodSpecificity) whoScore += 6;
    
    let whoStatus: SectionStatus = 'missing';
    let whoSummary = 'Define your niche and target audience';
    let whoImprovement: string | undefined;
    
    if (hasNiche && hasAudience) {
      if (hasGoodSpecificity) {
        whoStatus = 'complete';
        whoSummary = `${niche} → ${targetAudience.substring(0, 50)}${targetAudience.length > 50 ? '...' : ''}`;
      } else {
        whoStatus = 'partial';
        whoSummary = `${niche} → ${targetAudience.substring(0, 40)}${targetAudience.length > 40 ? '...' : ''}`;
        whoImprovement = 'Make your audience description more specific';
      }
    } else if (hasNiche || hasAudience) {
      whoStatus = 'partial';
      whoSummary = hasNiche ? `${niche} (add target audience)` : 'Add niche selection';
      whoImprovement = hasNiche ? 'Describe your target audience' : 'Select your niche';
    } else {
      whoImprovement = 'Start by selecting your niche';
    }

    sections.push({
      name: 'WHO',
      icon: <User className="w-4 h-4" />,
      status: whoStatus,
      summary: whoSummary,
      improvement: whoImprovement,
      score: whoScore,
    });

    // PAIN Section (20 points max)
    const hasPain = !!primaryPainPoint;
    const symptomsCount = painSymptoms.length;
    const hasEnoughSymptoms = symptomsCount >= 2;
    let painScore = 0;
    if (hasPain) painScore += 10;
    painScore += Math.min(symptomsCount * 2.5, 10); // Up to 10 points for symptoms

    let painStatus: SectionStatus = 'missing';
    let painSummary = 'Define the primary pain point';
    let painImprovement: string | undefined;

    if (hasPain) {
      if (hasEnoughSymptoms) {
        painStatus = 'complete';
        painSummary = `${primaryPainPoint.substring(0, 40)}${primaryPainPoint.length > 40 ? '...' : ''} (${symptomsCount} symptoms)`;
      } else {
        painStatus = 'partial';
        painSummary = `${primaryPainPoint.substring(0, 40)}${primaryPainPoint.length > 40 ? '...' : ''}`;
        painImprovement = symptomsCount === 0 
          ? 'Add pain symptoms to show deep understanding' 
          : `Add ${2 - symptomsCount} more pain symptom${2 - symptomsCount > 1 ? 's' : ''}`;
      }
    } else {
      painImprovement = 'Describe their biggest frustration or struggle';
    }

    sections.push({
      name: 'PAIN',
      icon: <Zap className="w-4 h-4" />,
      status: painStatus,
      summary: painSummary,
      improvement: painImprovement,
      score: painScore,
    });

    // OUTCOME Section (20 points max)
    const hasOutcome = !!desiredOutcome;
    const outcomeScore = hasOutcome ? 20 : 0;

    let outcomeStatus: SectionStatus = hasOutcome ? 'complete' : 'missing';
    let outcomeSummary = hasOutcome 
      ? `${desiredOutcome.substring(0, 60)}${desiredOutcome.length > 60 ? '...' : ''}`
      : 'Define the dream outcome';
    let outcomeImprovement = hasOutcome ? undefined : 'What transformation do they want?';

    sections.push({
      name: 'OUTCOME',
      icon: <Target className="w-4 h-4" />,
      status: outcomeStatus,
      summary: outcomeSummary,
      improvement: outcomeImprovement,
      score: outcomeScore,
    });

    // CREDIBILITY Section (20 points max)
    const hasEnoughLikelihood = totalLikelihood >= 3;
    let likelihoodScore = Math.min(totalLikelihood * 5, 20);

    let likelihoodStatus: SectionStatus = 'missing';
    let likelihoodSummary = 'Add proof and credibility elements';
    let likelihoodImprovement: string | undefined;

    if (totalLikelihood > 0) {
      const parts: string[] = [];
      if (objectionCount > 0) parts.push(`${objectionCount} objection counter${objectionCount > 1 ? 's' : ''}`);
      if (proofCount > 0) parts.push(`${proofCount} proof element${proofCount > 1 ? 's' : ''}`);
      if (credibilityCount > 0) parts.push(`${credibilityCount} credibility builder${credibilityCount > 1 ? 's' : ''}`);
      
      if (hasEnoughLikelihood) {
        likelihoodStatus = 'complete';
        likelihoodSummary = parts.join(', ');
      } else {
        likelihoodStatus = 'partial';
        likelihoodSummary = parts.join(', ');
        likelihoodImprovement = `Add ${3 - totalLikelihood} more element${3 - totalLikelihood > 1 ? 's' : ''} to build trust`;
      }
    } else {
      likelihoodImprovement = 'Add objection counters, proof, or credentials';
    }

    sections.push({
      name: 'CREDIBILITY',
      icon: <Shield className="w-4 h-4" />,
      status: likelihoodStatus,
      summary: likelihoodSummary,
      improvement: likelihoodImprovement,
      score: likelihoodScore,
    });

    // TIME + EFFORT Section (20 points max)
    const hasEnoughTimeEffort = totalTimeEffort >= 2;
    let timeEffortScore = Math.min(totalTimeEffort * 5, 20);

    let timeEffortStatus: SectionStatus = 'missing';
    let timeEffortSummary = 'Add quick wins and friction reducers';
    let timeEffortImprovement: string | undefined;

    if (totalTimeEffort > 0) {
      const parts: string[] = [];
      if (quickWinCount > 0) parts.push(`${quickWinCount} quick win${quickWinCount > 1 ? 's' : ''}`);
      if (frictionReducerCount > 0) parts.push(`${frictionReducerCount} friction reducer${frictionReducerCount > 1 ? 's' : ''}`);
      
      if (hasEnoughTimeEffort) {
        timeEffortStatus = 'complete';
        timeEffortSummary = parts.join(', ');
      } else {
        timeEffortStatus = 'partial';
        timeEffortSummary = parts.join(', ');
        timeEffortImprovement = `Add ${2 - totalTimeEffort} more to show the journey is achievable`;
      }
    } else {
      timeEffortImprovement = 'Show how you reduce time and effort';
    }

    sections.push({
      name: 'EFFORT',
      icon: <Clock className="w-4 h-4" />,
      status: timeEffortStatus,
      summary: timeEffortSummary,
      improvement: timeEffortImprovement,
      score: timeEffortScore,
    });

    return sections;
  };

  const sections = calculateSections();
  const totalScore = sections.reduce((sum, s) => sum + s.score, 0);
  const scorePercentage = totalScore;

  // Get improvements needed (sections that aren't complete)
  const improvements = sections
    .filter(s => s.status !== 'complete' && s.improvement)
    .slice(0, 3);

  const getStatusIcon = (status: SectionStatus) => {
    switch (status) {
      case 'complete':
        return <Check className="w-4 h-4 text-green-500" />;
      case 'partial':
        return <AlertCircle className="w-4 h-4 text-amber-500" />;
      default:
        return <Circle className="w-4 h-4 text-muted-foreground/40" />;
    }
  };

  const getStatusColor = (status: SectionStatus) => {
    switch (status) {
      case 'complete':
        return 'text-foreground';
      case 'partial':
        return 'text-amber-600 dark:text-amber-400';
      default:
        return 'text-muted-foreground';
    }
  };

  const getScoreColor = () => {
    if (scorePercentage >= 80) return 'text-green-500';
    if (scorePercentage >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  const getProgressIndicatorColor = () => {
    if (scorePercentage >= 80) return 'bg-green-500';
    if (scorePercentage >= 50) return 'bg-amber-500';
    return 'bg-destructive';
  };

  const hasAnyContent = sections.some(s => s.status !== 'missing');

  if (!hasAnyContent) {
    return (
      <Card className="p-4 bg-muted/30 border-dashed">
        <p className="text-sm text-muted-foreground text-center">
          Complete the sections below to see your Value Equation score
        </p>
      </Card>
    );
  }

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/5 via-background to-primary/5 border-primary/20">
      {/* Header with Score */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-foreground">Value Equation Score</h3>
          <div className="flex items-center gap-3 mt-1">
            <Progress 
              value={scorePercentage} 
              className="flex-1 h-2 bg-muted"
              indicatorClassName={getProgressIndicatorColor()}
            />
            <span className={`text-lg font-bold ${getScoreColor()}`}>
              {scorePercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Section Checklist */}
      <div className="space-y-2">
        {sections.map((section) => (
          <div 
            key={section.name} 
            className={`flex items-start gap-2 p-2 rounded-lg transition-colors ${
              section.status === 'complete' 
                ? 'bg-green-500/10' 
                : section.status === 'partial' 
                  ? 'bg-amber-500/10' 
                  : 'bg-muted/30'
            }`}
          >
            <div className="flex items-center gap-2 min-w-[100px]">
              {getStatusIcon(section.status)}
              <span className={`text-xs font-semibold ${getStatusColor(section.status)}`}>
                {section.name}
              </span>
            </div>
            <p className={`text-xs flex-1 ${getStatusColor(section.status)}`}>
              {section.summary}
            </p>
          </div>
        ))}
      </div>

      {/* What's Missing Section */}
      {improvements.length > 0 && (
        <div className="mt-4 pt-3 border-t border-border/50">
          <h4 className="text-xs font-semibold text-muted-foreground mb-2">
            To improve your score:
          </h4>
          <ul className="space-y-1">
            {improvements.map((section, i) => (
              <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>{section.improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
};
