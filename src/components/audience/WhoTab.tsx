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
import { Sparkles, Loader2, Check, AlertCircle, Lightbulb, ChevronDown, Copy } from "lucide-react";
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

const QUICK_ADD_CHIPS = [
  { label: "Female", category: "demographic" },
  { label: "Male", category: "demographic" },
  { label: "30-40s", category: "age" },
  { label: "40-50s", category: "age" },
  { label: "Entrepreneurs", category: "role" },
  { label: "Professionals", category: "role" },
  { label: "Coaches", category: "role" },
  { label: "Service Providers", category: "role" },
  { label: "Career Changers", category: "situation" },
  { label: "Scaling", category: "situation" },
  { label: "Starting Out", category: "situation" },
  { label: "Burned Out", category: "situation" },
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
  const [isExamplesOpen, setIsExamplesOpen] = useState(false);

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

  const handleChipClick = (label: string) => {
    const newValue = targetAudience ? `${targetAudience} ${label.toLowerCase()}` : label.toLowerCase();
    onTargetAudienceChange(newValue);
  };

  const handleUseExample = (example: string) => {
    onTargetAudienceChange(example);
    setIsExamplesOpen(false);
  };

  const getScoreColor = (score: number) => {
    if (score >= 7) return "bg-green-500/10 text-green-500 border-green-500/30";
    if (score >= 4) return "bg-yellow-500/10 text-yellow-500 border-yellow-500/30";
    return "bg-red-500/10 text-red-500 border-red-500/30";
  };

  const currentExamples = AUDIENCE_EXAMPLES[niche] || AUDIENCE_EXAMPLES["Other"];

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

      {/* Formula Helper */}
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
        <div className="flex items-start gap-2">
          <Lightbulb className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
          <div className="space-y-2">
            <p className="text-sm font-medium">Target Audience Formula</p>
            <p className="text-sm text-muted-foreground">
              <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs">
                [WHO they are] + [WHERE they are] + [WHAT they want]
              </span>
            </p>
            <p className="text-xs text-muted-foreground">
              Example: "Female entrepreneurs in their 30s who want to scale to 6 figures without burning out"
            </p>
          </div>
        </div>
      </div>

      {/* Quick-Add Chips */}
      <div className="space-y-2">
        <Label className="text-xs text-muted-foreground">Quick add descriptors:</Label>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_ADD_CHIPS.map((chip) => (
            <Badge
              key={chip.label}
              variant="outline"
              className="cursor-pointer hover:bg-primary/10 hover:border-primary/30 transition-colors text-xs"
              onClick={() => handleChipClick(chip.label)}
            >
              + {chip.label}
            </Badge>
          ))}
        </div>
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
          placeholder="Describe your ideal client using the formula above..."
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

      {/* Niche-Specific Examples */}
      <Collapsible open={isExamplesOpen} onOpenChange={setIsExamplesOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground hover:text-foreground">
            <span className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4" />
              See examples for {niche || "your niche"}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${isExamplesOpen ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <div className="space-y-2">
            {currentExamples.map((example, index) => (
              <div
                key={index}
                className="p-3 rounded-md bg-muted/30 border border-border/50 hover:border-primary/30 hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm text-muted-foreground flex-1">{example}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="opacity-0 group-hover:opacity-100 transition-opacity h-7 px-2"
                    onClick={() => handleUseExample(example)}
                  >
                    <Copy className="w-3 h-3 mr-1" />
                    Use
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>

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
