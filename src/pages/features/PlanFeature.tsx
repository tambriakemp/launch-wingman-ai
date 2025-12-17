import { Layout, Users, Sparkles, Target, Layers, Cpu, Workflow, GitBranch } from "lucide-react";
import { FeaturePageLayout } from "@/components/landing/FeaturePageLayout";

const features = [
  {
    icon: GitBranch,
    title: "Funnel Type Selection",
    description: "Choose from 8+ proven funnel types including Freebie, Low-Ticket, Webinar, Challenge, and Launch funnels.",
  },
  {
    icon: Users,
    title: "Value Equation Builder",
    description: "Define your audience using Alex Hormozi's framework—WHO, Dream Outcome, Pain, Likelihood, and Time+Effort.",
  },
  {
    icon: Sparkles,
    title: "AI Transformation Statements",
    description: "Generate compelling transformation statements in multiple styles—punchy, practical, emotional, or authority-driven.",
  },
  {
    icon: Layers,
    title: "Offer Stack Builder",
    description: "Configure multiple offers per funnel with AI-generated titles, descriptions, and pricing suggestions.",
  },
  {
    icon: Cpu,
    title: "Tech Stack Selection",
    description: "Choose your funnel builder, email platform, and community platform from curated recommendations.",
  },
  {
    icon: Workflow,
    title: "Auto-Generated Checklist",
    description: "Get a complete asset checklist based on your funnel type—pages, emails, content, and deliverables.",
  },
];

const benefits = [
  "Build your entire funnel foundation in under an hour",
  "AI-powered audience and transformation insights",
  "Multiple funnel types with pre-configured offer slots",
  "Clear asset checklist for execution",
];

const PlanFeature = () => {
  return (
    <FeaturePageLayout
      icon={Layout}
      title="Build Your Launch Foundation"
      highlightedWord="Foundation"
      subtitle="Strategic planning powered by AI"
      description="Stop guessing what you need. Our planning tools help you define your funnel, understand your audience deeply, craft irresistible offers, and know exactly what assets to create."
      features={features}
      benefits={benefits}
    />
  );
};

export default PlanFeature;
