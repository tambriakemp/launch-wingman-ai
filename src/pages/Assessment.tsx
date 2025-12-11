import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  ClipboardCheck,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Save,
  CheckCircle2,
  Trophy,
  Target,
  Rocket,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Question {
  id: number;
  section: string;
  question: string;
  options: { label: string; text: string; points: number }[];
}

interface SavedAssessment {
  answers: Record<number, number>;
  reflections: Record<string, string>;
  score: number;
  completedAt: string;
}

const questions: Question[] = [
  // Section 1: Pre-Launch Content Strategy
  {
    id: 1,
    section: "Pre-Launch Content Strategy",
    question: "Before opening enrollment, how long do you typically create focused content about your program topic?",
    options: [
      { label: "A", text: "I don't really do focused content beforehand - I just announce when ready", points: 0 },
      { label: "B", text: "About 1-2 weeks of occasional posts", points: 1 },
      { label: "C", text: "About 3-4 weeks of consistent, focused content", points: 2 },
      { label: "D", text: "6-8+ weeks of strategic, targeted content", points: 3 },
    ],
  },
  {
    id: 2,
    section: "Pre-Launch Content Strategy",
    question: "During the weeks before launch, your content is:",
    options: [
      { label: "A", text: "Random topics - whatever I feel like posting", points: 0 },
      { label: "B", text: "Mix of general business tips and some mentions of my topic", points: 1 },
      { label: "C", text: "Mostly focused on my transformation but some off-topic posts", points: 2 },
      { label: "D", text: "Everything connects directly to the specific transformation I help with", points: 3 },
    ],
  },
  {
    id: 3,
    section: "Pre-Launch Content Strategy",
    question: "The content you create before launch is designed to:",
    options: [
      { label: "A", text: "Keep me visible - just posting to stay active", points: 0 },
      { label: "B", text: "Build my authority as an expert", points: 1 },
      { label: "C", text: "Educate my audience about the problem and solution", points: 2 },
      { label: "D", text: "Build trust, create desire, and establish momentum toward my offer", points: 3 },
    ],
  },
  // Section 2: Engagement & Relationship Building
  {
    id: 4,
    section: "Engagement & Relationship Building",
    question: "In the weeks before launch, how often do you create opportunities for audience engagement?",
    options: [
      { label: "A", text: "Rarely - I mostly just post content", points: 0 },
      { label: "B", text: "Sometimes - occasionally ask questions or go live", points: 1 },
      { label: "C", text: "Regularly - weekly lives, questions, or engagement posts", points: 2 },
      { label: "D", text: "Consistently - multiple engagement opportunities per week", points: 3 },
    ],
  },
  {
    id: 5,
    section: "Engagement & Relationship Building",
    question: "How do you interact with people who comment or engage with your content?",
    options: [
      { label: "A", text: "I don't usually respond or respond very briefly", points: 0 },
      { label: "B", text: "I like comments or give short replies", points: 1 },
      { label: "C", text: "I respond thoughtfully to most comments", points: 2 },
      { label: "D", text: "I respond thoughtfully and sometimes move conversations to DMs for deeper connection", points: 3 },
    ],
  },
  {
    id: 6,
    section: "Engagement & Relationship Building",
    question: "Before launching, you:",
    options: [
      { label: "A", text: "Don't really talk to individual people - just post publicly", points: 0 },
      { label: "B", text: "Occasionally respond to DMs but don't initiate conversations", points: 1 },
      { label: "C", text: "Regularly engage with active community members", points: 2 },
      { label: "D", text: "Intentionally build relationships with core community (20-30 people minimum)", points: 3 },
    ],
  },
  // Section 3: Trust Building & Social Proof
  {
    id: 7,
    section: "Trust Building & Social Proof",
    question: "In your pre-launch content, you share:",
    options: [
      { label: "A", text: "Mostly what I'm launching and why people should buy", points: 0 },
      { label: "B", text: "Some valuable tips but mostly about my upcoming program", points: 1 },
      { label: "C", text: "Good mix of valuable teaching and program mentions", points: 2 },
      { label: "D", text: "Primarily valuable content that helps people, with program naturally mentioned", points: 3 },
    ],
  },
  {
    id: 8,
    section: "Trust Building & Social Proof",
    question: "How do you demonstrate you can help people achieve the transformation?",
    options: [
      { label: "A", text: "I tell them about my credentials or experience", points: 0 },
      { label: "B", text: "I share my own transformation story", points: 1 },
      { label: "C", text: "I share my story plus some client results", points: 2 },
      { label: "D", text: "I consistently share my journey AND multiple client transformations with specific details", points: 3 },
    ],
  },
  {
    id: 9,
    section: "Trust Building & Social Proof",
    question: "The testimonials and social proof you use are:",
    options: [
      { label: "A", text: "I don't have testimonials yet or don't share them", points: 0 },
      { label: "B", text: "Generic praise like \"This was great!\"", points: 1 },
      { label: "C", text: "Some specific results but not very detailed", points: 2 },
      { label: "D", text: "Highly specific transformations with before/after details", points: 3 },
    ],
  },
  // Section 4: Data Gathering & Strategy
  {
    id: 10,
    section: "Data Gathering & Strategy",
    question: "During your pre-launch period, you track:",
    options: [
      { label: "A", text: "Nothing specific - I just see what happens", points: 0 },
      { label: "B", text: "Basic metrics like follower count", points: 1 },
      { label: "C", text: "Engagement rates and which posts do well", points: 2 },
      { label: "D", text: "Detailed metrics: engagement, DMs, questions asked, objections, most engaged people", points: 3 },
    ],
  },
  {
    id: 11,
    section: "Data Gathering & Strategy",
    question: "When people ask questions during pre-launch, you:",
    options: [
      { label: "A", text: "Answer them and move on", points: 0 },
      { label: "B", text: "Answer them and remember some patterns", points: 1 },
      { label: "C", text: "Answer them and keep a mental note of common questions", points: 2 },
      { label: "D", text: "Answer them and document all questions to identify patterns and refine messaging", points: 3 },
    ],
  },
  {
    id: 12,
    section: "Data Gathering & Strategy",
    question: "Your launch strategy is based on:",
    options: [
      { label: "A", text: "What I think will work or what I've seen others do", points: 0 },
      { label: "B", text: "General best practices I've learned", points: 1 },
      { label: "C", text: "Some data from past launches plus best practices", points: 2 },
      { label: "D", text: "Detailed data from my specific audience's behavior and preferences", points: 3 },
    ],
  },
  // Section 5: Launch Mindset & Approach
  {
    id: 13,
    section: "Launch Mindset & Approach",
    question: "When you announce your program, you feel:",
    options: [
      { label: "A", text: "Nervous, pushy, like I'm bothering people", points: 0 },
      { label: "B", text: "Uncertain but hopeful", points: 1 },
      { label: "C", text: "Fairly confident - I've prepared well", points: 2 },
      { label: "D", text: "Excited and confident - people have been asking for this", points: 3 },
    ],
  },
  {
    id: 14,
    section: "Launch Mindset & Approach",
    question: "During launch week, you spend most time:",
    options: [
      { label: "A", text: "Convincing and persuading people to buy", points: 0 },
      { label: "B", text: "Explaining the program and answering objections", points: 1 },
      { label: "C", text: "Answering questions and sharing more value", points: 2 },
      { label: "D", text: "Having conversations with prepared, interested people who are ready to decide", points: 3 },
    ],
  },
  {
    id: 15,
    section: "Launch Mindset & Approach",
    question: "After cart closes, your typical conversion rate is:",
    options: [
      { label: "A", text: "Under 1% of my audience", points: 0 },
      { label: "B", text: "1-3% of my audience", points: 1 },
      { label: "C", text: "3-5% of my audience", points: 2 },
      { label: "D", text: "5%+ of my audience OR 10%+ of my engaged audience", points: 3 },
    ],
  },
];

const reflectionQuestions = [
  {
    id: "surprise",
    question: "Which area surprised you most - where you scored higher or lower than expected?",
  },
  {
    id: "pillar",
    question: "Looking at your answers, which of the four pillars do you need to focus on most? (Targeted Content, Engagement Opportunities, Trust Building, or Data Gathering)",
  },
  {
    id: "commitment",
    question: "What's one specific thing you can commit to improving in your next launch?",
  },
  {
    id: "aha",
    question: "Based on this assessment, what's your biggest \"aha\" moment about prelaunch?",
  },
];

const getResultCategory = (score: number) => {
  if (score <= 15) {
    return {
      title: "The Announcer",
      range: "0-15 Points",
      icon: Target,
      color: "text-warning",
      bgColor: "bg-warning/10",
      description: "You're currently using an announcement-based approach. You create a program and announce it, hoping people will buy. This approach typically leads to low conversions, high stress, and burnout.",
      meaning: "You need to learn the complete prelaunch strategy from scratch. The good news: You have the most room for dramatic improvement!",
      focus: "Work through this entire course systematically. Pay special attention to Modules 3-5 (Content Foundation, Valuable Content Mastery, and Real Relationships).",
    };
  } else if (score <= 30) {
    return {
      title: "The Partial Prelauncher",
      range: "16-30 Points",
      icon: Rocket,
      color: "text-secondary",
      bgColor: "bg-secondary/10",
      description: "You're doing some prelaunch activities, but not systematically or strategically. You might create content beforehand, but it's not targeted enough. You might engage, but not deeply. You have pieces of the puzzle but not the complete system.",
      meaning: "You understand prelaunch is important, but you're missing key components or not executing them fully. Your launches probably have some success but feel harder than they should.",
      focus: "Identify which of the four pillars you're weakest in (Targeted Content, Engagement, Trust Building, or Data Gathering) and strengthen those areas. Pay special attention to Module 6 (Launch with Momentum).",
    };
  } else {
    return {
      title: "The Strategic Prelauncher",
      range: "31-45 Points",
      icon: Trophy,
      color: "text-success",
      bgColor: "bg-success/10",
      description: "You're already implementing a solid prelaunch strategy! You understand the importance of preparation, relationship-building, and strategic content. Your launches probably feel much better than they used to.",
      meaning: "You're on the right track. This course will help you refine your system, fill any gaps, and learn advanced strategies to make launches even easier.",
      focus: "Look for areas to optimize and scale. Pay special attention to Module 7 (Community Building) and the Bonus Modules on measurement and continuous improvement.",
    };
  }
};

const STORAGE_KEY = "coach_hub_launch_assessment";

const Assessment = () => {
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [reflections, setReflections] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [showReflections, setShowReflections] = useState(false);
  const [savedAssessment, setSavedAssessment] = useState<SavedAssessment | null>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setSavedAssessment(JSON.parse(saved));
    }
  }, []);

  const totalScore = Object.values(answers).reduce((sum, points) => sum + points, 0);
  const progress = (Object.keys(answers).length / questions.length) * 100;
  const currentQuestionData = questions[currentQuestion];
  const currentSection = currentQuestionData?.section;

  const handleAnswer = (questionId: number, points: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: points }));
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSave = () => {
    const assessment: SavedAssessment = {
      answers,
      reflections,
      score: totalScore,
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(assessment));
    setSavedAssessment(assessment);
    toast({
      title: "Assessment Saved",
      description: "Your assessment has been saved successfully.",
    });
  };

  const handleRetake = () => {
    setAnswers({});
    setReflections({});
    setCurrentQuestion(0);
    setShowResults(false);
    setShowReflections(false);
    setHasStarted(true);
  };

  const handleViewSaved = () => {
    if (savedAssessment) {
      setAnswers(savedAssessment.answers);
      setReflections(savedAssessment.reflections);
      setShowResults(true);
      setHasStarted(true);
    }
  };

  const result = getResultCategory(totalScore);
  const ResultIcon = result.icon;

  // Start screen
  if (!hasStarted) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">Launch Assessment</h1>
            <p className="text-muted-foreground">
              Discover your current launch approach and get personalized recommendations.
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
                    <ClipboardCheck className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <div>
                    <CardTitle className="text-xl">What's Your Current Launch Approach?</CardTitle>
                    <CardDescription>15 questions • ~10 minutes</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium text-foreground mb-2">Instructions</h4>
                  <p className="text-sm text-muted-foreground">
                    Answer each question honestly based on your most recent launch (or how you plan to launch if you haven't yet). 
                    There are no wrong answers - this quiz is designed to help you understand where you are now so you can improve.
                  </p>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-medium">1</span>
                    </div>
                    <span className="text-muted-foreground">Pre-Launch Content Strategy</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-medium">2</span>
                    </div>
                    <span className="text-muted-foreground">Engagement & Relationship Building</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-medium">3</span>
                    </div>
                    <span className="text-muted-foreground">Trust Building & Social Proof</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-medium">4</span>
                    </div>
                    <span className="text-muted-foreground">Data Gathering & Strategy</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-medium">5</span>
                    </div>
                    <span className="text-muted-foreground">Launch Mindset & Approach</span>
                  </div>
                </div>

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
      </DashboardLayout>
    );
  }

  // Results screen
  if (showResults) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-foreground mb-2">Your Results</h1>
            <p className="text-muted-foreground">
              Here's your personalized launch assessment analysis.
            </p>
          </motion.div>

          {/* Score Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
          >
            <Card variant="elevated" className={result.bgColor}>
              <CardContent className="pt-6">
                <div className="text-center mb-6">
                  <div className={`w-20 h-20 rounded-full ${result.bgColor} ${result.color} mx-auto flex items-center justify-center mb-4 border-4 border-current`}>
                    <ResultIcon className="w-10 h-10" />
                  </div>
                  <Badge className="mb-2">{result.range}</Badge>
                  <h2 className="text-2xl font-bold text-foreground">{result.title}</h2>
                  <p className="text-4xl font-bold text-primary mt-2">{totalScore}/45</p>
                </div>

                <div className="space-y-4 text-left">
                  <div>
                    <h4 className="font-medium text-foreground mb-1">What this means:</h4>
                    <p className="text-sm text-muted-foreground">{result.description}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground mb-1">The significance:</h4>
                    <p className="text-sm text-muted-foreground">{result.meaning}</p>
                  </div>
                  <div className="p-4 bg-background/50 rounded-lg">
                    <h4 className="font-medium text-foreground mb-1">Your focus:</h4>
                    <p className="text-sm text-muted-foreground">{result.focus}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Section Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Section Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {["Pre-Launch Content Strategy", "Engagement & Relationship Building", "Trust Building & Social Proof", "Data Gathering & Strategy", "Launch Mindset & Approach"].map((section, idx) => {
                    const sectionQuestions = questions.filter((q) => q.section === section);
                    const sectionScore = sectionQuestions.reduce((sum, q) => sum + (answers[q.id] || 0), 0);
                    const maxScore = sectionQuestions.length * 3;
                    const percentage = (sectionScore / maxScore) * 100;

                    return (
                      <div key={section}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{section}</span>
                          <span className="font-medium text-foreground">{sectionScore}/{maxScore}</span>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Reflection Questions */}
          {!showReflections ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Button onClick={() => setShowReflections(true)} variant="outline" className="w-full">
                Complete Reflection Questions
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card variant="elevated">
                <CardHeader>
                  <CardTitle>Reflection Questions</CardTitle>
                  <CardDescription>Take a moment to reflect on your assessment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {reflectionQuestions.map((q) => (
                    <div key={q.id}>
                      <label className="block text-sm font-medium text-foreground mb-2">
                        {q.question}
                      </label>
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
          )}

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Button onClick={handleSave} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Save Assessment
            </Button>
            <Button onClick={handleRetake} variant="outline" className="flex-1">
              <RotateCcw className="w-4 h-4 mr-2" />
              Retake Assessment
            </Button>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  // Quiz screen
  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Progress Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline">{currentSection}</Badge>
            <span className="text-sm text-muted-foreground">
              Question {currentQuestion + 1} of {questions.length}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </motion.div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            <Card variant="elevated">
              <CardHeader>
                <CardTitle className="text-lg leading-relaxed">
                  {currentQuestionData.question}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentQuestionData.options.map((option) => {
                    const isSelected = answers[currentQuestionData.id] === option.points;
                    return (
                      <button
                        key={option.label}
                        onClick={() => handleAnswer(currentQuestionData.id, option.points)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/50 hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {option.label}
                          </span>
                          <span className="text-foreground">{option.text}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={answers[currentQuestionData.id] === undefined}
          >
            {currentQuestion === questions.length - 1 ? "See Results" : "Next"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Assessment;
