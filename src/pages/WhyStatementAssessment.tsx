import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { AssessmentProgressStepper } from "@/components/AssessmentProgressStepper";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Heart,
  Target,
  Lightbulb,
  Sparkles,
  FileText,
  RefreshCw,
  Save,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getAssessmentData, setAssessmentData, ASSESSMENT_KEYS } from "@/lib/assessmentStorage";

const launchFeelings = [
  "Exhausted",
  "Anxious",
  "Desperate",
  "Pushy",
  "Disappointed",
  "Excited",
  "Confident",
  "Energized",
  "Relieved when it's over",
];

const personalCosts = [
  "Burnout or exhaustion",
  "Time away from family",
  "Stress affecting my health",
  "Constant worry about money",
  "Feeling inauthentic or \"salesy\"",
  "Loss of passion for my work",
  "Inconsistent income creating instability",
  "Working more hours than I want to",
];

const benefits = [
  { id: 1, title: "Build Deep Trust with Your Audience", example: "I'm tired of feeling like I'm convincing people. I want them to trust me enough to buy confidently." },
  { id: 2, title: "Lower Ad Spend (or eliminate it)", example: "I'm spending $2K/month on ads with minimal return. I need organic growth strategies that work." },
  { id: 3, title: "Higher Conversion Rates", example: "Converting at 2% means I need a huge audience. If I could convert at 10%, I could hit my income goals with my current audience size." },
  { id: 4, title: "Launches That Get Easier Over Time", example: "Every launch feeling like starting from scratch is exhausting. I want each one to build on the last." },
  { id: 5, title: "Better Customer Retention", example: "I want clients who stay and refer others, not one-time buyers who disappear." },
  { id: 6, title: "Built-in Feedback Loops for Improvement", example: "I'm tired of guessing what will work. I need data to make better decisions." },
  { id: 7, title: "Natural Referral Engine Development", example: "Getting clients through referrals would be so much easier than cold marketing. I want that." },
  { id: 8, title: "Long-term Sustainable Business Success", example: "I'm building a business for the next 10 years, not just the next launch. I need sustainable systems." },
];

const visibilityCommitments = [
  "I'll write it on a sticky note on my computer",
  "I'll set it as my phone wallpaper",
  "I'll add it to my weekly review document",
  "I'll share it with my accountability partner",
  "I'll record a voice memo of myself reading it",
];

const stayCommittedItems = [
  "I feel impatient for results",
  "I want to skip ahead",
  "I'm tempted to cherry-pick only certain modules",
  "I face obstacles or setbacks",
  "I don't see immediate results",
];

const reviewPlanItems = [
  "Before every module",
  "Weekly during course completion",
  "When I feel stuck or unmotivated",
  "Before planning my first prelaunch",
  "Before every launch",
];

type PartKey = "part1" | "part2" | "part3" | "part4" | "part5" | "part6" | "part7" | "part8";

interface AssessmentData {
  // Part 1
  currentFrustration: string;
  selectedFeelings: string[];
  otherFeeling: string;
  dominantFeeling: string;
  conversionRate: string;
  launchRevenue: string;
  revenueComparison: string;
  revenueNeed: string;
  selectedCosts: string[];
  otherCost: string;
  biggestCost: string;
  // Part 2
  extraTimeEnergy: string;
  currentConversionRate: string;
  revenueImpact: string;
  businessDecisions: string;
  stressLevels: string;
  sustainableGrowthVision: string;
  // Part 3
  benefitRatings: Record<number, number>;
  benefitReasons: Record<number, string>;
  topBenefits: string[];
  // Part 4
  whoBenefits: string;
  whatBecomesPossible: string;
  buildingSomethingMeaning: string;
  // Part 5
  whyBecause: string;
  whySoThat: string;
  whyAllowMe: string;
  // Part 6
  reminderToSelf: string;
  visibilityCommitments: string[];
  otherVisibility: string;
  successLaunchesFeel: string;
  successConversionRates: string;
  successStressLevels: string;
  successClients: string;
  successLifeLooksLike: string;
  // Part 7
  userName: string;
  stayCommittedItems: string[];
  accountabilityPlan: string;
  completionDate: string;
  firstPrelaunchDate: string;
  // Part 8
  reviewPlanItems: string[];
}

const initialData: AssessmentData = {
  currentFrustration: "",
  selectedFeelings: [],
  otherFeeling: "",
  dominantFeeling: "",
  conversionRate: "",
  launchRevenue: "",
  revenueComparison: "about the same",
  revenueNeed: "",
  selectedCosts: [],
  otherCost: "",
  biggestCost: "",
  extraTimeEnergy: "",
  currentConversionRate: "",
  revenueImpact: "",
  businessDecisions: "",
  stressLevels: "",
  sustainableGrowthVision: "",
  benefitRatings: {},
  benefitReasons: {},
  topBenefits: ["", "", ""],
  whoBenefits: "",
  whatBecomesPossible: "",
  buildingSomethingMeaning: "",
  whyBecause: "",
  whySoThat: "",
  whyAllowMe: "",
  reminderToSelf: "",
  visibilityCommitments: [],
  otherVisibility: "",
  successLaunchesFeel: "",
  successConversionRates: "",
  successStressLevels: "",
  successClients: "",
  successLifeLooksLike: "",
  userName: "",
  stayCommittedItems: [],
  accountabilityPlan: "",
  completionDate: "",
  firstPrelaunchDate: "",
  reviewPlanItems: [],
};

const parts: { key: PartKey; title: string; icon: React.ElementType }[] = [
  { key: "part1", title: "Your Current Reality", icon: Target },
  { key: "part2", title: "Your Desired Future", icon: Lightbulb },
  { key: "part3", title: "Connecting to the 8 Benefits", icon: Heart },
  { key: "part4", title: "Your Deeper Why", icon: Sparkles },
  { key: "part5", title: "Crafting Your Why Statement", icon: FileText },
  { key: "part6", title: "Making It Stick", icon: CheckCircle2 },
  { key: "part7", title: "Your Commitment", icon: CheckCircle2 },
  { key: "part8", title: "Review & Complete", icon: RefreshCw },
];

const WhyStatementAssessment = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentPart, setCurrentPart] = useState(0);
  const [data, setData] = useState<AssessmentData>(initialData);
  const [isCompleted, setIsCompleted] = useState(false);
  const [visitedParts, setVisitedParts] = useState<number[]>([0]);

  // Load saved progress on mount
  useEffect(() => {
    if (!user?.id) return;
    const saved = getAssessmentData<any>(ASSESSMENT_KEYS.WHY_STATEMENT, user.id);
    if (saved) {
      try {
        if (saved.data) setData(saved.data);
        if (saved.currentPart !== undefined) setCurrentPart(saved.currentPart);
        if (saved.visitedParts) setVisitedParts(saved.visitedParts);
      } catch (e) {
        console.error("Failed to load saved progress", e);
      }
    }
  }, [user?.id]);

  const updateData = <K extends keyof AssessmentData>(key: K, value: AssessmentData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key: keyof AssessmentData, item: string) => {
    const arr = data[key] as string[];
    if (arr.includes(item)) {
      updateData(key, arr.filter((i) => i !== item) as AssessmentData[typeof key]);
    } else {
      updateData(key, [...arr, item] as AssessmentData[typeof key]);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentPart(stepIndex);
    if (!visitedParts.includes(stepIndex)) {
      setVisitedParts((prev) => [...prev, stepIndex]);
    }
  };

  const handleNext = () => {
    if (currentPart < parts.length - 1) {
      const nextPart = currentPart + 1;
      setCurrentPart(nextPart);
      if (!visitedParts.includes(nextPart)) {
        setVisitedParts((prev) => [...prev, nextPart]);
      }
    } else {
      setIsCompleted(true);
    }
  };

  const handlePrev = () => {
    if (currentPart > 0) {
      setCurrentPart(currentPart - 1);
    }
  };

  const handleSaveProgress = () => {
    if (!user?.id) return;
    const progressData = {
      data,
      currentPart,
      visitedParts,
      savedAt: new Date().toISOString(),
    };
    setAssessmentData(ASSESSMENT_KEYS.WHY_STATEMENT, user.id, progressData);
    toast({
      title: "Progress Saved",
      description: "Your progress has been saved. You can continue later.",
    });
  };

  const handleSave = () => {
    if (!user?.id) return;
    const progressData = {
      data,
      currentPart: parts.length - 1,
      visitedParts: parts.map((_, i) => i),
      completedAt: new Date().toISOString(),
    };
    setAssessmentData(ASSESSMENT_KEYS.WHY_STATEMENT, user.id, progressData);
    toast({
      title: "Assessment Saved",
      description: "Your Why Statement worksheet has been saved successfully.",
    });
    navigate("/assessments");
  };

  const handleRetake = () => {
    localStorage.removeItem(STORAGE_KEY);
    setData(initialData);
    setCurrentPart(0);
    setIsCompleted(false);
    setVisitedParts([0]);
  };

  const renderPart1 = () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <Label className="text-base font-medium">1. What's frustrating about your current launch approach?</Label>
        <Textarea
          placeholder="Be specific and honest..."
          value={data.currentFrustration}
          onChange={(e) => updateData("currentFrustration", e.target.value)}
          className="min-h-[120px]"
        />
      </div>

      <div className="space-y-4">
        <Label className="text-base font-medium">2. How do you feel during and after launches?</Label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {launchFeelings.map((feeling) => (
            <div key={feeling} className="flex items-center space-x-2">
              <Checkbox
                id={feeling}
                checked={data.selectedFeelings.includes(feeling)}
                onCheckedChange={() => toggleArrayItem("selectedFeelings", feeling)}
              />
              <Label htmlFor={feeling} className="text-sm cursor-pointer">{feeling}</Label>
            </div>
          ))}
          <div className="col-span-2 sm:col-span-3 flex items-center gap-2">
            <Checkbox
              id="other-feeling"
              checked={data.otherFeeling !== ""}
              onCheckedChange={() => data.otherFeeling && updateData("otherFeeling", "")}
            />
            <Input
              placeholder="Other..."
              value={data.otherFeeling}
              onChange={(e) => updateData("otherFeeling", e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
        <div className="mt-4">
          <Label className="text-sm">The dominant feeling I have during launches is:</Label>
          <Input
            value={data.dominantFeeling}
            onChange={(e) => updateData("dominantFeeling", e.target.value)}
            className="mt-2"
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-medium">3. What's the financial impact of your current approach?</Label>
        <div className="grid gap-4">
          <div>
            <Label className="text-sm">My typical conversion rate is:</Label>
            <Input
              placeholder="e.g., 5% or 'I don't know'"
              value={data.conversionRate}
              onChange={(e) => updateData("conversionRate", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">My typical launch revenue is:</Label>
            <Input
              placeholder="e.g., $5,000 or 'It varies wildly'"
              value={data.launchRevenue}
              onChange={(e) => updateData("launchRevenue", e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">This is</Label>
            <RadioGroup
              value={data.revenueComparison}
              onValueChange={(v) => updateData("revenueComparison", v)}
              className="flex gap-4"
            >
              {["more", "less", "about the same"].map((opt) => (
                <div key={opt} className="flex items-center space-x-1">
                  <RadioGroupItem value={opt} id={`rev-${opt}`} />
                  <Label htmlFor={`rev-${opt}`} className="text-sm cursor-pointer">{opt}</Label>
                </div>
              ))}
            </RadioGroup>
            <Label className="text-sm">than I need to:</Label>
          </div>
          <Input
            placeholder="e.g., pay myself a full-time salary, hire help, etc."
            value={data.revenueNeed}
            onChange={(e) => updateData("revenueNeed", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-medium">4. What's the personal cost of your current approach?</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {personalCosts.map((cost) => (
            <div key={cost} className="flex items-center space-x-2">
              <Checkbox
                id={cost}
                checked={data.selectedCosts.includes(cost)}
                onCheckedChange={() => toggleArrayItem("selectedCosts", cost)}
              />
              <Label htmlFor={cost} className="text-sm cursor-pointer">{cost}</Label>
            </div>
          ))}
          <div className="sm:col-span-2 flex items-center gap-2">
            <Checkbox
              id="other-cost"
              checked={data.otherCost !== ""}
              onCheckedChange={() => data.otherCost && updateData("otherCost", "")}
            />
            <Input
              placeholder="Other..."
              value={data.otherCost}
              onChange={(e) => updateData("otherCost", e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
        <div className="mt-4">
          <Label className="text-sm">The biggest personal cost is:</Label>
          <Input
            value={data.biggestCost}
            onChange={(e) => updateData("biggestCost", e.target.value)}
            className="mt-2"
          />
        </div>
      </div>
    </div>
  );

  const renderPart2 = () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <Label className="text-base font-medium">5. If your launches felt easy and energizing, what would you do with the extra time and energy?</Label>
        <Textarea
          value={data.extraTimeEnergy}
          onChange={(e) => updateData("extraTimeEnergy", e.target.value)}
          className="min-h-[120px]"
        />
      </div>

      <div className="space-y-4">
        <Label className="text-base font-medium">6. If your conversion rates doubled (or more), how would that change your business?</Label>
        <div className="bg-muted/50 p-4 rounded-lg space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm">If I converted at 10% instead of</span>
            <Input
              placeholder="%"
              value={data.currentConversionRate}
              onChange={(e) => updateData("currentConversionRate", e.target.value)}
              className="w-20"
            />
            <span className="text-sm">%:</span>
          </div>
          <div>
            <Label className="text-sm">Revenue impact:</Label>
            <Input
              value={data.revenueImpact}
              onChange={(e) => updateData("revenueImpact", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">Business decisions I could make:</Label>
            <Input
              value={data.businessDecisions}
              onChange={(e) => updateData("businessDecisions", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">Stress levels would:</Label>
            <Input
              value={data.stressLevels}
              onChange={(e) => updateData("stressLevels", e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-medium">7. What would sustainable, compound growth make possible in your life?</Label>
        <p className="text-sm text-muted-foreground">
          Think beyond just money. Consider: Time freedom, Creative energy, Impact on clients, Family/relationship quality, Health and wellness, Personal growth, Legacy
        </p>
        <Textarea
          value={data.sustainableGrowthVision}
          onChange={(e) => updateData("sustainableGrowthVision", e.target.value)}
          className="min-h-[150px]"
        />
      </div>
    </div>
  );

  const renderPart3 = () => (
    <div className="space-y-8">
      <p className="text-muted-foreground">
        For each benefit, rate how much you personally need it right now (1 = not really, 5 = desperately). Then note specifically why it matters to YOU.
      </p>

      {benefits.map((benefit) => (
        <Card key={benefit.id} className="border-border/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Benefit {benefit.id}: {benefit.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm">Need Level:</Label>
              <RadioGroup
                value={String(data.benefitRatings[benefit.id] || "")}
                onValueChange={(v) => updateData("benefitRatings", { ...data.benefitRatings, [benefit.id]: parseInt(v) })}
                className="flex gap-4 mt-2"
              >
                {[1, 2, 3, 4, 5].map((level) => (
                  <div key={level} className="flex items-center space-x-1">
                    <RadioGroupItem value={String(level)} id={`b${benefit.id}-${level}`} />
                    <Label htmlFor={`b${benefit.id}-${level}`} className="text-sm cursor-pointer">{level}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
            <div>
              <Label className="text-sm">Why this matters to me:</Label>
              <p className="text-xs text-muted-foreground mt-1 mb-2">Example: "{benefit.example}"</p>
              <Textarea
                value={data.benefitReasons[benefit.id] || ""}
                onChange={(e) => updateData("benefitReasons", { ...data.benefitReasons, [benefit.id]: e.target.value })}
                className="min-h-[80px]"
              />
            </div>
          </CardContent>
        </Card>
      ))}

      <div className="space-y-4">
        <Label className="text-base font-medium">Your Top 3 Benefits</Label>
        <p className="text-sm text-muted-foreground">Looking at your ratings, which 3 benefits do you need most right now?</p>
        <div className="grid gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <Badge variant="secondary" className="w-6 h-6 flex items-center justify-center rounded-full">{i + 1}</Badge>
              <Input
                value={data.topBenefits[i]}
                onChange={(e) => {
                  const newTop = [...data.topBenefits];
                  newTop[i] = e.target.value;
                  updateData("topBenefits", newTop);
                }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderPart4 = () => (
    <div className="space-y-8">
      <p className="text-muted-foreground">Go beyond business reasons. Why does this REALLY matter?</p>

      <div className="space-y-4">
        <Label className="text-base font-medium">8. Who benefits when you master prelaunch (besides you)?</Label>
        <p className="text-sm text-muted-foreground">
          Think about: Your clients and their transformations, Your family, Your community, The industry or movement you're part of
        </p>
        <Textarea
          value={data.whoBenefits}
          onChange={(e) => updateData("whoBenefits", e.target.value)}
          className="min-h-[120px]"
        />
      </div>

      <div className="space-y-4">
        <Label className="text-base font-medium">9. What becomes possible in your life when your business works sustainably?</Label>
        <Textarea
          value={data.whatBecomesPossible}
          onChange={(e) => updateData("whatBecomesPossible", e.target.value)}
          className="min-h-[120px]"
        />
      </div>

      <div className="space-y-4">
        <Label className="text-base font-medium">10. What would it mean to you personally to know you've built something that compounds and grows over time?</Label>
        <Textarea
          value={data.buildingSomethingMeaning}
          onChange={(e) => updateData("buildingSomethingMeaning", e.target.value)}
          className="min-h-[120px]"
        />
      </div>
    </div>
  );

  const renderPart5 = () => (
    <div className="space-y-8">
      <div className="bg-muted/50 p-4 rounded-lg">
        <p className="font-medium mb-2">Use this framework:</p>
        <p className="text-sm text-muted-foreground italic">
          "I'm mastering prelaunch because [what you want to change/achieve], so that [the impact on your life and others], which will allow me to [your deeper purpose or vision]."
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="font-medium">Example Why Statements:</h3>
        <div className="space-y-3 text-sm text-muted-foreground">
          <p className="bg-background p-3 rounded border border-border/50">
            "I'm mastering prelaunch because I'm tired of exhausting launches that barely convert, so that I can build a sustainable business that serves my family and my clients well, which will allow me to make the impact I'm meant to make without burning out."
          </p>
          <p className="bg-background p-3 rounded border border-border/50">
            "I'm mastering prelaunch because I know my program transforms lives but I'm not getting it in front of enough people, so that more coaches can experience the confidence I want them to have, which will allow me to create generational wealth while working 25 hours a week."
          </p>
          <p className="bg-background p-3 rounded border border-border/50">
            "I'm mastering prelaunch because I'm spending $3K/month on ads that don't convert and I can't sustain that, so that I can build organic growth systems that work, which will allow me to finally feel secure in my business and be present with my kids."
          </p>
        </div>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">YOUR Why Statement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium">"I'm mastering prelaunch because:</Label>
            <Textarea
              value={data.whyBecause}
              onChange={(e) => updateData("whyBecause", e.target.value)}
              className="mt-2 min-h-[80px]"
              placeholder="What you want to change/achieve..."
            />
          </div>
          <div>
            <Label className="text-sm font-medium">so that:</Label>
            <Textarea
              value={data.whySoThat}
              onChange={(e) => updateData("whySoThat", e.target.value)}
              className="mt-2 min-h-[80px]"
              placeholder="The impact on your life and others..."
            />
          </div>
          <div>
            <Label className="text-sm font-medium">which will allow me to:</Label>
            <Textarea
              value={data.whyAllowMe}
              onChange={(e) => updateData("whyAllowMe", e.target.value)}
              className="mt-2 min-h-[80px]"
              placeholder="Your deeper purpose or vision..."
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPart6 = () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <Label className="text-base font-medium">11. When you feel like giving up or skipping steps in this course, what will you remind yourself?</Label>
        <p className="text-sm text-muted-foreground">Reference your Why Statement</p>
        <Textarea
          value={data.reminderToSelf}
          onChange={(e) => updateData("reminderToSelf", e.target.value)}
          className="min-h-[120px]"
        />
      </div>

      <div className="space-y-4">
        <Label className="text-base font-medium">12. How will you keep your Why Statement visible?</Label>
        <div className="grid gap-3">
          {visibilityCommitments.map((item) => (
            <div key={item} className="flex items-center space-x-2">
              <Checkbox
                id={item}
                checked={data.visibilityCommitments.includes(item)}
                onCheckedChange={() => toggleArrayItem("visibilityCommitments", item)}
              />
              <Label htmlFor={item} className="text-sm cursor-pointer">{item}</Label>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <Checkbox
              id="other-visibility"
              checked={data.otherVisibility !== ""}
              onCheckedChange={() => data.otherVisibility && updateData("otherVisibility", "")}
            />
            <Input
              placeholder="Other..."
              value={data.otherVisibility}
              onChange={(e) => updateData("otherVisibility", e.target.value)}
              className="flex-1"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-medium">13. How will you know when you've successfully mastered prelaunch?</Label>
        <p className="text-sm text-muted-foreground">What will be different? Be specific:</p>
        <div className="grid gap-4">
          <div>
            <Label className="text-sm">My launches will feel:</Label>
            <Input
              value={data.successLaunchesFeel}
              onChange={(e) => updateData("successLaunchesFeel", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">My conversion rates will be:</Label>
            <Input
              value={data.successConversionRates}
              onChange={(e) => updateData("successConversionRates", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">My stress levels will be:</Label>
            <Input
              value={data.successStressLevels}
              onChange={(e) => updateData("successStressLevels", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">My clients will:</Label>
            <Input
              value={data.successClients}
              onChange={(e) => updateData("successClients", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-sm">My life will look like:</Label>
            <Input
              value={data.successLifeLooksLike}
              onChange={(e) => updateData("successLifeLooksLike", e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderPart7 = () => (
    <div className="space-y-8">
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">Final Commitment Statement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium">I,</span>
            <Input
              placeholder="Your name"
              value={data.userName}
              onChange={(e) => updateData("userName", e.target.value)}
              className="w-48"
            />
            <span className="text-sm font-medium">, commit to working through my complete prelaunch or launch strategy.</span>
          </div>
          <p className="text-sm text-muted-foreground italic bg-background p-3 rounded">
            {data.whyBecause && data.whySoThat && data.whyAllowMe
              ? `"I'm mastering prelaunch because ${data.whyBecause}, so that ${data.whySoThat}, which will allow me to ${data.whyAllowMe}."`
              : "Your Why Statement will appear here once you complete Part 5"}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Label className="text-base font-medium">I will stay committed even when:</Label>
        <div className="grid gap-3">
          {stayCommittedItems.map((item) => (
            <div key={item} className="flex items-center space-x-2">
              <Checkbox
                id={`commit-${item}`}
                checked={data.stayCommittedItems.includes(item)}
                onCheckedChange={() => toggleArrayItem("stayCommittedItems", item)}
              />
              <Label htmlFor={`commit-${item}`} className="text-sm cursor-pointer">{item}</Label>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <Label className="text-base font-medium">I will hold myself accountable by:</Label>
        <Textarea
          placeholder="Partner, coach, group, self-review schedule, etc."
          value={data.accountabilityPlan}
          onChange={(e) => updateData("accountabilityPlan", e.target.value)}
          className="min-h-[100px]"
        />
      </div>

      <div className="space-y-4">
        <Label className="text-base font-medium">My commitment timeline is:</Label>
        <div>
          <Label className="text-sm">I will implement my first complete prelaunch by:</Label>
          <Input
            type="date"
            value={data.firstPrelaunchDate}
            onChange={(e) => updateData("firstPrelaunchDate", e.target.value)}
            className="mt-1 max-w-xs"
          />
        </div>
      </div>
    </div>
  );

  const renderPart8 = () => (
    <div className="space-y-8">
      <div className="space-y-4">
        <Label className="text-base font-medium">Plan to Reread Your Why Statement:</Label>
        <div className="grid gap-3">
          {reviewPlanItems.map((item) => (
            <div key={item} className="flex items-center space-x-2">
              <Checkbox
                id={`review-${item}`}
                checked={data.reviewPlanItems.includes(item)}
                onCheckedChange={() => toggleArrayItem("reviewPlanItems", item)}
              />
              <Label htmlFor={`review-${item}`} className="text-sm cursor-pointer">{item}</Label>
            </div>
          ))}
        </div>
      </div>

      <Card className="bg-muted/50 border-0">
        <CardHeader>
          <CardTitle className="text-base">Important Reminders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p><strong>1. Your why is personal:</strong> There's no "right" answer. What matters to you is what will keep you going.</p>
          <p><strong>2. Your why may evolve:</strong> That's okay. Revisit and refine as needed.</p>
          <p><strong>3. Your why is your anchor:</strong> When the course gets challenging or you want to give up, return to this.</p>
          <p><strong>4. Your why should inspire you:</strong> If reading your Why Statement doesn't motivate you, rewrite it until it does.</p>
          <p><strong>5. Your why is enough:</strong> You don't need a perfect, poetic statement. You need one that's true and powerful for you.</p>
        </CardContent>
      </Card>

      {data.whyBecause && data.whySoThat && data.whyAllowMe && (
        <Card className="border-primary bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Your Complete Why Statement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-medium">
              "I'm mastering prelaunch because {data.whyBecause}, so that {data.whySoThat}, which will allow me to {data.whyAllowMe}."
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );

  const renderCompletedView = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto"
    >
      <Card className="text-center">
        <CardHeader>
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Why Statement Complete!</CardTitle>
          <CardDescription className="text-base">
            You've created your personal Why Statement for mastering prelaunch.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {data.whyBecause && data.whySoThat && data.whyAllowMe && (
            <Card className="border-primary bg-primary/5 text-left">
              <CardContent className="pt-6">
                <p className="text-lg font-medium">
                  "I'm mastering prelaunch because {data.whyBecause}, so that {data.whySoThat}, which will allow me to {data.whyAllowMe}."
                </p>
              </CardContent>
            </Card>
          )}

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={handleSave}>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Save Assessment
            </Button>
            <Button variant="outline" onClick={handleRetake}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Start Over
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderCurrentPart = () => {
    switch (parts[currentPart].key) {
      case "part1": return renderPart1();
      case "part2": return renderPart2();
      case "part3": return renderPart3();
      case "part4": return renderPart4();
      case "part5": return renderPart5();
      case "part6": return renderPart6();
      case "part7": return renderPart7();
      case "part8": return renderPart8();
      default: return null;
    }
  };

  return (
    <ProjectLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Personal "Why Statement" for Mastering Prelaunch</h1>
          <p className="text-muted-foreground">
            Create a personal Why Statement that will keep you motivated and remind you why you're investing in this system.
          </p>
        </motion.div>

        {!isCompleted && (
          <AssessmentProgressStepper
            steps={parts.map((p) => ({ key: p.key, title: p.title, icon: p.icon }))}
            currentStep={currentPart}
            onStepClick={handleStepClick}
            completedSteps={visitedParts}
          />
        )}

        <AnimatePresence mode="wait">
          {isCompleted ? (
            renderCompletedView()
          ) : (
            <motion.div
              key={currentPart}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      {(() => {
                        const Icon = parts[currentPart].icon;
                        return <Icon className="w-5 h-5 text-primary" />;
                      })()}
                    </div>
                    <div>
                      <CardTitle>Part {currentPart + 1}: {parts[currentPart].title}</CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {renderCurrentPart()}

                  <div className="flex flex-col sm:flex-row justify-between gap-3 mt-8 pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={handlePrev}
                      disabled={currentPart === 0}
                    >
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="secondary" onClick={handleSaveProgress}>
                        <Save className="w-4 h-4 mr-2" />
                        Save Progress
                      </Button>
                      <Button onClick={handleNext}>
                        {currentPart === parts.length - 1 ? "Complete" : "Next"}
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ProjectLayout>
  );
};

export default WhyStatementAssessment;
