import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { WhoSection } from "./WhoSection";
import { DreamOutcomeSection } from "./DreamOutcomeSection";
import { PainSection } from "./PainSection";
import { LikelihoodSection, LikelihoodElement } from "./LikelihoodSection";
import { TimeEffortSection, TimeEffortElement } from "./TimeEffortSection";

interface SubAudience {
  name: string;
  description: string;
  painTrigger: string;
}

export interface ValueEquationData {
  niche: string;
  targetAudience: string;
  subAudiences: SubAudience[];
  specificityScore: number;
  desiredOutcome: string;
  primaryPainPoint: string;
  painSymptoms: string[];
  problemStatement: string;
  mainObjections: string;
  likelihoodElements: LikelihoodElement[];
  timeEffortElements: TimeEffortElement[];
}

interface ValueEquationSectionsProps {
  data: ValueEquationData;
  onChange: (data: ValueEquationData) => void;
}

const SectionHeader = ({
  number,
  title,
  subtitle,
  isComplete,
}: {
  number: number;
  title: string;
  subtitle: string;
  isComplete: boolean;
}) => (
  <div className="flex items-center gap-3">
    <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center text-sm font-semibold text-background">
      {number}
    </div>
    <div className="flex-1">
      <h3 className="font-semibold text-base">{title}</h3>
      <p className="text-sm text-muted-foreground">{subtitle}</p>
    </div>
    {isComplete && (
      <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
        <Check className="w-3 h-3 mr-1" />
        Complete
      </Badge>
    )}
  </div>
);

export const ValueEquationSections = ({
  data,
  onChange,
}: ValueEquationSectionsProps) => {
  const updateField = <K extends keyof ValueEquationData>(
    field: K,
    value: ValueEquationData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  const isWhoComplete = !!(data.niche && data.targetAudience);
  const isDreamComplete = !!data.desiredOutcome;
  const isPainComplete = !!(data.primaryPainPoint && data.painSymptoms.length > 0);
  const isLikelihoodComplete = !!(data.mainObjections && data.likelihoodElements.length > 0);

  return (
    <div className="space-y-6">
      {/* Section 1: WHO */}
      <Card>
        <CardHeader className="pb-4">
          <SectionHeader
            number={1}
            title="WHO (Your Audience)"
            subtitle="Define who you serve"
            isComplete={isWhoComplete}
          />
        </CardHeader>
        <CardContent>
          <WhoSection
            niche={data.niche}
            targetAudience={data.targetAudience}
            subAudiences={data.subAudiences}
            specificityScore={data.specificityScore}
            onNicheChange={(value) => updateField("niche", value)}
            onTargetAudienceChange={(value) => updateField("targetAudience", value)}
            onSubAudiencesChange={(value) => updateField("subAudiences", value)}
            onSpecificityScoreChange={(value) => updateField("specificityScore", value)}
          />
        </CardContent>
      </Card>

      {/* Section 2: DREAM OUTCOME */}
      <DreamOutcomeSection
        desiredOutcome={data.desiredOutcome}
        niche={data.niche}
        targetAudience={data.targetAudience}
        painPoint={data.primaryPainPoint}
        onChange={(value) => updateField("desiredOutcome", value)}
      />

      {/* Section 3: PAIN */}
      <PainSection
        primaryPainPoint={data.primaryPainPoint}
        painSymptoms={data.painSymptoms}
        niche={data.niche}
        targetAudience={data.targetAudience}
        onPainPointChange={(value) => updateField("primaryPainPoint", value)}
        onSymptomsChange={(symptoms) => updateField("painSymptoms", symptoms)}
      />

      {/* Section 4: PERCEIVED LIKELIHOOD */}
      <LikelihoodSection
        mainObjections={data.mainObjections}
        likelihoodElements={data.likelihoodElements}
        niche={data.niche}
        targetAudience={data.targetAudience}
        primaryPainPoint={data.primaryPainPoint}
        desiredOutcome={data.desiredOutcome}
        onObjectionsChange={(value) => updateField("mainObjections", value)}
        onElementsChange={(elements) => updateField("likelihoodElements", elements)}
      />

      {/* Section 5: TIME + EFFORT */}
      <TimeEffortSection
        timeEffortElements={data.timeEffortElements}
        niche={data.niche}
        targetAudience={data.targetAudience}
        primaryPainPoint={data.primaryPainPoint}
        desiredOutcome={data.desiredOutcome}
        onElementsChange={(elements) => updateField("timeEffortElements", elements)}
      />
    </div>
  );
};