import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ProjectLayout } from "@/components/layout/ProjectLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ClipboardCheck,
  Users,
  ArrowRight,
  Target,
  Heart,
  Clock,
  CheckCircle2,
  Trophy,
  Rocket,
  DollarSign,
  Package,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getAssessmentData, ASSESSMENT_KEYS } from "@/lib/assessmentStorage";

interface SavedLaunchAssessment {
  answers: Record<number, number>;
  reflections: Record<string, string>;
  score: number;
  completedAt: string;
}

interface SavedCoachAssessment {
  setAnswers: Record<string, string>;
  reflections: Record<string, string>;
  barriers: string[];
  barrierExpansion: string;
  commitment: Record<string, string>;
  primaryApproach: "maya" | "derek" | "lauren";
  completedAt: string;
}

interface SavedWhyStatement {
  completedAt: string;
  whyStatement?: string;
}

const getLaunchResultSummary = (score: number) => {
  if (score <= 15) {
    return { title: "The Announcer", icon: Target, color: "text-warning", range: "0-15" };
  } else if (score <= 30) {
    return { title: "The Partial Prelauncher", icon: Rocket, color: "text-secondary", range: "16-30" };
  } else {
    return { title: "The Strategic Prelauncher", icon: Trophy, color: "text-success", range: "31-45" };
  }
};

const getCoachResultSummary = (primaryApproach: "maya" | "derek" | "lauren") => {
  const profiles = {
    maya: { title: "Maya - The Community Builder", icon: Heart, color: "text-success" },
    derek: { title: "Derek - The Direct Seller", icon: DollarSign, color: "text-warning" },
    lauren: { title: "Lauren - The Product-Centric Coach", icon: Package, color: "text-secondary" },
  };
  return profiles[primaryApproach];
};

const assessments = [
  {
    id: "launch",
    title: "What's Your Current Launch Approach?",
    description: "Discover your current launch strategy and get personalized recommendations to improve your prelaunch process.",
    icon: ClipboardCheck,
    href: "/assessments/launch",
    duration: "~10 minutes",
    questions: 15,
    color: "text-primary",
    bgColor: "bg-primary/10",
    categories: ["Pre-Launch Content", "Engagement", "Trust Building", "Data Gathering", "Launch Mindset"],
    storageKey: ASSESSMENT_KEYS.LAUNCH,
  },
  {
    id: "coach",
    title: "Which Coach Are You?",
    description: "Understand which coaching approach you're currently using and learn about your long-term business trajectory.",
    icon: Users,
    href: "/assessments/coach",
    duration: "~15 minutes",
    questions: 4,
    color: "text-secondary",
    bgColor: "bg-secondary/10",
    categories: ["Maya (Community Builder)", "Derek (Direct Seller)", "Lauren (Product-Centric)"],
    storageKey: ASSESSMENT_KEYS.COACH,
  },
  {
    id: "why-statement",
    title: "Personal \"Why Statement\" for Mastering Prelaunch",
    description: "Create a personal Why Statement that will keep you motivated through the learning process and remind you why you're investing in this system.",
    icon: Heart,
    href: "/assessments/why-statement",
    duration: "~20 minutes",
    questions: 8,
    color: "text-accent",
    bgColor: "bg-accent/10",
    categories: ["Current Reality", "Desired Future", "8 Benefits", "Deeper Why", "Commitment"],
    storageKey: ASSESSMENT_KEYS.WHY_STATEMENT,
  },
];

const Assessments = () => {
  const { user } = useAuth();
  const [savedResults, setSavedResults] = useState<{
    launch: SavedLaunchAssessment | null;
    coach: SavedCoachAssessment | null;
    whyStatement: SavedWhyStatement | null;
  }>({
    launch: null,
    coach: null,
    whyStatement: null,
  });

  useEffect(() => {
    if (!user?.id) return;
    
    // Load saved assessments from localStorage with user-scoped keys
    const launchData = getAssessmentData<SavedLaunchAssessment>(ASSESSMENT_KEYS.LAUNCH, user.id);
    const coachData = getAssessmentData<SavedCoachAssessment>(ASSESSMENT_KEYS.COACH, user.id);
    const whyData = getAssessmentData<SavedWhyStatement>(ASSESSMENT_KEYS.WHY_STATEMENT, user.id);

    setSavedResults({
      launch: launchData,
      coach: coachData,
      whyStatement: whyData,
    });
  }, [user?.id]);

  const getAssessmentResult = (assessmentId: string) => {
    switch (assessmentId) {
      case "launch":
        if (savedResults.launch?.score !== undefined) {
          return getLaunchResultSummary(savedResults.launch.score);
        }
        return null;
      case "coach":
        if (savedResults.coach?.primaryApproach) {
          return getCoachResultSummary(savedResults.coach.primaryApproach);
        }
        return null;
      case "why-statement":
        if (savedResults.whyStatement?.completedAt) {
          return { title: "Why Statement Created", icon: CheckCircle2, color: "text-success" };
        }
        return null;
      default:
        return null;
    }
  };

  const getCompletedDate = (assessmentId: string) => {
    switch (assessmentId) {
      case "launch":
        return savedResults.launch?.completedAt;
      case "coach":
        return savedResults.coach?.completedAt;
      case "why-statement":
        return savedResults.whyStatement?.completedAt;
      default:
        return null;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <ProjectLayout>
      <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 px-4 md:px-0">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">Assessments</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Take these assessments to understand your current approach and get personalized recommendations.
          </p>
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium text-foreground mb-1">Why Take These Assessments?</h3>
                  <p className="text-sm text-muted-foreground">
                    Understanding where you are now is the first step to growth. These assessments provide honest 
                    feedback about your current approach and actionable insights to help you build a more sustainable, 
                    successful coaching business. Your results are saved so you can track your progress over time.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid gap-6">
          {assessments.map((assessment, index) => {
            const result = getAssessmentResult(assessment.id);
            const completedDate = getCompletedDate(assessment.id);
            const isCompleted = !!result;
            const ResultIcon = result?.icon;

            return (
              <motion.div
                key={assessment.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
              >
                <Card variant="elevated" className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="flex items-start gap-3 md:gap-4">
                          <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl ${assessment.bgColor} flex items-center justify-center shrink-0`}>
                            <assessment.icon className={`w-5 h-5 md:w-7 md:h-7 ${assessment.color}`} />
                          </div>
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <CardTitle className="text-base md:text-xl">{assessment.title}</CardTitle>
                              {isCompleted && (
                                <Badge variant="outline" className="text-success border-success/30 bg-success/10 text-[10px] md:text-xs">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  Completed
                                </Badge>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1">
                              <Badge variant="outline" className="text-[10px] md:text-xs">
                                <Clock className="w-3 h-3 mr-1" />
                                {assessment.duration}
                              </Badge>
                              <Badge variant="outline" className="text-[10px] md:text-xs">
                                <Target className="w-3 h-3 mr-1" />
                                {assessment.questions} {assessment.questions === 1 ? "part" : assessment.questions > 10 ? "questions" : "parts"}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription className="text-base">
                      {assessment.description}
                    </CardDescription>

                    {/* Result Summary when completed */}
                    {isCompleted && result && (
                      <div className="p-4 bg-muted/50 rounded-lg border border-border">
                        <div className="flex items-center gap-3">
                          {ResultIcon && <ResultIcon className={`w-5 h-5 ${result.color}`} />}
                          <div>
                            <p className={`font-medium ${result.color}`}>{result.title}</p>
                            {completedDate && (
                              <p className="text-xs text-muted-foreground">
                                Completed on {formatDate(completedDate)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button asChild className="w-full sm:w-auto">
                        <Link to={assessment.href}>
                          {isCompleted ? "View Results" : "Start Assessment"}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      </div>
    </ProjectLayout>
  );
};

export default Assessments;
