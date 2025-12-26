import { useState } from "react";
import { ArrowLeft, Sparkles, RefreshCw, Check, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { OutputCard } from "./OutputCard";
import { PartSelector, ModeTabs } from "./PartSelector";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp } from "lucide-react";

interface SectionEditorProps {
  sectionId: string;
  sectionLabel: string;
  mode: "ai" | "manual";
  onModeChange: (mode: "ai" | "manual") => void;
  isGenerating: boolean;
  hasGenerated: boolean;
  onGenerate: () => void;
  onSave: () => void;
  onCancel: () => void;
  offer: any;
  children: React.ReactNode;
  aiDescription?: string;
}

export const SectionEditor = ({
  sectionId,
  sectionLabel,
  mode,
  onModeChange,
  isGenerating,
  hasGenerated,
  onGenerate,
  onSave,
  onCancel,
  offer,
  children,
  aiDescription,
}: SectionEditorProps) => {
  return (
    <div className="h-full flex flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Sections
          </Button>
          <div className="h-4 w-px bg-border" />
          <h2 className="font-semibold">{sectionLabel}</h2>
        </div>
        <Button onClick={onSave}>
          <Check className="w-4 h-4 mr-1" />
          Save Section
        </Button>
      </div>

      {/* Two-Panel Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 divide-x overflow-hidden">
        {/* Left Panel - Inputs */}
        <div className="flex flex-col overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Mode Selection - Pill Tabs */}
            <ModeTabs 
              mode={mode} 
              onModeChange={onModeChange} 
              aiDescription={aiDescription}
            />

            {/* Section-specific content */}
            {children}

            {/* Generate Button (AI mode only) */}
            {mode === "ai" && (
              <Button
                onClick={onGenerate}
                disabled={isGenerating || !offer}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    {hasGenerated ? "Regenerate" : "Generate"}
                  </>
                )}
              </Button>
            )}
          </div>
        </div>

        {/* Right Panel - Outputs */}
        <div className="flex flex-col bg-muted/20 overflow-y-auto">
          <div className="p-4 border-b bg-muted/30">
            <h3 className="font-medium text-sm">Generated Outputs</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Click to select an option
            </p>
          </div>
          <div className="flex-1 p-4">
            {/* Outputs will be passed as children or through context */}
          </div>
        </div>
      </div>
    </div>
  );
};

// Hero Section Editor with part selection
interface HeroEditorContentProps {
  heroData: any;
  setHeroData: (data: any) => void;
  manualContent: string;
  setManualContent: (content: string) => void;
  mode: "ai" | "manual";
  isGenerating: boolean;
  hasGenerated: boolean;
  onGenerate: () => void;
}

export const HeroEditorContent = ({
  heroData,
  setHeroData,
  manualContent,
  setManualContent,
  mode,
}: HeroEditorContentProps) => {
  const [selectedPart, setSelectedPart] = useState("headlines");

  const parts = [
    { id: "headlines", label: "Headlines", hasContent: !!heroData?.headlines?.length },
    { id: "subheadline", label: "Subheadline", hasContent: !!heroData?.subheadline },
    { id: "cta", label: "CTA Button", hasContent: !!heroData?.cta },
  ];

  if (mode === "manual") {
    return (
      <div className="space-y-3">
        <Label className="text-sm font-medium">Hero Section Copy</Label>
        <Textarea
          placeholder="Write your hero section copy including headline, subheadline, and CTA..."
          value={manualContent}
          onChange={(e) => setManualContent(e.target.value)}
          rows={8}
        />
      </div>
    );
  }

  // AI mode - only show editing UI after generation
  if (!heroData) {
    return null;
  }

  return (
    <div className="space-y-4">
      <PartSelector parts={parts} selectedPart={selectedPart} onSelectPart={setSelectedPart} />

      <div className="pt-4 border-t">
        {selectedPart === "headlines" && heroData?.headlines && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Choose Your Headline</Label>
            <RadioGroup
              value={String(heroData.selectedHeadline)}
              onValueChange={(v) => setHeroData({ ...heroData, selectedHeadline: parseInt(v) })}
              className="space-y-2"
            >
              {heroData.headlines.map((headline: string, idx: number) => (
                <div key={idx} className="flex items-start gap-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                  <RadioGroupItem value={String(idx)} id={`headline-${idx}`} className="mt-1" />
                  <Label htmlFor={`headline-${idx}`} className="flex-1 cursor-pointer text-sm">
                    {headline}
                    {idx === heroData.recommendedHeadline && (
                      <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">Recommended</span>
                    )}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}

        {selectedPart === "subheadline" && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Subheadline</Label>
            <Textarea
              value={heroData?.subheadline || ""}
              onChange={(e) => setHeroData({ ...heroData, subheadline: e.target.value })}
              placeholder="Enter your subheadline..."
              rows={3}
            />
          </div>
        )}

        {selectedPart === "cta" && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">CTA Button Text</Label>
            <Input
              value={heroData?.cta || ""}
              onChange={(e) => setHeroData({ ...heroData, cta: e.target.value })}
              placeholder="e.g., Get Started Now"
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Benefits Editor Content
interface BenefitsEditorContentProps {
  benefitsData: any;
  setBenefitsData: (data: any) => void;
  manualContent: string;
  setManualContent: (content: string) => void;
  mode: "ai" | "manual";
}

export const BenefitsEditorContent = ({
  benefitsData,
  setBenefitsData,
  manualContent,
  setManualContent,
  mode,
}: BenefitsEditorContentProps) => {
  const addBenefit = () => {
    const newBenefits = [...(benefitsData?.benefits || []), { title: "", description: "" }];
    setBenefitsData({ benefits: newBenefits });
  };

  const removeBenefit = (idx: number) => {
    const newBenefits = (benefitsData?.benefits || []).filter((_: any, i: number) => i !== idx);
    setBenefitsData({ benefits: newBenefits });
  };

  const updateBenefit = (idx: number, field: "title" | "description", value: string) => {
    const newBenefits = [...(benefitsData?.benefits || [])];
    newBenefits[idx] = { ...newBenefits[idx], [field]: value };
    setBenefitsData({ benefits: newBenefits });
  };

  if (mode === "manual") {
    return (
      <div className="space-y-3">
        <Label className="text-sm font-medium">Key Benefits</Label>
        <Textarea
          placeholder="List your key benefits..."
          value={manualContent}
          onChange={(e) => setManualContent(e.target.value)}
          rows={8}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {benefitsData?.benefits?.map((benefit: any, idx: number) => (
        <div key={idx} className="p-4 border rounded-lg space-y-3 relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6 text-muted-foreground hover:text-destructive"
            onClick={() => removeBenefit(idx)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Benefit {idx + 1} Title</Label>
            <Input
              value={benefit.title}
              onChange={(e) => updateBenefit(idx, "title", e.target.value)}
              placeholder="Benefit title..."
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Description</Label>
            <Textarea
              value={benefit.description}
              onChange={(e) => updateBenefit(idx, "description", e.target.value)}
              rows={2}
              placeholder="Benefit description..."
            />
          </div>
        </div>
      ))}

      <Button variant="outline" size="sm" onClick={addBenefit} className="w-full">
        <Plus className="w-4 h-4 mr-2" />
        Add Benefit
      </Button>

      {!benefitsData?.benefits?.length && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Click "Generate" to create 4 key benefits
        </p>
      )}
    </div>
  );
};

// WhyDifferent Editor Content
interface WhyDifferentEditorContentProps {
  whyDifferentData: any;
  setWhyDifferentData: (data: any) => void;
  manualContent: string;
  setManualContent: (content: string) => void;
  mode: "ai" | "manual";
  contextMode: "infer" | "provide";
  setContextMode: (mode: "infer" | "provide") => void;
  attemptedSolutions: string;
  setAttemptedSolutions: (s: string) => void;
  whyFails: string;
  setWhyFails: (s: string) => void;
  uniqueApproach: string;
  setUniqueApproach: (s: string) => void;
}

export const WhyDifferentEditorContent = ({
  whyDifferentData,
  setWhyDifferentData,
  manualContent,
  setManualContent,
  mode,
  contextMode,
  setContextMode,
  attemptedSolutions,
  setAttemptedSolutions,
  whyFails,
  setWhyFails,
  uniqueApproach,
  setUniqueApproach,
}: WhyDifferentEditorContentProps) => {
  const [contextOpen, setContextOpen] = useState(false);

  if (mode === "manual") {
    return (
      <div className="space-y-3">
        <Label className="text-sm font-medium">Why This Is Different</Label>
        <Textarea
          placeholder="Write your 'Why This Is Different' copy..."
          value={manualContent}
          onChange={(e) => setManualContent(e.target.value)}
          rows={8}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {!whyDifferentData && (
        <>
          <div className="space-y-3">
            <Label className="text-sm font-medium">Context Source</Label>
            <RadioGroup
              value={contextMode}
              onValueChange={(v) => setContextMode(v as "infer" | "provide")}
              className="space-y-2"
            >
              <div className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="infer" id="context-infer" />
                <Label htmlFor="context-infer" className="flex-1 cursor-pointer">
                  <span className="font-medium">Let AI infer context</span>
                  <p className="text-xs text-muted-foreground">AI will determine what solutions your audience has tried</p>
                </Label>
              </div>
              <div className="flex items-center gap-2 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                <RadioGroupItem value="provide" id="context-provide" />
                <Label htmlFor="context-provide" className="flex-1 cursor-pointer">
                  <span className="font-medium">I'll provide specific context</span>
                  <p className="text-xs text-muted-foreground">Enter details about solutions they've tried</p>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {contextMode === "provide" && (
            <Collapsible open={contextOpen} onOpenChange={setContextOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="w-full justify-between">
                  <span>Context Details</span>
                  {contextOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-3">
                <div className="space-y-2">
                  <Label className="text-sm">What solutions has your audience tried?</Label>
                  <Textarea
                    placeholder="e.g., Free YouTube tutorials, generic courses..."
                    value={attemptedSolutions}
                    onChange={(e) => setAttemptedSolutions(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">Why do those solutions typically fail?</Label>
                  <Textarea
                    placeholder="e.g., Too generic, no personalized support..."
                    value={whyFails}
                    onChange={(e) => setWhyFails(e.target.value)}
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm">What makes your approach different?</Label>
                  <Textarea
                    placeholder="e.g., Personalized feedback combined with..."
                    value={uniqueApproach}
                    onChange={(e) => setUniqueApproach(e.target.value)}
                    rows={2}
                  />
                </div>
              </CollapsibleContent>
            </Collapsible>
          )}
        </>
      )}

      {whyDifferentData && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Opening Paragraph</Label>
            <Textarea
              value={whyDifferentData.openingParagraph}
              onChange={(e) => setWhyDifferentData({ ...whyDifferentData, openingParagraph: e.target.value })}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Comparison Bullets</Label>
            {whyDifferentData.comparisonBullets?.map((bullet: string, idx: number) => (
              <div key={idx} className="flex items-start gap-2">
                <Textarea
                  value={bullet}
                  onChange={(e) => {
                    const newBullets = [...(whyDifferentData.comparisonBullets || [])];
                    newBullets[idx] = e.target.value;
                    setWhyDifferentData({ ...whyDifferentData, comparisonBullets: newBullets });
                  }}
                  rows={2}
                />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Bridge Sentence</Label>
            <Textarea
              value={whyDifferentData.bridgeSentence}
              onChange={(e) => setWhyDifferentData({ ...whyDifferentData, bridgeSentence: e.target.value })}
              rows={2}
            />
          </div>
        </div>
      )}

      {!whyDifferentData && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Click "Generate" to create differentiating copy
        </p>
      )}
    </div>
  );
};

// Generic Text Section Editor (for testimonials, FAQs, offer details)
interface GenericEditorContentProps {
  label: string;
  placeholder: string;
  manualContent: string;
  setManualContent: (content: string) => void;
  mode: "ai" | "manual";
  children?: React.ReactNode;
}

export const GenericEditorContent = ({
  label,
  placeholder,
  manualContent,
  setManualContent,
  mode,
  children,
}: GenericEditorContentProps) => {
  if (mode === "manual") {
    return (
      <div className="space-y-3">
        <Label className="text-sm font-medium">{label}</Label>
        <Textarea
          placeholder={placeholder}
          value={manualContent}
          onChange={(e) => setManualContent(e.target.value)}
          rows={8}
        />
      </div>
    );
  }

  return <div className="space-y-4">{children}</div>;
};
