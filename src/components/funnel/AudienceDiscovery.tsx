import { useState } from "react";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AudienceData {
  niche: string;
  targetAudience: string;
  primaryPainPoint: string;
  desiredOutcome: string;
  problemStatement: string;
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

  const handleGenerateProblemStatement = async () => {
    if (!data.niche || !data.targetAudience || !data.primaryPainPoint || !data.desiredOutcome) {
      toast.error("Please fill in all fields before generating");
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
      <div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Audience & Problem Discovery
        </h2>
        <p className="text-muted-foreground">
          Define who you're serving and the transformation you provide. This information 
          will shape all your offers and messaging.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label htmlFor="niche">Your Niche</Label>
          <Select
            value={data.niche}
            onValueChange={(value) => handleFieldChange("niche", value)}
          >
            <SelectTrigger id="niche">
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
        </div>

        <div className="space-y-2">
          <Label htmlFor="targetAudience">Target Audience</Label>
          <Textarea
            id="targetAudience"
            value={data.targetAudience}
            onChange={(e) => handleFieldChange("targetAudience", e.target.value)}
            placeholder="e.g., Busy professionals aged 35-50 who want to..."
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            Who specifically you help
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="primaryPainPoint">Primary Pain Point</Label>
          <Textarea
            id="primaryPainPoint"
            value={data.primaryPainPoint}
            onChange={(e) => handleFieldChange("primaryPainPoint", e.target.value)}
            placeholder="e.g., Struggling to maintain energy and focus throughout the day"
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            The main problem your audience faces
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="desiredOutcome">Desired Outcome</Label>
          <Textarea
            id="desiredOutcome"
            value={data.desiredOutcome}
            onChange={(e) => handleFieldChange("desiredOutcome", e.target.value)}
            placeholder="e.g., Sustainable energy, mental clarity, and work-life balance"
            rows={2}
          />
          <p className="text-xs text-muted-foreground">
            What your audience wants to achieve
          </p>
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="problemStatement">Problem Statement</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateProblemStatement}
            disabled={isGenerating}
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
          className="min-h-[100px]"
        />
        <p className="text-xs text-muted-foreground">
          This statement will be used across your sales copy and messaging
        </p>
      </div>
    </div>
  );
};
