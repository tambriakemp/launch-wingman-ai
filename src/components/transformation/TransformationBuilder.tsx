import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Check, Sparkles, Loader2, Zap, FileText, BookOpen, Lock, Unlock } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { TransformationStyle } from "./StyleSelector";
import { TransformationVersionsData } from "./TransformationVersions";

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
  transformationStatement: string;
  transformationStyle: TransformationStyle;
  transformationVersions: TransformationVersionsData | null;
  primaryVersion: 'one_liner' | 'standard' | 'expanded';
  isLocked: boolean;
  onStatementChange: (statement: string) => void;
  onStyleChange: (style: TransformationStyle) => void;
  onVersionsChange: (versions: TransformationVersionsData) => void;
  onPrimaryVersionChange: (version: 'one_liner' | 'standard' | 'expanded') => void;
  onLockedChange: (locked: boolean) => void;
}

interface VersionVariation {
  type: 'one_liner' | 'standard' | 'expanded';
  label: string;
  statement: string;
}

const getVersionIcon = (type: string) => {
  switch (type) {
    case "one_liner":
      return <Zap className="w-4 h-4" />;
    case "standard":
      return <FileText className="w-4 h-4" />;
    case "expanded":
      return <BookOpen className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
};

const getVersionColor = (type: string) => {
  switch (type) {
    case "one_liner":
      return "bg-blue-500/10 text-blue-600 border-blue-500/30";
    case "standard":
      return "bg-green-500/10 text-green-600 border-green-500/30";
    case "expanded":
      return "bg-purple-500/10 text-purple-600 border-purple-500/30";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getVersionLabel = (type: string) => {
  switch (type) {
    case "one_liner":
      return "Short & Punchy";
    case "standard":
      return "Clear & Practical";
    case "expanded":
      return "Expanded";
    default:
      return type;
  }
};

const styleOptions = [
  { value: 'short', label: 'Short & Punchy' },
  { value: 'practical', label: 'Clear & Practical' },
  { value: 'aspirational', label: 'Aspirational & Emotional' },
  { value: 'authority', label: 'Authority-Driven' },
];

export const TransformationBuilder = ({
  audienceData,
  funnelType,
  transformationStatement,
  transformationStyle,
  transformationVersions,
  primaryVersion,
  isLocked,
  onStatementChange,
  onStyleChange,
  onVersionsChange,
  onPrimaryVersionChange,
  onLockedChange,
}: TransformationBuilderProps) => {
  const [isGenerating, setIsGenerating] = useState(false);

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
          selectedStyle: transformationStyle,
          funnelType,
        },
      });

      if (error) throw error;

      if (data?.versions) {
        onVersionsChange(data.versions);
        // Auto-select appropriate primary based on style
        const autoPrimary = transformationStyle === 'short' ? 'one_liner' : 'standard';
        onPrimaryVersionChange(autoPrimary);
        onStatementChange(data.versions[autoPrimary]);
      }
    } catch (error) {
      console.error("Error generating transformation:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectVariation = (variation: VersionVariation) => {
    onPrimaryVersionChange(variation.type);
    onStatementChange(variation.statement);
  };

  const isAudienceComplete = 
    audienceData.targetAudience && 
    audienceData.primaryPainPoint && 
    audienceData.desiredOutcome;

  const formulaPlaceholder = `I help ${audienceData.targetAudience || '[WHO]'} go from ${audienceData.primaryPainPoint || '[CURRENT STRUGGLE]'} to ${audienceData.desiredOutcome || '[DESIRED OUTCOME]'} using [YOUR METHOD] without [COMMON OBSTACLE].`;

  // Convert versions to variation array for display
  const variations: VersionVariation[] = transformationVersions 
    ? [
        { type: 'one_liner', label: getVersionLabel('one_liner'), statement: transformationVersions.one_liner },
        { type: 'standard', label: getVersionLabel('standard'), statement: transformationVersions.standard },
        { type: 'expanded', label: getVersionLabel('expanded'), statement: transformationVersions.expanded },
      ]
    : [];

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Main Textarea at TOP */}
        <div className="space-y-2">
          <Label htmlFor="transformationStatement" className="flex items-center gap-1">
            Your Transformation Statement <span className="text-destructive">*</span>
          </Label>
          <Textarea
            id="transformationStatement"
            placeholder={formulaPlaceholder}
            value={transformationStatement}
            onChange={(e) => onStatementChange(e.target.value)}
            rows={3}
            className="resize-none"
            disabled={isLocked}
          />
          <p className="text-xs text-muted-foreground">
            Formula: "I help [WHO] go from [PAIN] to [OUTCOME] using [METHOD] without [OBSTACLE]"
          </p>
        </div>

        {/* Generated Variations in MIDDLE */}
        {variations.length > 0 && (
          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Click to use a variation:
            </Label>
            <div className="grid gap-2">
              {variations.map((variation) => (
                <button
                  key={variation.type}
                  onClick={() => handleSelectVariation(variation)}
                  disabled={isLocked}
                  className={`p-3 rounded-lg border text-left transition-all hover:border-accent/50 ${
                    primaryVersion === variation.type
                      ? "border-accent bg-accent/10"
                      : "border-border bg-card"
                  } ${isLocked ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Badge
                      variant="outline"
                      className={`${getVersionColor(variation.type)} gap-1`}
                    >
                      {getVersionIcon(variation.type)}
                      {variation.label}
                    </Badge>
                    {primaryVersion === variation.type && (
                      <Check className="w-4 h-4 text-accent ml-auto" />
                    )}
                  </div>
                  <p className="text-sm">{variation.statement}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Lock Toggle */}
        {transformationStatement && (
          <div className="flex items-center justify-end gap-2 pt-2">
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
              onCheckedChange={onLockedChange}
            />
          </div>
        )}

        {/* Style Dropdown + Generate Button at BOTTOM */}
        <div className="flex justify-end items-center gap-2 pt-4 border-t border-border">
          {!isAudienceComplete && (
            <span className="text-xs text-muted-foreground mr-2">
              Complete audience first
            </span>
          )}
          <Select
            value={transformationStyle}
            onValueChange={(value) => onStyleChange(value as TransformationStyle)}
            disabled={isLocked || isGenerating}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select style" />
            </SelectTrigger>
            <SelectContent>
              {styleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleGenerate}
            disabled={isGenerating || !isAudienceComplete || isLocked}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
