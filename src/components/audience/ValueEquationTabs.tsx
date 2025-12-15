import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Check, Circle } from "lucide-react";
import { WhoTab } from "./WhoTab";

interface SubAudience {
  name: string;
  description: string;
  painTrigger: string;
}

export interface ValueEquationData {
  // WHO tab
  niche: string;
  targetAudience: string;
  subAudiences: SubAudience[];
  specificityScore: number;
  // DREAM OUTCOME tab
  desiredOutcome: string;
  // PAIN tab
  primaryPainPoint: string;
  // LIKELIHOOD tab (placeholder for Phase 1d)
  // TIME+EFFORT tab (placeholder for Phase 1d)
  // Legacy field
  problemStatement: string;
}

interface ValueEquationTabsProps {
  data: ValueEquationData;
  onChange: (data: ValueEquationData) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TabCompletionIndicator = ({ isComplete }: { isComplete: boolean }) => {
  return isComplete ? (
    <Check className="w-3.5 h-3.5 text-green-500" />
  ) : (
    <Circle className="w-3.5 h-3.5 text-muted-foreground/50" />
  );
};

export const ValueEquationTabs = ({
  data,
  onChange,
  activeTab,
  onTabChange,
}: ValueEquationTabsProps) => {
  const updateField = <K extends keyof ValueEquationData>(
    field: K,
    value: ValueEquationData[K]
  ) => {
    onChange({ ...data, [field]: value });
  };

  // Completion checks for each tab
  const isWhoComplete = !!(data.niche && data.targetAudience);
  const isDreamComplete = !!data.desiredOutcome;
  const isPainComplete = !!data.primaryPainPoint;
  const isLikelihoodComplete = false; // Phase 1d
  const isTimeComplete = false; // Phase 1d

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="w-full grid grid-cols-5 h-auto p-1">
        <TabsTrigger value="who" className="flex items-center gap-1.5 text-xs py-2">
          <TabCompletionIndicator isComplete={isWhoComplete} />
          WHO
        </TabsTrigger>
        <TabsTrigger value="dream" className="flex items-center gap-1.5 text-xs py-2">
          <TabCompletionIndicator isComplete={isDreamComplete} />
          DREAM
        </TabsTrigger>
        <TabsTrigger value="pain" className="flex items-center gap-1.5 text-xs py-2">
          <TabCompletionIndicator isComplete={isPainComplete} />
          PAIN
        </TabsTrigger>
        <TabsTrigger value="likelihood" className="flex items-center gap-1.5 text-xs py-2">
          <TabCompletionIndicator isComplete={isLikelihoodComplete} />
          LIKELIHOOD
        </TabsTrigger>
        <TabsTrigger value="time" className="flex items-center gap-1.5 text-xs py-2">
          <TabCompletionIndicator isComplete={isTimeComplete} />
          TIME
        </TabsTrigger>
      </TabsList>

      <div className="mt-6">
        {/* WHO Tab */}
        <TabsContent value="who" className="mt-0">
          <WhoTab
            niche={data.niche}
            targetAudience={data.targetAudience}
            subAudiences={data.subAudiences}
            specificityScore={data.specificityScore}
            onNicheChange={(value) => updateField("niche", value)}
            onTargetAudienceChange={(value) => updateField("targetAudience", value)}
            onSubAudiencesChange={(value) => updateField("subAudiences", value)}
            onSpecificityScoreChange={(value) => updateField("specificityScore", value)}
          />
        </TabsContent>

        {/* DREAM OUTCOME Tab */}
        <TabsContent value="dream" className="mt-0 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="desiredOutcome" className="flex items-center gap-1">
              What does winning look like? <span className="text-destructive">*</span>
            </Label>
            <p className="text-sm text-muted-foreground">
              Describe the specific outcome your audience wants in 30-90 days
            </p>
            <Textarea
              id="desiredOutcome"
              placeholder="e.g., 'Finish work by 5:30 without panic' or '2 hours of deep work, 5 days/week'"
              value={data.desiredOutcome}
              onChange={(e) => updateField("desiredOutcome", e.target.value)}
              rows={4}
            />
          </div>
          <p className="text-xs text-muted-foreground italic">
            💡 More AI features coming in Phase 1b: Outcome language converter
          </p>
        </TabsContent>

        {/* PAIN Tab */}
        <TabsContent value="pain" className="mt-0 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="primaryPainPoint" className="flex items-center gap-1">
              Primary Pain Point <span className="text-destructive">*</span>
            </Label>
            <p className="text-sm text-muted-foreground">
              What's the biggest frustration or challenge they face?
            </p>
            <Textarea
              id="primaryPainPoint"
              placeholder="e.g., 'Constantly overwhelmed, starting tasks but never finishing them'"
              value={data.primaryPainPoint}
              onChange={(e) => updateField("primaryPainPoint", e.target.value)}
              rows={4}
            />
          </div>
          <p className="text-xs text-muted-foreground italic">
            💡 More AI features coming in Phase 1c: Pain category picker, symptom generator
          </p>
        </TabsContent>

        {/* LIKELIHOOD Tab (Placeholder) */}
        <TabsContent value="likelihood" className="mt-0">
          <div className="p-6 text-center border border-dashed rounded-lg">
            <p className="text-muted-foreground">
              Coming in Phase 1d: Obstacles, failed solutions, and proof type selectors
            </p>
          </div>
        </TabsContent>

        {/* TIME+EFFORT Tab (Placeholder) */}
        <TabsContent value="time" className="mt-0">
          <div className="p-6 text-center border border-dashed rounded-lg">
            <p className="text-muted-foreground">
              Coming in Phase 1d: Quick wins and friction reducers
            </p>
          </div>
        </TabsContent>
      </div>
    </Tabs>
  );
};
