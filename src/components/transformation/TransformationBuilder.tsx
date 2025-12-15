import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, RefreshCw, Lock, Unlock, PenLine, Wand2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
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
  initialManualStatement?: string;
  initialMode?: 'ai' | 'manual';
  onStyleChange: (style: TransformationStyle) => void;
  onVersionsChange: (versions: TransformationVersionsData) => void;
  onPrimaryVersionChange: (version: 'one_liner' | 'standard' | 'expanded') => void;
  onLockedChange: (locked: boolean) => void;
  onStatementChange: (statement: string) => void;
  onModeChange?: (mode: 'ai' | 'manual') => void;
}

export const TransformationBuilder = ({
  audienceData,
  funnelType,
  initialStyle,
  initialVersions,
  initialPrimaryVersion,
  initialLocked,
  initialManualStatement = '',
  initialMode = 'ai',
  onStyleChange,
  onVersionsChange,
  onPrimaryVersionChange,
  onLockedChange,
  onStatementChange,
  onModeChange,
}: TransformationBuilderProps) => {
  const [mode, setMode] = useState<'ai' | 'manual'>(initialMode);
  const [selectedStyle, setSelectedStyle] = useState<TransformationStyle>(initialStyle);
  const [versions, setVersions] = useState<TransformationVersionsData | null>(initialVersions);
  const [primaryVersion, setPrimaryVersion] = useState<'one_liner' | 'standard' | 'expanded'>(initialPrimaryVersion);
  const [isLocked, setIsLocked] = useState(initialLocked);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(!!initialVersions);
  const [manualStatement, setManualStatement] = useState(initialManualStatement);

  // Sync initial values
  useEffect(() => {
    setSelectedStyle(initialStyle);
    setVersions(initialVersions);
    setPrimaryVersion(initialPrimaryVersion);
    setIsLocked(initialLocked);
    setHasGenerated(!!initialVersions);
    setManualStatement(initialManualStatement);
    setMode(initialMode);
  }, [initialStyle, initialVersions, initialPrimaryVersion, initialLocked, initialManualStatement, initialMode]);

  // Update primary statement when versions or primary version changes (AI mode)
  useEffect(() => {
    if (mode === 'ai' && versions && primaryVersion) {
      onStatementChange(versions[primaryVersion]);
    }
  }, [versions, primaryVersion, onStatementChange, mode]);

  // Update statement when manual mode changes
  useEffect(() => {
    if (mode === 'manual') {
      onStatementChange(manualStatement);
    }
  }, [manualStatement, mode, onStatementChange]);

  const handleModeChange = (newMode: 'ai' | 'manual') => {
    setMode(newMode);
    onModeChange?.(newMode);
    if (newMode === 'manual') {
      onStatementChange(manualStatement);
    } else if (versions && primaryVersion) {
      onStatementChange(versions[primaryVersion]);
    }
  };

  const handleStyleChange = (style: TransformationStyle) => {
    setSelectedStyle(style);
    onStyleChange(style);
  };

  const handleManualStatementChange = (text: string) => {
    setManualStatement(text);
    onStatementChange(text);
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

  const formulaPlaceholder = `I help [${audienceData.targetAudience || 'WHO'}] go from [${audienceData.primaryPainPoint || 'CURRENT STRUGGLE'}] to [${audienceData.desiredOutcome || 'DESIRED OUTCOME'}] using [YOUR METHOD/APPROACH] without [COMMON OBSTACLE].`;

  return (
    <div className="space-y-5">
      {/* Mode Selection Card */}
      <Card className="bg-card border-border">
        <CardContent className="p-5 space-y-5">
          {/* Mode Toggle */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">How do you want to create your statement?</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleModeChange('ai')}
                disabled={isLocked}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  mode === 'ai'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Wand2 className={`w-5 h-5 ${mode === 'ai' ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="text-left">
                  <p className={`text-sm font-medium ${mode === 'ai' ? 'text-primary' : ''}`}>Generate with AI</p>
                  <p className="text-xs text-muted-foreground">Based on your audience</p>
                </div>
              </button>
              <button
                onClick={() => handleModeChange('manual')}
                disabled={isLocked}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${
                  mode === 'manual'
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                } ${isLocked ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <PenLine className={`w-5 h-5 ${mode === 'manual' ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="text-left">
                  <p className={`text-sm font-medium ${mode === 'manual' ? 'text-primary' : ''}`}>Write Manually</p>
                  <p className="text-xs text-muted-foreground">Use the formula</p>
                </div>
              </button>
            </div>
          </div>

          {/* AI Mode: Style Selector + Generate */}
          {mode === 'ai' && (
            <>
              <StyleSelector
                selectedStyle={selectedStyle}
                onChange={handleStyleChange}
                disabled={isLocked}
              />

              <div className="flex justify-center">
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating || !isAudienceComplete || isLocked}
                  size="lg"
                  className="min-w-[200px]"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : hasGenerated ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Regenerate
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Versions
                    </>
                  )}
                </Button>
              </div>

              {!isAudienceComplete && (
                <p className="text-center text-sm text-muted-foreground">
                  Complete your audience definition to generate
                </p>
              )}
            </>
          )}

          {/* Manual Mode: Textarea with formula */}
          {mode === 'manual' && (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-muted/50 border border-border">
                <p className="text-[10px] font-medium text-muted-foreground mb-1 uppercase tracking-wide">Transformation Formula</p>
                <p className="text-xs font-mono text-foreground">
                  I help [WHO] go from [STRUGGLE] to [OUTCOME] using [METHOD] without [OBSTACLE].
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="manual-statement" className="text-sm">Your Transformation Statement</Label>
                <Textarea
                  id="manual-statement"
                  value={manualStatement}
                  onChange={(e) => handleManualStatementChange(e.target.value)}
                  placeholder={formulaPlaceholder}
                  rows={3}
                  disabled={isLocked}
                  className="resize-none text-sm"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Generated Versions (AI mode) - Horizontal Layout */}
      {mode === 'ai' && versions && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">Your Transformation Versions</Label>
            <div className="flex items-center gap-2">
              {isLocked ? (
                <Lock className="w-4 h-4 text-muted-foreground" />
              ) : (
                <Unlock className="w-4 h-4 text-muted-foreground" />
              )}
              <Label htmlFor="lock-toggle" className="text-xs text-muted-foreground cursor-pointer">
                Lock
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
        </div>
      )}

      {/* Manual Mode: Lock toggle */}
      {mode === 'manual' && manualStatement && (
        <div className="flex items-center justify-end gap-2 pt-2">
          {isLocked ? (
            <Lock className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Unlock className="w-4 h-4 text-muted-foreground" />
          )}
          <Label htmlFor="lock-toggle-manual" className="text-xs text-muted-foreground cursor-pointer">
            Lock transformation
          </Label>
          <Switch
            id="lock-toggle-manual"
            checked={isLocked}
            onCheckedChange={handleLockToggle}
          />
        </div>
      )}
    </div>
  );
};