import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AssessmentProgressBar } from "@/components/AssessmentProgressBar";
import {
  Users,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Save,
  CheckCircle2,
  Heart,
  DollarSign,
  Package,
  Mail,
  Loader2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

type CoachType = "maya" | "derek" | "lauren";

interface SetQuestion {
  id: string;
  category: CoachType;
  statements: string[];
}

interface SavedCoachAssessment {
  setAnswers: Record<string, CoachType>;
  reflections: Record<string, string>;
  barriers: string[];
  barrierExpansion: string;
  commitment: Record<string, string>;
  primaryApproach: CoachType;
  completedAt: string;
  reminderScheduled?: boolean;
}

const setQuestions: { part: string; sets: SetQuestion[] }[] = [
  {
    part: "Set A: Time & Energy Allocation",
    sets: [
      {
        id: "time_energy",
        category: "maya",
        statements: [
          "I spend significant time building relationships with individual community members",
          "I prioritize depth of connection over breadth of reach",
          "I invest in community experiences that bring people together",
          "Most of my time goes to engagement, not just content creation",
        ],
      },
      {
        id: "time_energy_derek",
        category: "derek",
        statements: [
          "I focus most energy on creating sales content and pitches",
          "I'm always looking for the next quick conversion opportunity",
          "I spend more time selling than building relationships",
          "My primary metric is sales, not community engagement",
        ],
      },
      {
        id: "time_energy_lauren",
        category: "lauren",
        statements: [
          "I spend most time perfecting my program content and curriculum",
          "I'm constantly improving and refining what I teach",
          "I focus more on the quality of my offering than on audience building",
          "Most of my energy goes into being a great coach/teacher",
        ],
      },
    ],
  },
  {
    part: "Set B: Launch Strategy",
    sets: [
      {
        id: "launch_maya",
        category: "maya",
        statements: [
          "I spend 6-8 weeks building trust and desire before opening enrollment",
          "My launches feel like invitations to something people already want",
          "People often ask me when enrollment opens before I announce it",
          "Launches feel energizing because I'm connecting with prepared people",
        ],
      },
      {
        id: "launch_derek",
        category: "derek",
        statements: [
          "I keep my prelaunch period short so I can get to sales faster",
          "My launches involve a lot of convincing and objection handling",
          "I use urgency and scarcity heavily to drive conversions",
          "Launches feel exhausting because I'm working hard to convert people",
        ],
      },
      {
        id: "launch_lauren",
        category: "lauren",
        statements: [
          "I don't spend much time on prelaunch - I just announce when ready",
          "My launches are low-key; I don't want to be \"salesy\"",
          "I assume if my program is good enough, people will find it and buy it",
          "Launches feel disappointing because fewer people buy than I expected",
        ],
      },
    ],
  },
  {
    part: "Set C: Content Focus",
    sets: [
      {
        id: "content_maya",
        category: "maya",
        statements: [
          "My content focuses on building relationships and trust over time",
          "I share stories, vulnerabilities, and client transformations regularly",
          "My content creates desire for transformation, not just for my program",
          "I balance teaching with connection-building",
        ],
      },
      {
        id: "content_derek",
        category: "derek",
        statements: [
          "Most of my content is designed to lead to a sale",
          "I frequently include calls-to-action and pitches in my posts",
          "My content is very results-focused and benefit-driven",
          "I'm always thinking \"How does this post convert?\"",
        ],
      },
      {
        id: "content_lauren",
        category: "lauren",
        statements: [
          "My content is primarily educational and value-packed",
          "I teach a lot but don't talk much about my offerings",
          "I avoid too much self-promotion; I just want to help people",
          "I assume good content will naturally lead to sales without asking",
        ],
      },
    ],
  },
  {
    part: "Set D: How You Feel About Your Business",
    sets: [
      {
        id: "feelings_maya",
        category: "maya",
        statements: [
          "I feel sustainable - my business energizes me more than drains me",
          "Each launch gets easier than the last",
          "I feel genuinely connected to my community",
          "I'm building something that compounds over time",
        ],
      },
      {
        id: "feelings_derek",
        category: "derek",
        statements: [
          "I feel exhausted - every launch requires massive effort",
          "Each launch feels like starting over from scratch",
          "I'm constantly worried about where the next sale comes from",
          "I'm making money but burning out",
        ],
      },
      {
        id: "feelings_lauren",
        category: "lauren",
        statements: [
          "I feel frustrated - my program is great but sales are low",
          "I'm confused why more people aren't buying",
          "I feel undervalued; people don't appreciate the quality I provide",
          "I'm great at delivery but struggle with business growth",
        ],
      },
    ],
  },
];

const barrierOptions = [
  "I don't know how to build community effectively",
  "It feels too slow; I need money faster",
  "I'm afraid I'll give away too much for free",
  "I don't want to be vulnerable or personal online",
  "I don't have time for relationship building",
  "I'm not good at engagement or connection",
];

const coachProfiles: Record<CoachType, {
  name: string;
  title: string;
  icon: typeof Heart;
  color: string;
  bgColor: string;
  description: string;
  trajectory: { period: string; description: string }[];
  challenges: string[];
  advantages: string[];
  focus: string;
}> = {
  maya: {
    name: "Maya",
    title: "The Community Builder",
    icon: Heart,
    color: "text-success",
    bgColor: "bg-success/10",
    description: "You understand that sustainable business is built on relationships. You invest in your community and play the long game.",
    trajectory: [
      { period: "Year 1-2", description: "Building foundation, moderate income, high fulfillment" },
      { period: "Year 3-5", description: "Compound growth kicks in, launches get easier, referrals increase" },
      { period: "Year 5+", description: "Established community, consistent income, sustainable lifestyle" },
    ],
    challenges: [
      "May feel slow at first compared to direct sellers",
      "Requires patience and consistency",
      "Need to balance relationship building with revenue generation",
    ],
    advantages: [
      "Sustainable, gets easier over time",
      "Higher client satisfaction and retention",
      "Natural referral engine develops",
      "Less burnout, more fulfillment",
    ],
    focus: "Continue what you're doing, but make sure you're also monetizing effectively. Sometimes community builders give too much for free. Balance generosity with healthy boundaries.",
  },
  derek: {
    name: "Derek",
    title: "The Direct Seller",
    icon: DollarSign,
    color: "text-warning",
    bgColor: "bg-warning/10",
    description: "You focus on quick conversions and direct selling. You may be making money but feel exhausted by the constant hustle.",
    trajectory: [
      { period: "Year 1-2", description: "Quick wins, decent income, high energy required" },
      { period: "Year 3-5", description: "Burnout starts, conversions get harder, audience fatigue sets in" },
      { period: "Year 5+", description: "Either pivot to relationships or exit business due to exhaustion" },
    ],
    challenges: [
      "Constantly needing new audience (people disengage after being sold to repeatedly)",
      "Each launch requires same massive effort",
      "High burnout risk",
      "Lower client retention and referrals",
    ],
    advantages: [
      "Quick to revenue",
      "Clear, direct approach",
      "Strong sales skills",
    ],
    focus: "You need to shift from selling-first to relationship-first. This doesn't mean stop selling, but it means building trust before asking for the sale. Extend your prelaunch period. Focus on community building. Your sales skills are valuable - redirect them toward prepared audiences.",
  },
  lauren: {
    name: "Lauren",
    title: "The Product-Centric Coach",
    icon: Package,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
    description: "You have a quality program but struggle to get it in front of people. You focus on being a great coach/teacher but haven't built the audience or relationships needed for consistent sales.",
    trajectory: [
      { period: "Year 1-2", description: "Great program, disappointing sales, growing frustration" },
      { period: "Year 3-5", description: "Either learn marketing/relationships or give up on business" },
      { period: "Year 5+", description: "Either pivot to audience building or return to one-on-one work only" },
    ],
    challenges: [
      "Amazing offering but no one knows about it",
      "Sales feel like a mystery or an afterthought",
      "Difficulty translating quality into revenue",
      "May resist \"marketing\" as inauthentic",
    ],
    advantages: [
      "Exceptional at delivery",
      "Strong curriculum and teaching skills",
      "Deep expertise",
      "High client results (for those who do work with you)",
    ],
    focus: "You need to build an audience and relationships BEFORE trying to sell. Your program is probably excellent, but people can't buy what they don't know about or trust yet. Shift 50% of your energy from perfecting content to building audience and relationships. Start with consistent, valuable content and genuine engagement.",
  },
};

const reflectionQuestions = [
  {
    id: "resonate",
    question: "How do you feel about your primary approach identification? Does it resonate as true?",
  },
  {
    id: "concerns",
    question: "Looking at the long-term trajectory, what concerns you most about staying on your current path?",
  },
  {
    id: "maya_behavior",
    question: "What's one specific behavior from Maya's approach you can start implementing this week?",
  },
  {
    id: "maya_results",
    question: "If you achieved Maya's results (sustainable, compound growth, energizing launches, loyal community), what would change about your life and business?",
  },
];

const commitmentFields = [
  { id: "current_approach", label: "I recognize that my current approach is primarily:" },
  { id: "long_term_outcome", label: "The long-term outcome of this approach if I don't change is:" },
  { id: "shift_toward", label: "The approach I want to shift toward is:" },
  { id: "change_needed", label: "The #1 thing I need to change to make this shift is:" },
  { id: "intention", label: "I commit to working through this course with the intention of:" },
  { id: "accountability", label: "My accountability for this commitment is:" },
];

const STORAGE_KEY = "coach_hub_coach_assessment";

const CoachAssessment = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [checkedStatements, setCheckedStatements] = useState<Record<string, boolean>>({});
  const [setAnswers, setSetAnswers] = useState<Record<string, CoachType>>({});
  const [reflections, setReflections] = useState<Record<string, string>>({});
  const [barriers, setBarriers] = useState<string[]>([]);
  const [barrierOther, setBarrierOther] = useState("");
  const [barrierExpansion, setBarrierExpansion] = useState("");
  const [commitment, setCommitment] = useState<Record<string, string>>({});
  const [savedAssessment, setSavedAssessment] = useState<SavedCoachAssessment | null>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isSendingReminder, setIsSendingReminder] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setSavedAssessment(JSON.parse(saved));
    }
    // Also check for in-progress data
    const progressData = localStorage.getItem(STORAGE_KEY + "_progress");
    if (progressData) {
      try {
        const parsed = JSON.parse(progressData);
        if (parsed.checkedStatements) setCheckedStatements(parsed.checkedStatements);
        if (parsed.setAnswers) setSetAnswers(parsed.setAnswers);
        if (parsed.reflections) setReflections(parsed.reflections);
        if (parsed.barriers) setBarriers(parsed.barriers);
        if (parsed.barrierOther) setBarrierOther(parsed.barrierOther);
        if (parsed.barrierExpansion) setBarrierExpansion(parsed.barrierExpansion);
        if (parsed.commitment) setCommitment(parsed.commitment);
        if (parsed.currentStep !== undefined) setCurrentStep(parsed.currentStep);
      } catch (e) {
        console.error("Failed to load saved progress", e);
      }
    }
  }, []);

  // Calculate which coach type has most checks for each set
  const calculateSetWinner = (partIndex: number): CoachType | null => {
    const sets = setQuestions[partIndex].sets;
    const counts: Record<CoachType, number> = { maya: 0, derek: 0, lauren: 0 };
    
    sets.forEach(set => {
      set.statements.forEach((_, idx) => {
        const key = `${set.id}_${idx}`;
        if (checkedStatements[key]) {
          counts[set.category]++;
        }
      });
    });

    const max = Math.max(counts.maya, counts.derek, counts.lauren);
    if (max === 0) return null;
    
    if (counts.maya >= counts.derek && counts.maya >= counts.lauren) return "maya";
    if (counts.derek >= counts.lauren) return "derek";
    return "lauren";
  };

  const handleStatementToggle = (setId: string, statementIndex: number) => {
    const key = `${setId}_${statementIndex}`;
    setCheckedStatements(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleNextPart = () => {
    const winner = calculateSetWinner(currentStep);
    if (winner) {
      setSetAnswers(prev => ({ ...prev, [`part_${currentStep}`]: winner }));
    }
    if (currentStep < setQuestions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevPart = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const handleSaveProgress = () => {
    const progressData = {
      checkedStatements,
      setAnswers,
      reflections,
      barriers,
      barrierOther,
      barrierExpansion,
      commitment,
      currentStep,
      savedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY + "_progress", JSON.stringify(progressData));
    toast({
      title: "Progress Saved",
      description: "Your progress has been saved. You can continue later.",
    });
  };

  const calculatePrimaryApproach = (): CoachType => {
    const counts: Record<CoachType, number> = { maya: 0, derek: 0, lauren: 0 };
    Object.values(setAnswers).forEach(approach => {
      counts[approach]++;
    });
    
    if (counts.maya >= counts.derek && counts.maya >= counts.lauren) return "maya";
    if (counts.derek >= counts.lauren) return "derek";
    return "lauren";
  };

  const handleSave = async () => {
    const primaryApproach = calculatePrimaryApproach();
    const assessment: SavedCoachAssessment = {
      setAnswers,
      reflections,
      barriers: [...barriers, ...(barrierOther ? [barrierOther] : [])],
      barrierExpansion,
      commitment,
      primaryApproach,
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assessment));
    setSavedAssessment(assessment);
    toast({
      title: "Assessment Saved",
      description: "Your assessment has been saved successfully.",
    });
    navigate("/assessments");
  };

  const handleScheduleReminder = async () => {
    if (!user?.email) {
      toast({
        title: "Error",
        description: "No email address found for your account.",
        variant: "destructive",
      });
      return;
    }

    setIsSendingReminder(true);
    try {
      const { error } = await supabase.functions.invoke("send-assessment-reminder", {
        body: {
          email: user.email,
          assessmentType: "Which Coach Are You?",
          completedAt: new Date().toISOString(),
        },
      });

      if (error) throw error;

      const updated = { ...savedAssessment!, reminderScheduled: true };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setSavedAssessment(updated);

      toast({
        title: "Reminder Scheduled",
        description: "You'll receive an email reminder in 90 days to revisit this assessment.",
      });
    } catch (error) {
      console.error("Error scheduling reminder:", error);
      toast({
        title: "Error",
        description: "Failed to schedule reminder. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSendingReminder(false);
    }
  };

  const handleRetake = () => {
    setCheckedStatements({});
    setSetAnswers({});
    setReflections({});
    setBarriers([]);
    setBarrierOther("");
    setBarrierExpansion("");
    setCommitment({});
    setCurrentStep(0);
    setShowResults(false);
    setHasStarted(true);
  };

  const handleViewSaved = () => {
    if (savedAssessment) {
      setSetAnswers(savedAssessment.setAnswers);
      setReflections(savedAssessment.reflections);
      setBarriers(savedAssessment.barriers);
      setBarrierExpansion(savedAssessment.barrierExpansion);
      setCommitment(savedAssessment.commitment);
      setShowResults(true);
      setHasStarted(true);
    }
  };

  const primaryApproach = calculatePrimaryApproach();
  const profile = coachProfiles[primaryApproach];
  const ProfileIcon = profile.icon;

  // Start screen
  if (!hasStarted) {
    return (
      <ProjectLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">Which Coach Are You?</h1>
            <p className="text-muted-foreground">
              A reflection worksheet to understand your current coaching approach.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="elevated">
              <CardHeader>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 gradient-primary rounded-xl flex items-center justify-center">
                    <Users className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">Reflection Worksheet</CardTitle>
                    <CardDescription>~15 minutes</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">Introduction</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    In this assessment, you'll learn about three different coaching approaches and their long-term outcomes:
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <Heart className="w-5 h-5 text-success mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Maya (The Community Builder)</p>
                        <p className="text-sm text-muted-foreground">Relationship-first approach with compound growth</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-5 h-5 text-warning mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Derek (The Direct Seller)</p>
                        <p className="text-sm text-muted-foreground">Quick wins that lead to burnout</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Package className="w-5 h-5 text-secondary mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">Lauren (The Product-Centric Coach)</p>
                        <p className="text-sm text-muted-foreground">Quality without audience</p>
                      </div>
                    </div>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground">
                  This worksheet will help you honestly assess which approach you're currently using, understand the long-term trajectory you're on, and identify what needs to change.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button onClick={() => setHasStarted(true)} className="flex-1">
                    Start Assessment
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  {savedAssessment && (
                    <Button variant="outline" onClick={handleViewSaved} className="flex-1">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      View Previous Results
                    </Button>
                  )}
                </div>

                {savedAssessment && (
                  <p className="text-xs text-muted-foreground text-center">
                    Last completed: {new Date(savedAssessment.completedAt).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </ProjectLayout>
    );
  }

  // Results screen
  if (showResults) {
    return (
      <ProjectLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">Your Results</h1>
            <p className="text-muted-foreground">
              Understanding your current coaching trajectory.
            </p>
          </motion.div>

          {/* Primary Approach Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="elevated" className={profile.bgColor}>
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <div className={`w-20 h-20 rounded-full ${profile.bgColor} ${profile.color} mx-auto flex items-center justify-center mb-4 border-4 border-current`}>
                    <ProfileIcon className="w-10 h-10" />
                  </div>
                  <Badge className="mb-2">Primary Approach</Badge>
                  <h2 className="text-2xl font-bold text-foreground">{profile.title}</h2>
                  <p className="text-lg text-muted-foreground mt-1">You're currently like {profile.name}</p>
                </div>

                <p className="text-muted-foreground mb-6">{profile.description}</p>

                {/* Trajectory */}
                <div className="mb-6">
                  <h4 className="font-medium text-foreground mb-3">Your Long-Term Trajectory:</h4>
                  <div className="space-y-2">
                    {profile.trajectory.map((t, idx) => (
                      <div key={idx} className="flex gap-3 text-sm">
                        <span className="font-medium text-foreground min-w-[80px]">{t.period}:</span>
                        <span className="text-muted-foreground">{t.description}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Challenges & Advantages */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div className="p-4 bg-background/50 rounded-lg">
                    <h4 className="font-medium text-foreground mb-2">Challenges:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {profile.challenges.map((c, idx) => (
                        <li key={idx}>• {c}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 bg-background/50 rounded-lg">
                    <h4 className="font-medium text-foreground mb-2">Advantages:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {profile.advantages.map((a, idx) => (
                        <li key={idx}>• {a}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Focus */}
                <div className="p-4 bg-primary/10 rounded-lg">
                  <h4 className="font-medium text-foreground mb-1">What to Focus On:</h4>
                  <p className="text-sm text-muted-foreground">{profile.focus}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Reflection Questions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Reflection Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {reflectionQuestions.map((q) => (
                  <div key={q.id}>
                    <Label className="text-sm font-medium text-foreground mb-2 block">
                      {q.question}
                    </Label>
                    <Textarea
                      value={reflections[q.id] || ""}
                      onChange={(e) => setReflections((prev) => ({ ...prev, [q.id]: e.target.value }))}
                      placeholder="Write your answer here..."
                      rows={3}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Barriers (only if not Maya) */}
          {primaryApproach !== "maya" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>What's Preventing the Shift to Community Building?</CardTitle>
                  <CardDescription>Check all that apply</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {barrierOptions.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={option}
                        checked={barriers.includes(option)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setBarriers([...barriers, option]);
                          } else {
                            setBarriers(barriers.filter((b) => b !== option));
                          }
                        }}
                      />
                      <Label htmlFor={option} className="text-sm text-foreground cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="other"
                      checked={barrierOther.length > 0}
                      onCheckedChange={(checked) => {
                        if (!checked) setBarrierOther("");
                      }}
                    />
                    <Input
                      placeholder="Other..."
                      value={barrierOther}
                      onChange={(e) => setBarrierOther(e.target.value)}
                      className="flex-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-foreground mb-2 block">
                      The biggest barrier for me is:
                    </Label>
                    <Textarea
                      value={barrierExpansion}
                      onChange={(e) => setBarrierExpansion(e.target.value)}
                      placeholder="Expand on your biggest barrier..."
                      rows={3}
                    />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Commitment Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Your Commitment</CardTitle>
                <CardDescription>Based on this reflection, complete these statements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {commitmentFields.map((field) => (
                  <div key={field.id}>
                    <Label className="text-sm font-medium text-foreground mb-2 block">
                      {field.label}
                    </Label>
                    <Input
                      value={commitment[field.id] || ""}
                      onChange={(e) => setCommitment((prev) => ({ ...prev, [field.id]: e.target.value }))}
                      placeholder="Your answer..."
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>

          {/* Important Reminders */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card variant="elevated" className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">Important Reminders</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• <strong>No judgment:</strong> Maya started as a mix of Derek and Lauren. She shifted over time through intentional practice.</li>
                  <li>• <strong>Hybrid is normal:</strong> Most coaches are a combination of approaches. The question is: which direction are you moving?</li>
                  <li>• <strong>Change is possible:</strong> Your current approach isn't permanent. This course will teach you how to shift.</li>
                  <li>• <strong>Awareness is step one:</strong> Simply recognizing where you are is a huge breakthrough.</li>
                  <li>• <strong>Action is step two:</strong> Awareness without action keeps you stuck. Commit to the full Maya Method.</li>
                </ul>
              </CardContent>
            </Card>
          </motion.div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Button onClick={handleSave} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Save Assessment
            </Button>
            {savedAssessment && !savedAssessment.reminderScheduled && (
              <Button 
                onClick={handleScheduleReminder} 
                variant="secondary" 
                className="flex-1"
                disabled={isSendingReminder}
              >
                {isSendingReminder ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 mr-2" />
                )}
                Schedule 90-Day Reminder
              </Button>
            )}
            {savedAssessment?.reminderScheduled && (
              <Button variant="outline" disabled className="flex-1">
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Reminder Scheduled
              </Button>
            )}
            <Button onClick={handleRetake} variant="outline" className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake Assessment
            </Button>
          </motion.div>
        </div>
      </ProjectLayout>
    );
  }

  // Assessment screen (Part by part)
  const currentPart = setQuestions[currentStep];
  const progress = ((currentStep + 1) / setQuestions.length) * 100;

  return (
    <ProjectLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Progress Bar */}
        <AssessmentProgressBar
          currentStep={currentStep}
          totalSteps={setQuestions.length}
          stepLabel={`Part ${currentStep + 1} of ${setQuestions.length} • ${currentPart.part}`}
        />

        {/* Sets */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            {currentPart.sets.map((set) => {
              const coachProfile = coachProfiles[set.category];
              const CoachIcon = coachProfile.icon;
              
              return (
                <Card key={set.id} variant="elevated">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg ${coachProfile.bgColor} flex items-center justify-center`}>
                        <CoachIcon className={`w-5 h-5 ${coachProfile.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-base">{coachProfile.name}'s Approach</CardTitle>
                        <CardDescription className="text-xs">{coachProfile.title}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {set.statements.map((statement, idx) => {
                        const key = `${set.id}_${idx}`;
                        return (
                          <div key={key} className="flex items-start space-x-3">
                            <Checkbox
                              id={key}
                              checked={checkedStatements[key] || false}
                              onCheckedChange={() => handleStatementToggle(set.id, idx)}
                            />
                            <Label 
                              htmlFor={key} 
                              className="text-sm text-foreground cursor-pointer leading-relaxed"
                            >
                              {statement}
                            </Label>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex flex-col sm:flex-row justify-between gap-3">
          <Button
            variant="outline"
            onClick={handlePrevPart}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={handleSaveProgress}>
              <Save className="w-4 h-4 mr-2" />
              Save Progress
            </Button>
            <Button onClick={handleNextPart}>
              {currentStep === setQuestions.length - 1 ? "See Results" : "Next"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </ProjectLayout>
  );
};

export default CoachAssessment;
