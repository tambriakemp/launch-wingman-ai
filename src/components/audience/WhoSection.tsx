import { useState } from "react";
import { Label } from "@/components/ui/label";
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Sparkles, Loader2, Check, AlertCircle, ChevronDown, Copy, Target, Heart, User } from "lucide-react";
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

const AUDIENCE_EXAMPLES: Record<string, string[]> = {
  "Business Coaching": [
    "Solo consultants earning under $100k who want to scale without hiring a team",
    "Corporate professionals with expertise who want to start coaching but have no audience",
    "Service providers trading time for money who want to create passive income streams",
  ],
  "Life Coaching": [
    "High-achieving women in their 40s feeling unfulfilled despite career success",
    "Mid-career professionals questioning their life direction after major transitions",
    "Empty nesters rediscovering their identity and purpose beyond parenting",
  ],
  "Health & Fitness": [
    "Busy professionals aged 35-50 who've tried every diet but can't maintain results",
    "New moms wanting to rebuild strength and energy after pregnancy",
    "Men over 40 who want to lose weight without extreme diets or hours at the gym",
  ],
  "Career & Leadership": [
    "First-time managers struggling to transition from individual contributor to leader",
    "Women in tech who feel overlooked for promotions despite strong performance",
    "Senior professionals preparing for executive roles within 2-3 years",
  ],
  "Relationships & Dating": [
    "Divorced professionals in their 40s re-entering the dating scene after long marriages",
    "Successful single women who attract emotionally unavailable partners",
    "Couples married 10+ years wanting to reconnect and reignite intimacy",
  ],
  "Mindset & Personal Development": [
    "Overthinkers and perfectionists whose self-doubt blocks their potential",
    "People-pleasers who struggle to set boundaries in work and relationships",
    "Ambitious professionals battling imposter syndrome despite achievements",
  ],
  "Financial Coaching": [
    "Millennials earning $75k+ but living paycheck to paycheck with no savings",
    "Freelancers and gig workers who struggle with irregular income management",
    "Couples constantly fighting about money with different spending philosophies",
  ],
  "Creative & Artistic": [
    "Hobbyist artists wanting to transition to selling their work full-time",
    "Writers with unfinished manuscripts who can't push through creative blocks",
    "Musicians and performers struggling to build sustainable income from their art",
  ],
  "Parenting & Family": [
    "First-time parents overwhelmed by conflicting advice and parenting anxiety",
    "Parents of teens struggling with communication and behavior challenges",
    "Working moms battling guilt about work-life balance and not being 'enough'",
  ],
  "Spiritual & Wellness": [
    "Stressed professionals seeking deeper meaning beyond material success",
    "Women going through spiritual awakening but feeling isolated and confused",
    "People recovering from religious trauma exploring new spiritual paths",
  ],
  "Marketing & Sales": [
    "Coaches and consultants who hate selling and avoid sales conversations",
    "Small business owners doing everything themselves without marketing strategy",
    "Course creators with great content but no audience or launch strategy",
  ],
  "Productivity & Time Management": [
    "Overwhelmed business owners working 60+ hour weeks with no work-life balance",
    "ADHD entrepreneurs struggling to focus and follow through on projects",
    "Remote workers who can't separate work from life and feel always 'on'",
  ],
  "Other": [
    "A specific group of people with a shared problem or goal",
    "Individuals at a particular life stage facing common challenges",
    "Professionals in a niche industry seeking specialized transformation",
  ],
};

interface SubAudience {
  name: string;
  description: string;
  painTrigger: string;
}

interface AudienceVariation {
  type: string;
  label: string;
  statement: string;
}

interface WhoSectionProps {
  niche: string;
  targetAudience: string;
  subAudiences: SubAudience[];
  specificityScore: number;
  onNicheChange: (value: string) => void;
  onTargetAudienceChange: (value: string) => void;
  onSubAudiencesChange: (value: SubAudience[]) => void;
  onSpecificityScoreChange: (value: number) => void;
}

const getVariationIcon = (type: string) => {
  switch (type) {
    case "specific":
      return <Target className="w-4 h-4" />;
    case "aspirational":
      return <Heart className="w-4 h-4" />;
    case "pain":
      return <User className="w-4 h-4" />;
    default:
      return <Target className="w-4 h-4" />;
  }
};

const getVariationColor = (type: string) => {
  switch (type) {
    case "specific":
      return "bg-blue-500/10 text-blue-600 border-blue-500/30";
    case "aspirational":
      return "bg-pink-500/10 text-pink-600 border-pink-500/30";
    case "pain":
      return "bg-orange-500/10 text-orange-600 border-orange-500/30";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const WhoSection = ({
  niche,
  targetAudience,
  subAudiences,
  specificityScore,
  onNicheChange,
  onTargetAudienceChange,
  onSubAudiencesChange,
  onSpecificityScoreChange,
}: WhoSectionProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [specificityFeedback, setSpecificityFeedback] = useState<string>("");
  const [selectedSubAudience, setSelectedSubAudience] = useState<string | null>(null);
  const [isExamplesOpen, setIsExamplesOpen] = useState(false);
  
  // New state for refined variations
  const [refinedVariations, setRefinedVariations] = useState<AudienceVariation[]>([]);
  const [selectedVariation, setSelectedVariation] = useState<string | null>(null);
  const [isGeneratingRefinements, setIsGeneratingRefinements] = useState(false);

  const handleGenerateRefinements = async () => {
    if (!niche || !targetAudience) return;

    setIsGeneratingRefinements(true);
    setRefinedVariations([]);
    setSelectedVariation(null);

    try {
      const { data, error } = await supabase.functions.invoke('generate-audience-refinements', {
        body: { niche, targetAudience }
      });

      if (error) throw error;

      if (data.variations) {
        setRefinedVariations(data.variations);
        // Auto-open the examples/suggestions section
        setIsExamplesOpen(true);
      }
      if (typeof data.specificityScore === 'number') {
        onSpecificityScoreChange(data.specificityScore);
      }
      if (data.specificityFeedback) {
        setSpecificityFeedback(data.specificityFeedback);
      }
    } catch (error) {
      console.error("Error generating audience refinements:", error);
    } finally {
      setIsGeneratingRefinements(false);
    }
  };

  const handleSelectVariation = (variation: AudienceVariation) => {
    setSelectedVariation(variation.type);
    onTargetAudienceChange(variation.statement);
  };

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

  const handleUseExample = (example: string) => {
    onTargetAudienceChange(example);
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return "bg-green-500/10 text-green-600 border-green-500/30";
    if (score >= 4) return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30";
    return "bg-red-500/10 text-red-600 border-red-500/30";
  };

  const currentExamples = AUDIENCE_EXAMPLES[niche] || AUDIENCE_EXAMPLES["Other"];
  const hasContext = !!(niche && targetAudience);

  return (
    <div className="space-y-5">
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

      {/* Target Audience */}
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
          placeholder="Describe your ideal client - who they are, their situation, what they want..."
          value={targetAudience}
          onChange={(e) => onTargetAudienceChange(e.target.value)}
          rows={3}
          className="resize-none"
        />
        
        {/* Generate button right below textarea */}
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            💡 Type your rough description, then click Generate to refine it
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateRefinements}
            disabled={!hasContext || isGeneratingRefinements}
            className="gap-2"
          >
            {isGeneratingRefinements ? (
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
      </div>

      {/* Specificity Feedback */}
      {specificityFeedback && (
        <div className="flex items-start gap-2 p-3 rounded-md bg-muted/50 border border-border">
          <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-muted-foreground">{specificityFeedback}</p>
        </div>
      )}

      {/* Need Inspiration Section - Template Examples Only */}
      {niche && (
        <Collapsible open={isExamplesOpen} onOpenChange={setIsExamplesOpen}>
          <CollapsibleTrigger asChild>
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full justify-between text-muted-foreground hover:text-foreground h-9 px-3"
            >
              <span className="text-sm">Need inspiration? See examples</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${isExamplesOpen ? "rotate-180" : ""}`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            {/* Static Niche Examples */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">
                Click to use an example:
              </Label>
              {currentExamples.map((example, index) => (
                <div
                  key={index}
                  className="p-3 rounded-md bg-muted/30 border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-colors group cursor-pointer"
                  onClick={() => handleUseExample(example)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-muted-foreground flex-1">{example}</p>
                    <Copy className="w-4 h-4 text-muted-foreground/50 group-hover:text-primary transition-colors flex-shrink-0" />
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* AI-Refined Variations Section - Outside Dropdown */}
      {refinedVariations.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-sm">AI-Refined Variations</Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleGenerateRefinements}
              disabled={!hasContext || isGeneratingRefinements}
              className="h-7 text-xs gap-1"
            >
              {isGeneratingRefinements ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              Regenerate
            </Button>
          </div>
          <div className="grid gap-2">
            {refinedVariations.map((variation) => (
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

      {/* Analyze Audience Section */}
      <div className="pt-3 border-t border-border space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-sm">Analyze Audience</Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              Get refined audience segments and analysis
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleGenerateSubAudiences}
            disabled={!niche || isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                {subAudiences.length > 0 ? "Re-analyze" : "Analyze"}
              </>
            )}
          </Button>
        </div>

        {subAudiences.length > 0 && (
          <div className="grid gap-2">
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{sub.name}</span>
                      {selectedSubAudience === sub.name && (
                        <Check className="w-4 h-4 text-primary flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {sub.description}
                    </p>
                    <p className="text-xs text-muted-foreground/70 mt-1">
                      <span className="font-medium">Pain trigger:</span> {sub.painTrigger}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
