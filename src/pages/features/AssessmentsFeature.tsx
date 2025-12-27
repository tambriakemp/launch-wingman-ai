import { ClipboardCheck, Target, Compass, Heart, TrendingUp, CheckCircle } from "lucide-react";
import { FeaturePageLayout } from "@/components/landing/FeaturePageLayout";
import { AssessmentMockup } from "@/components/landing/screenshots/AssessmentMockup";

const features = [
  {
    icon: Target,
    title: "Launch Readiness Quiz",
    description: "Discover where you stand with your launch preparedness through our comprehensive 15-question assessment.",
  },
  {
    icon: Compass,
    title: "Coaching Style Assessment",
    description: "Identify your business approach and understand if you're building sustainably or heading toward burnout.",
  },
  {
    icon: Heart,
    title: "Why Statement Builder",
    description: "Connect your deeper purpose to your launch strategy with our guided reflection worksheet.",
  },
  {
    icon: TrendingUp,
    title: "Progress Tracking",
    description: "Save your results, retake assessments over time, and track your growth as a launcher.",
  },
  {
    icon: CheckCircle,
    title: "Personalized Insights",
    description: "Get tailored recommendations based on your unique assessment results and coaching style.",
  },
  {
    icon: ClipboardCheck,
    title: "Section Scoring",
    description: "Understand your strengths and weaknesses across different areas of launch preparation.",
  },
];

const benefits = [
  "Know exactly where you stand before your next launch",
  "Identify blind spots in your current approach",
  "Get personalized recommendations for improvement",
  "Track your progress over time",
];

const AssessmentsFeature = () => {
  return (
    <FeaturePageLayout
      icon={ClipboardCheck}
      title="Know Where You Stand"
      highlightedWord="Stand"
      subtitle="Self-assessments that reveal your launch readiness"
      description="Before you can improve, you need to know where you are. Our assessment tools help you understand your current launch approach, identify gaps, and create a roadmap for success."
      features={features}
      benefits={benefits}
      screenshot={<AssessmentMockup />}
    />
  );
};

export default AssessmentsFeature;
