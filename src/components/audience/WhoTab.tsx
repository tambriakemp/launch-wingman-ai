import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, Loader2, Check, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const NICHES = [
  "Business Coaching",
  "Life Coaching",
  "Health & Fitness",
  "Career & Leadership",
  "Relationships & Dating",
  "Mindset & Personal Development",
  "Financial Coaching",
  "Creative & Artistic",
  "Parenting & Family",
  "Spiritual & Wellness",
  "Marketing & Sales",
  "Productivity & Time Management",
  "Other",
];

interface SubAudience {
  name: string;
  description: string;
  painTrigger: string;
}

interface WhoTabProps {
  niche: string;
  targetAudience: string;
  subAudiences: SubAudience[];
  specificityScore: number;
  onNicheChange: (value: string) => void;
  onTargetAudienceChange: (value: string) => void;
  onSubAudiencesChange: (value: SubAudience[]) => void;
  onSpecificityScoreChange: (value: number) => void;
}

export const WhoTab = ({
  niche,
  targetAudience,
  subAudiences,
  specificityScore,
  onNicheChange,
  onTargetAudienceChange,
  onSubAudiencesChange,
  onSpecificityScoreChange,
}: WhoTabProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [specificityFeedback, setSpecificityFeedback] = useState<string>("");
  const [selectedSubAudience, setSelectedSubAudience] = useState<string | null>(null);

  const handleGenerateSubAudiences = async () => {
    if (!niche) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-sub-audiences', {
        body: { niche, targetAudience }
      });

      if (error) throw error;

      if (data.subAudiences) {
        onSubAudiencesChange(data.subAudiences);
      }
      if (typeof data.specificityScore === 'number') {
        onSpecificityScoreChange(data.specificityScore);
      }
      if (data.specificityFeedback) {
        setSpecificityFeedback(data.specificityFeedback);
      }
    } catch (error) {
      console.error("Error generating sub-audiences:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectSubAudience = (subAudience: SubAudience) => {
    setSelectedSubAudience(subAudience.name);
    onTargetAudienceChange(subAudience.name);
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return "bg-green-500/10 text-green-500 border-green-500/30";
    if (score >= 4) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
    return "bg-red-500/10 text-red-500 border-red-500/30";
  };

  return (
    <div className="space-y-6">
      {/* Niche Selection */}
      <div className="space-y-2">
        <Label htmlFor="niche" className="flex items-center gap-1">
          Niche <span className="text-destructive">*</span>
        </Label>
        <Select value={niche} onValueChange={onNicheChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select your niche" />
          </SelectTrigger>
          <SelectContent>
            {NICHES.map((n) => (
              <SelectItem key={n} value={n}>
                {n}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Target Audience with Specificity Scorer */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="targetAudience" className="flex items-center gap-1">
            Target Audience <span className="text-destructive">*</span>
          </Label>
          {specificityScore > 0 && (
            <Badge variant="outline" className={getScoreColor(specificityScore)}>
              Specificity: {specificityScore}/10
            </Badge>
          )}
        </div>
        <Textarea
          id="targetAudience"
          placeholder="Describe your ideal client in detail (e.g., 'First-time female entrepreneurs in their 30s launching service-based businesses')"
          value={targetAudience}
          onChange={(e) => onTargetAudienceChange(e.target.value)}
          rows={3}
        />
        {specificityFeedback && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50">
            <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-muted-foreground">{specificityFeedback}</p>
          </div>
        )}
      </div>

      {/* AI Sub-Audience Generator */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>AI Sub-Audience Suggestions</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateSubAudiences}
            disabled={!niche || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {subAudiences.length > 0 ? "Regenerate" : "Generate"} Sub-Audiences
              </>
            )}
          </Button>
        </div>

        {subAudiences.length > 0 && (
          <div className="grid gap-3">
            {subAudiences.map((sub, index) => (
              <Card
                key={index}
                className={`p-3 cursor-pointer transition-all hover:border-primary/50 ${
                  selectedSubAudience === sub.name
                    ? "border-primary bg-primary/5"
                    : ""
                }`}
                onClick={() => handleSelectSubAudience(sub)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{sub.name}</span>
                      {selectedSubAudience === sub.name && (
                        <Check className="w-4 h-4 text-primary" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {sub.description}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      <span className="font-medium">Trigger:</span> {sub.painTrigger}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {!subAudiences.length && niche && (
          <p className="text-sm text-muted-foreground">
            Click "Generate Sub-Audiences" to get AI-suggested specific audience segments based on your niche.
          </p>
        )}
      </div>
    </div>
  );
};
