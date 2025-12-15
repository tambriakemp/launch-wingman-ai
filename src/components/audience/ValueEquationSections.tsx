import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";
import { WhoSection } from "./WhoSection";

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
  problemStatement: string;
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
    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
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
  const isPainComplete = !!data.primaryPainPoint;

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
      <Card>
        <CardHeader className="pb-4">
          <SectionHeader
            number={2}
            title="DREAM OUTCOME"
            subtitle="What does success look like for them?"
            isComplete={isDreamComplete}
          />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="desiredOutcome" className="flex items-center gap-1">
              Desired Outcome <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="desiredOutcome"
              placeholder="Describe the specific transformation or result your audience wants to achieve..."
              value={data.desiredOutcome}
              onChange={(e) => updateField("desiredOutcome", e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Example: "Go from overwhelmed solopreneur to confident CEO running a 6-figure business with a team"
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: PAIN */}
      <Card>
        <CardHeader className="pb-4">
          <SectionHeader
            number={3}
            title="PAIN"
            subtitle="What's keeping them stuck?"
            isComplete={isPainComplete}
          />
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="primaryPainPoint" className="flex items-center gap-1">
              Primary Pain Point <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="primaryPainPoint"
              placeholder="What's the biggest frustration, challenge, or obstacle they face?"
              value={data.primaryPainPoint}
              onChange={(e) => updateField("primaryPainPoint", e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Example: "Constantly juggling tasks, never finishing what they start, feeling like they're falling behind"
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 4: PERCEIVED LIKELIHOOD (Coming Soon) */}
      <Card className="opacity-60">
        <CardHeader className="pb-4">
          <SectionHeader
            number={4}
            title="PERCEIVED LIKELIHOOD"
            subtitle="Why will they believe it works?"
            isComplete={false}
          />
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center border border-dashed rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Coming soon: Define obstacles, proof elements, and credibility builders
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Section 5: TIME + EFFORT (Coming Soon) */}
      <Card className="opacity-60">
        <CardHeader className="pb-4">
          <SectionHeader
            number={5}
            title="TIME + EFFORT"
            subtitle="How easy is the path?"
            isComplete={false}
          />
        </CardHeader>
        <CardContent>
          <div className="p-4 text-center border border-dashed rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground">
              Coming soon: Quick wins and friction reducers
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
