import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
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

interface CollapsibleSectionProps {
  id: string;
  number: number;
  title: string;
  subtitle: string;
  isComplete: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const CollapsibleSection = ({
  number,
  title,
  subtitle,
  isComplete,
  isExpanded,
  onToggle,
  children,
}: CollapsibleSectionProps) => (
  <div className="border border-border rounded-xl overflow-hidden bg-card">
    <button
      onClick={onToggle}
      className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
    >
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
      {isExpanded ? (
        <ChevronDown className="w-5 h-5 text-muted-foreground" />
      ) : (
        <ChevronRight className="w-5 h-5 text-muted-foreground" />
      )}
    </button>

    <AnimatePresence initial={false}>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
        >
          <div className="border-t border-border p-4">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

export const ValueEquationSections = ({
  data,
  onChange,
}: ValueEquationSectionsProps) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['who', 'dream', 'pain', 'likelihood', 'time-effort'])
  );

  const toggleSection = (id: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedSections(newExpanded);
  };

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

  return (
    <div className="space-y-4">
      {/* Section 1: WHO */}
      <CollapsibleSection
        id="who"
        number={1}
        title="WHO (Your Audience)"
        subtitle="Define who you serve"
        isComplete={isWhoComplete}
        isExpanded={expandedSections.has('who')}
        onToggle={() => toggleSection('who')}
      >
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
      </CollapsibleSection>

      {/* Section 2: DREAM OUTCOME */}
      <CollapsibleSection
        id="dream"
        number={2}
        title="DREAM OUTCOME"
        subtitle="What does success look like for them?"
        isComplete={isDreamComplete}
        isExpanded={expandedSections.has('dream')}
        onToggle={() => toggleSection('dream')}
      >
        <DreamOutcomeSectionContent
          desiredOutcome={data.desiredOutcome}
          niche={data.niche}
          targetAudience={data.targetAudience}
          painPoint={data.primaryPainPoint}
          onChange={(value) => updateField("desiredOutcome", value)}
        />
      </CollapsibleSection>

      {/* Section 3: PAIN */}
      <CollapsibleSection
        id="pain"
        number={3}
        title="PAIN"
        subtitle="What's keeping them stuck?"
        isComplete={isPainComplete}
        isExpanded={expandedSections.has('pain')}
        onToggle={() => toggleSection('pain')}
      >
        <PainSectionContent
          primaryPainPoint={data.primaryPainPoint}
          painSymptoms={data.painSymptoms}
          niche={data.niche}
          targetAudience={data.targetAudience}
          onPainPointChange={(value) => updateField("primaryPainPoint", value)}
          onSymptomsChange={(symptoms) => updateField("painSymptoms", symptoms)}
        />
      </CollapsibleSection>

      {/* Section 4: PERCEIVED LIKELIHOOD */}
      <CollapsibleSection
        id="likelihood"
        number={4}
        title="PERCEIVED LIKELIHOOD"
        subtitle="Why will they believe it works?"
        isComplete={isLikelihoodComplete}
        isExpanded={expandedSections.has('likelihood')}
        onToggle={() => toggleSection('likelihood')}
      >
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
      </CollapsibleSection>

      {/* Section 5: TIME + EFFORT */}
      <CollapsibleSection
        id="time-effort"
        number={5}
        title="TIME + EFFORT"
        subtitle="How easy is the path?"
        isComplete={isTimeEffortComplete}
        isExpanded={expandedSections.has('time-effort')}
        onToggle={() => toggleSection('time-effort')}
      >
        <TimeEffortSectionContent
          timeEffortElements={data.timeEffortElements}
          niche={data.niche}
          targetAudience={data.targetAudience}
          primaryPainPoint={data.primaryPainPoint}
          desiredOutcome={data.desiredOutcome}
          onElementsChange={(elements) => updateField("timeEffortElements", elements)}
        />
      </CollapsibleSection>
    </div>
  );
};
