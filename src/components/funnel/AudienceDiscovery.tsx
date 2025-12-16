import { useState } from "react";
import { Sparkles, Loader2, RefreshCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export interface AudienceData {
  niche: string;
  targetAudience: string;
  primaryPainPoint: string;
  desiredOutcome: string;
  problemStatement: string;
  // Extended Value Equation fields
  painSymptoms?: string[];
  mainObjections?: string;
  likelihoodElements?: Array<{ type: string; content: string }>;
  timeEffortElements?: Array<{ type: string; content: string }>;
}

interface AudienceDiscoveryProps {
  data: AudienceData;
  onChange: (data: AudienceData) => void;
}

const NICHES = [
  "Business Coaching",
  "Life Coaching",
  "Health & Wellness",
  "Fitness & Nutrition",
  "Mindset & Personal Development",
  "Career & Leadership",
  "Relationships & Dating",
  "Spirituality & Mindfulness",
  "Financial Coaching",
  "Parenting & Family",
  "Creative Arts & Writing",
  "Marketing & Sales",
  "Real Estate",
  "Technology & Software",
  "Education & E-Learning",
  "Beauty & Fashion",
  "Travel & Lifestyle",
  "Food & Cooking",
  "Music & Entertainment",
  "Sports & Athletics",
  "Pet Care & Training",
  "Home & Interior Design",
  "Sustainability & Environment",
  "Legal & Consulting",
  "Other",
];

export const AudienceDiscovery = ({ data, onChange }: AudienceDiscoveryProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(!!data.problemStatement);

  const handleFieldChange = (field: keyof AudienceData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const isFieldEmpty = (field: keyof AudienceData) => {
    const value = data[field];
    if (typeof value === 'string') {
      return !value.trim();
    }
    return !value || (Array.isArray(value) && value.length === 0);
  };

  const handleGenerateProblemStatement = async () => {
    if (!data.niche || !data.targetAudience || !data.primaryPainPoint || !data.desiredOutcome) {
      toast.error("Please fill in all required fields before generating");
      return;
    }

    setIsGenerating(true);
    try {
      const { data: result, error } = await supabase.functions.invoke(
        "generate-problem-statement",
        {
          body: {
            niche: data.niche,
            targetAudience: data.targetAudience,
            primaryPainPoint: data.primaryPainPoint,
            desiredOutcome: data.desiredOutcome,
          },
        }
      );

      if (error) throw error;

      if (result?.problemStatement) {
        handleFieldChange("problemStatement", result.problemStatement);
        setHasGenerated(true);
        toast.success("Problem statement generated!");
      }
    } catch (error) {
      console.error("Error generating problem statement:", error);
      toast.error("Failed to generate problem statement");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* White card container for better contrast */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="niche" className="flex items-center gap-1">
                Your Niche <span className="text-destructive">*</span>
              </Label>
              <Select
                value={data.niche}
                onValueChange={(value) => handleFieldChange("niche", value)}
              >
                <SelectTrigger 
                  id="niche" 
                  className={cn(
                    "bg-background",
                    isFieldEmpty("niche") && "border-destructive/50"
                  )}
                >
                  <SelectValue placeholder="Select your niche..." />
                </SelectTrigger>
                <SelectContent>
                  {NICHES.map((niche) => (
                    <SelectItem key={niche} value={niche}>
                      {niche}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                The industry or market you serve
              </p>
              {isFieldEmpty("niche") && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Required
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="targetAudience" className="flex items-center gap-1">
                Target Audience <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="targetAudience"
                value={data.targetAudience}
                onChange={(e) => handleFieldChange("targetAudience", e.target.value)}
                placeholder="e.g., Busy professionals aged 35-50 who want to..."
                rows={2}
                className={cn(
                  "bg-background",
                  isFieldEmpty("targetAudience") && "border-destructive/50"
                )}
              />
              <p className="text-xs text-muted-foreground">
                Who specifically you help
              </p>
              {isFieldEmpty("targetAudience") && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Required
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryPainPoint" className="flex items-center gap-1">
                Primary Pain Point <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="primaryPainPoint"
                value={data.primaryPainPoint}
                onChange={(e) => handleFieldChange("primaryPainPoint", e.target.value)}
                placeholder="e.g., Struggling to maintain energy and focus throughout the day"
                rows={2}
                className={cn(
                  "bg-background",
                  isFieldEmpty("primaryPainPoint") && "border-destructive/50"
                )}
              />
              <p className="text-xs text-muted-foreground">
                The main problem your audience faces
              </p>
              {isFieldEmpty("primaryPainPoint") && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Required
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="desiredOutcome" className="flex items-center gap-1">
                Desired Outcome <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="desiredOutcome"
                value={data.desiredOutcome}
                onChange={(e) => handleFieldChange("desiredOutcome", e.target.value)}
                placeholder="e.g., Sustainable energy, mental clarity, and work-life balance"
                rows={2}
                className={cn(
                  "bg-background",
                  isFieldEmpty("desiredOutcome") && "border-destructive/50"
                )}
              />
              <p className="text-xs text-muted-foreground">
                What your audience wants to achieve
              </p>
              {isFieldEmpty("desiredOutcome") && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Required
                </p>
              )}
            </div>
          </div>

          <div className="space-y-3 pt-6 mt-6 border-t border-border">
            <div className="flex items-center justify-between">
              <Label htmlFor="problemStatement" className="flex items-center gap-1">
                Problem Statement <span className="text-destructive">*</span>
              </Label>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateProblemStatement}
                disabled={isGenerating || !data.niche || !data.targetAudience || !data.primaryPainPoint || !data.desiredOutcome}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : hasGenerated ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Regenerate with AI
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate with AI
                  </>
                )}
              </Button>
            </div>
            <Textarea
              id="problemStatement"
              value={data.problemStatement}
              onChange={(e) => handleFieldChange("problemStatement", e.target.value)}
              placeholder="A compelling statement that articulates your audience's core problem..."
              rows={4}
              className={cn(
                "min-h-[100px] bg-background",
                isFieldEmpty("problemStatement") && "border-destructive/50"
              )}
            />
            <p className="text-xs text-muted-foreground">
              This statement will be used across your sales copy and messaging
            </p>
            {isFieldEmpty("problemStatement") && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                Required - generate with AI or write your own
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
