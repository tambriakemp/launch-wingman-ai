import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
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
} from "lucide-react";

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
  },
];

const Assessments = () => {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">Assessments</h1>
          <p className="text-muted-foreground">
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
          {assessments.map((assessment, index) => (
            <motion.div
              key={assessment.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
            >
              <Card variant="elevated" className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-xl ${assessment.bgColor} flex items-center justify-center`}>
                        <assessment.icon className={`w-7 h-7 ${assessment.color}`} />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{assessment.title}</CardTitle>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="outline" className="text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {assessment.duration}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
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
                  
                  <div className="flex flex-wrap gap-2">
                    {assessment.categories.map((category) => (
                      <Badge key={category} variant="secondary" className="text-xs">
                        {category}
                      </Badge>
                    ))}
                  </div>

                  <Button asChild className="w-full sm:w-auto">
                    <Link to={assessment.href}>
                      View Assessment
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Assessments;
