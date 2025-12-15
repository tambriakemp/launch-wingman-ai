import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Sparkles, RefreshCw, Lock, Unlock, Info } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AudienceSummaryCard } from "./AudienceSummaryCard";
import { StyleSelector, TransformationStyle } from "./StyleSelector";
import { TransformationVersions, TransformationVersionsData } from "./TransformationVersions";

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

interface AudienceData {
  niche: string;
  targetAudience: string;
  primaryPainPoint: string;
  painSymptoms: PainSymptom[];
  desiredOutcome: string;
  mainObjections: string;
  likelihoodElements: LikelihoodElement[];
  timeEffortElements: TimeEffortElement[];
  specificityScore: number;
}

interface TransformationBuilderProps {
  audienceData: AudienceData;
  funnelType: string;
  initialStyle: TransformationStyle;
  initialVersions: TransformationVersionsData | null;
  initialPrimaryVersion: 'one_liner' | 'standard' | 'expanded';
  initialLocked: boolean;
  onStyleChange: (style: TransformationStyle) => void;
  onVersionsChange: (versions: TransformationVersionsData) => void;
  onPrimaryVersionChange: (version: 'one_liner' | 'standard' | 'expanded') => void;
  onLockedChange: (locked: boolean) => void;
  onStatementChange: (statement: string) => void;
}

export const TransformationBuilder = ({
  audienceData,
  funnelType,
  initialStyle,
  initialVersions,
  initialPrimaryVersion,
  initialLocked,
  onStyleChange,
  onVersionsChange,
  onPrimaryVersionChange,
  onLockedChange,
  onStatementChange,
}: TransformationBuilderProps) => {
  const [selectedStyle, setSelectedStyle] = useState<TransformationStyle>(initialStyle);
  const [versions, setVersions] = useState<TransformationVersionsData | null>(initialVersions);
  const [primaryVersion, setPrimaryVersion] = useState<'one_liner' | 'standard' | 'expanded'>(initialPrimaryVersion);
  const [isLocked, setIsLocked] = useState(initialLocked);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(!!initialVersions);

  // Sync initial values
  useEffect(() => {
    setSelectedStyle(initialStyle);
    setVersions(initialVersions);
    setPrimaryVersion(initialPrimaryVersion);
    setIsLocked(initialLocked);
    setHasGenerated(!!initialVersions);
  }, [initialStyle, initialVersions, initialPrimaryVersion, initialLocked]);

  // Update primary statement when versions or primary version changes
  useEffect(() => {
    if (versions && primaryVersion) {
      onStatementChange(versions[primaryVersion]);
    }
  }, [versions, primaryVersion, onStatementChange]);

  const handleStyleChange = (style: TransformationStyle) => {
    setSelectedStyle(style);
    onStyleChange(style);
  };

  const handleGenerate = async () => {
    if (!audienceData.targetAudience || !audienceData.primaryPainPoint || !audienceData.desiredOutcome) {
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-transformation-v2", {
        body: {
          targetAudience: audienceData.targetAudience,
          niche: audienceData.niche,
          primaryPainPoint: audienceData.primaryPainPoint,
          painSymptoms: audienceData.painSymptoms,
          desiredOutcome: audienceData.desiredOutcome,
          mainObjections: audienceData.mainObjections,
          likelihoodElements: audienceData.likelihoodElements,
          timeEffortElements: audienceData.timeEffortElements,
          selectedStyle,
          funnelType,
        },
      });

      if (error) throw error;

      if (data?.versions) {
        setVersions(data.versions);
        onVersionsChange(data.versions);
        setHasGenerated(true);
        // Auto-select appropriate primary based on style
        const autoPrimary = selectedStyle === 'short' ? 'one_liner' : 'standard';
        setPrimaryVersion(autoPrimary);
        onPrimaryVersionChange(autoPrimary);
      }
    } catch (error) {
      console.error("Error generating transformation:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectPrimary = (version: 'one_liner' | 'standard' | 'expanded') => {
    setPrimaryVersion(version);
    onPrimaryVersionChange(version);
  };

  const handleEditVersion = (version: 'one_liner' | 'standard' | 'expanded', text: string) => {
    if (!versions) return;
    const newVersions = { ...versions, [version]: text };
    setVersions(newVersions);
    onVersionsChange(newVersions);
  };

  const handleLockToggle = (locked: boolean) => {
    setIsLocked(locked);
    onLockedChange(locked);
  };

  const isAudienceComplete = 
    audienceData.targetAudience && 
    audienceData.primaryPainPoint && 
    audienceData.desiredOutcome;

  return (
    <div className="space-y-6">
      {/* Section 1: Audience Summary */}
      <AudienceSummaryCard
        niche={audienceData.niche}
        targetAudience={audienceData.targetAudience}
        primaryPainPoint={audienceData.primaryPainPoint}
        painSymptoms={audienceData.painSymptoms}
        desiredOutcome={audienceData.desiredOutcome}
        mainObjections={audienceData.mainObjections}
        likelihoodElements={audienceData.likelihoodElements}
        timeEffortElements={audienceData.timeEffortElements}
        specificityScore={audienceData.specificityScore}
      />

      {/* Section 2: Style Selector */}
      <Card className="bg-card border-border">
        <CardContent className="p-6 space-y-6">
          <StyleSelector
            selectedStyle={selectedStyle}
            onChange={handleStyleChange}
            disabled={isLocked}
          />

          {/* Generate Button */}
          <div className="flex justify-center pt-2">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating || !isAudienceComplete || isLocked}
              size="lg"
              className="min-w-[240px]"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Versions...
                </>
              ) : hasGenerated ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Regenerate Transformation
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Transformation Versions
                </>
              )}
            </Button>
          </div>

          {!isAudienceComplete && (
            <p className="text-center text-sm text-muted-foreground">
              Complete your audience definition to generate transformation statements
            </p>
          )}
        </CardContent>
      </Card>

      {/* Section 3: Generated Versions */}
      {versions && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Your Transformation Versions</Label>
            <div className="flex items-center gap-2">
              {isLocked ? (
                <Lock className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Unlock className="w-4 h-4 text-muted-foreground" />
              )}
              <Label htmlFor="lock-toggle" className="text-xs text-muted-foreground cursor-pointer">
                Lock transformation
              </Label>
              <Switch
                id="lock-toggle"
                checked={isLocked}
                onCheckedChange={handleLockToggle}
              />
            </div>
          </div>

          <TransformationVersions
            versions={versions}
            primaryVersion={primaryVersion}
            onSelectPrimary={handleSelectPrimary}
            onEditVersion={handleEditVersion}
            isLocked={isLocked}
          />

          {/* Why This Works */}
          <Card className="bg-muted/30 border-border">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="space-y-1">
                  <p className="text-xs font-medium text-muted-foreground">Why This Works</p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This transformation statement is derived from your defined audience ({audienceData.targetAudience?.slice(0, 40)}...), 
                    their core pain ({audienceData.primaryPainPoint?.slice(0, 30)}...), 
                    and desired outcome ({audienceData.desiredOutcome?.slice(0, 30)}...).
                    {selectedStyle === 'short' && " The short & punchy style is optimized for social media engagement."}
                    {selectedStyle === 'practical' && " The clear & practical style is optimized for sales page conversions."}
                    {selectedStyle === 'aspirational' && " The aspirational style connects emotionally with your audience's identity."}
                    {selectedStyle === 'authority' && " The authority style positions you as a premium expert."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
