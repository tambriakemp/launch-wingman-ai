import { useState } from "react";
import { useDebouncedInput } from "@/hooks/useDebouncedInput";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Loader2, Target, Heart, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface DreamOutcomeSectionProps {
  desiredOutcome: string;
  niche: string;
  targetAudience: string;
  painPoint: string;
  onChange: (value: string) => void;
}

interface OutcomeVariation {
  type: string;
  label: string;
  statement: string;
}

const getVariationIcon = (type: string) => {
  switch (type) {
    case "results":
      return <Target className="w-4 h-4" />;
    case "emotion":
      return <Heart className="w-4 h-4" />;
    case "identity":
      return <User className="w-4 h-4" />;
    default:
      return <Target className="w-4 h-4" />;
  }
};

const getVariationColor = (type: string) => {
  switch (type) {
    case "results":
      return "bg-blue-500/10 text-blue-600 border-blue-500/30";
    case "emotion":
      return "bg-pink-500/10 text-pink-600 border-pink-500/30";
    case "identity":
      return "bg-purple-500/10 text-purple-600 border-purple-500/30";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const DreamOutcomeSectionContent = ({
  desiredOutcome,
  niche,
  targetAudience,
  painPoint,
  onChange,
}: DreamOutcomeSectionProps) => {
  const [localDesiredOutcome, setLocalDesiredOutcome] = useDebouncedInput(desiredOutcome, onChange);
  const [isGenerating, setIsGenerating] = useState(false);
  const [variations, setVariations] = useState<OutcomeVariation[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setVariations([]);
    setSelectedVariation(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-dream-outcome', {
        body: {
          niche,
          targetAudience,
          currentOutcome: desiredOutcome,
          painPoint,
        },
      });

      if (error) throw error;

      if (data?.variations) {
        setVariations(data.variations);
      }
    } catch (error) {
      console.error('Error generating dream outcome:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectVariation = (variation: OutcomeVariation) => {
    setSelectedVariation(variation.type);
    onChange(variation.statement);
  };

  const hasContext = !!(niche || targetAudience);

  return (
    <div className="space-y-4">
      {/* Instructions */}
      <div className="text-sm text-muted-foreground space-y-2 pb-4 mb-4 border-b border-border">
        <p>Describe the specific result or transformation your audience wants to achieve.</p>
        <p>Write in plain language what success looks like for them — not what you offer, but what they'll experience after working with you. Consider:</p>
        <ul className="list-disc list-inside space-y-1 ml-2">
          <li>What does their ideal "after" state look like?</li>
          <li>How will their daily life be different?</li>
          <li>What will they be able to do that they can't do now?</li>
        </ul>
      </div>

      {/* Main Textarea at TOP */}
      <div className="space-y-2">
        <Label htmlFor="desiredOutcome" className="flex items-center gap-1">
          Desired Outcome <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="desiredOutcome"
          placeholder="Describe the specific transformation or result your audience wants to achieve..."
          value={localDesiredOutcome}
          onChange={(e) => setLocalDesiredOutcome(e.target.value)}
          rows={3}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Example: "Go from overwhelmed solopreneur to confident CEO running a 6-figure business with a team"
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
                className={`p-3 rounded-lg border text-left transition-all hover:border-primary/50 ${
                  selectedVariation === variation.type
                    ? "border-primary bg-primary/5"
                    : "border-border bg-card"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Badge
                    variant="outline"
                    className={`${getVariationColor(variation.type)} gap-1`}
                  >
                    {getVariationIcon(variation.type)}
                    {variation.label}
                  </Badge>
                  {selectedVariation === variation.type && (
                    <Check className="w-4 h-4 text-primary ml-auto" />
                  )}
                </div>
                <p className="text-sm">{variation.statement}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Buttons at BOTTOM RIGHT */}
      <div className="flex justify-end items-center gap-2 pt-4 border-t border-border">
        {!hasContext && (
          <span className="text-xs text-muted-foreground mr-2">
            Add niche or audience first
          </span>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={handleGenerate}
          disabled={isGenerating || !hasContext}
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
              {variations.length > 0 ? "Regenerate" : "Generate"}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

// Keep backward compatibility alias
export const DreamOutcomeSection = DreamOutcomeSectionContent;
