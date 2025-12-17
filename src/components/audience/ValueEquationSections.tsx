import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, ChevronRight } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { WhoSection } from "./WhoSection";
import { DreamOutcomeSectionContent } from "./DreamOutcomeSection";
import { PainSectionContent } from "./PainSection";
import { LikelihoodSectionContent, LikelihoodElement } from "./LikelihoodSection";
import { TimeEffortSectionContent, TimeEffortElement } from "./TimeEffortSection";

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

interface SectionConfig {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  isComplete: boolean;
}

export const ValueEquationSections = ({
  data,
  onChange,
}: ValueEquationSectionsProps) => {
  const [activeSection, setActiveSection] = useState<string | null>(null);

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
  const isTimeEffortComplete = data.timeEffortElements.length > 0;

  const sections: SectionConfig[] = [
    { id: "who", number: 1, title: "WHO (Your Audience)", subtitle: "Define who you serve", isComplete: isWhoComplete },
    { id: "dream", number: 2, title: "DREAM OUTCOME", subtitle: "What does success look like for them?", isComplete: isDreamComplete },
    { id: "pain", number: 3, title: "PAIN", subtitle: "What's keeping them stuck?", isComplete: isPainComplete },
    { id: "likelihood", number: 4, title: "PERCEIVED LIKELIHOOD", subtitle: "Why will they believe it works?", isComplete: isLikelihoodComplete },
    { id: "time-effort", number: 5, title: "TIME + EFFORT", subtitle: "How easy is the path?", isComplete: isTimeEffortComplete },
  ];

  const getSheetTitle = () => {
    const section = sections.find(s => s.id === activeSection);
    return section?.title || "";
  };

  const handleSaveAndClose = () => {
    setActiveSection(null);
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case "who":
        return (
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
        );
      case "dream":
        return (
          <DreamOutcomeSectionContent
            desiredOutcome={data.desiredOutcome}
            niche={data.niche}
            targetAudience={data.targetAudience}
            painPoint={data.primaryPainPoint}
            onChange={(value) => updateField("desiredOutcome", value)}
          />
        );
      case "pain":
        return (
          <PainSectionContent
            primaryPainPoint={data.primaryPainPoint}
            painSymptoms={data.painSymptoms}
            niche={data.niche}
            targetAudience={data.targetAudience}
            onPainPointChange={(value) => updateField("primaryPainPoint", value)}
            onSymptomsChange={(symptoms) => updateField("painSymptoms", symptoms)}
          />
        );
      case "likelihood":
        return (
          <LikelihoodSectionContent
            mainObjections={data.mainObjections}
            likelihoodElements={data.likelihoodElements}
            niche={data.niche}
            targetAudience={data.targetAudience}
            primaryPainPoint={data.primaryPainPoint}
            desiredOutcome={data.desiredOutcome}
            onObjectionsChange={(value) => updateField("mainObjections", value)}
            onElementsChange={(elements) => updateField("likelihoodElements", elements)}
          />
        );
      case "time-effort":
        return (
          <TimeEffortSectionContent
            timeEffortElements={data.timeEffortElements}
            niche={data.niche}
            targetAudience={data.targetAudience}
            primaryPainPoint={data.primaryPainPoint}
            desiredOutcome={data.desiredOutcome}
            onElementsChange={(elements) => updateField("timeEffortElements", elements)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="border border-border rounded-xl overflow-hidden bg-card">
        {sections.map((section, index) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left ${
              index !== sections.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-foreground flex items-center justify-center text-sm font-semibold text-background">
              {section.number}
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-base">{section.title}</h3>
              <p className="text-sm text-muted-foreground">{section.subtitle}</p>
            </div>
            {section.isComplete && (
              <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">
                <Check className="w-3 h-3 mr-1" />
                Complete
              </Badge>
            )}
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        ))}
      </div>

      <Sheet open={!!activeSection} onOpenChange={(open) => !open && setActiveSection(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto flex flex-col">
          <SheetHeader>
            <SheetTitle>{getSheetTitle()}</SheetTitle>
          </SheetHeader>
          <div className="mt-6 flex-1">
            {renderSectionContent()}
          </div>
          {/* Save & Close button at bottom */}
          <div className="flex justify-end pt-4 border-t border-border mt-6">
            <Button onClick={handleSaveAndClose}>
              Save & Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
